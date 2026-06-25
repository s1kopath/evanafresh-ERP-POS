<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Resize + re-encode uploaded images before they hit local storage, so we never
 * keep multi-MB phone photos around. Output is WebP (small, supports alpha) when
 * GD has WebP support, otherwise JPEG. Falls back to storing the original if GD
 * is unavailable or the file can't be decoded.
 */
class ImageOptimizer
{
    public static function store(
        UploadedFile $file,
        string $dir = 'products',
        int $max = 600,
        int $quality = 80,
        string $disk = 'public',
    ): string {
        if (! extension_loaded('gd')) {
            return $file->store($dir, $disk);
        }

        [$src, $width, $height] = self::decode($file);
        if (! $src) {
            return $file->store($dir, $disk);
        }

        // Fit within max×max — only ever downscale.
        $scale = min(1, $max / max($width, $height));
        $newW = max(1, (int) round($width * $scale));
        $newH = max(1, (int) round($height * $scale));

        $canvas = imagecreatetruecolor($newW, $newH);
        $webp = function_exists('imagewebp');

        if ($webp) {
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            imagefilledrectangle($canvas, 0, 0, $newW, $newH, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        } else {
            // JPEG has no alpha — flatten onto white.
            imagefilledrectangle($canvas, 0, 0, $newW, $newH, imagecolorallocate($canvas, 255, 255, 255));
        }

        imagecopyresampled($canvas, $src, 0, 0, 0, 0, $newW, $newH, $width, $height);
        imagedestroy($src);

        ob_start();
        if ($webp) {
            imagewebp($canvas, null, $quality);
            $ext = 'webp';
        } else {
            imagejpeg($canvas, null, $quality);
            $ext = 'jpg';
        }
        $binary = ob_get_clean();
        imagedestroy($canvas);

        $path = $dir.'/'.Str::random(40).'.'.$ext;
        Storage::disk($disk)->put($path, $binary);

        return $path;
    }

    /**
     * Decode the upload into a GD image, honoring JPEG EXIF orientation.
     *
     * @return array{0: \GdImage|false, 1: int, 2: int}
     */
    private static function decode(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        $info = @getimagesize($path);
        if (! $info) {
            return [false, 0, 0];
        }

        $img = match ($info['mime']) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if (! $img) {
            return [false, 0, 0];
        }

        if ($info['mime'] === 'image/jpeg') {
            $img = self::applyExifOrientation($img, $path);
        }

        return [$img, imagesx($img), imagesy($img)];
    }

    private static function applyExifOrientation(\GdImage $img, string $path): \GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $img;
        }

        $exif = @exif_read_data($path);
        $orientation = $exif['Orientation'] ?? 0;

        $angle = match ($orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $img;
        }

        $rotated = imagerotate($img, $angle, 0);
        if ($rotated) {
            imagedestroy($img);

            return $rotated;
        }

        return $img;
    }
}
