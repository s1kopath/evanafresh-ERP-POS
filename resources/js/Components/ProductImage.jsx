import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Product thumbnail with graceful fallbacks — it NEVER renders a broken image.
 * Falls back to a neutral placeholder when: no src is set, the link is invalid,
 * or the file is missing/404s (caught via onError). Size it via `className`
 * (e.g. "h-10 w-10 rounded-lg"); the photo fills with object-cover.
 */
export default function ProductImage({ src, alt = '', className, iconClassName = 'h-1/3 w-1/3' }) {
    const [failed, setFailed] = useState(false);

    // Reset the error state whenever the source changes (e.g. preview swap).
    useEffect(() => setFailed(false), [src]);

    const showImage = src && !failed;

    return (
        <div className={cn('flex items-center justify-center overflow-hidden bg-slate-100 text-slate-300', className)}>
            {showImage ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <ImageIcon className={iconClassName} strokeWidth={1.5} aria-hidden="true" />
            )}
        </div>
    );
}
