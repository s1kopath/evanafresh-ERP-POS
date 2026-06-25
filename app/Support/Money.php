<?php

namespace App\Support;

/**
 * Money helper (PHP side). All amounts are stored as integer minor units
 * (halalas; 1 SAR = 100). Forms accept SAR in major units; convert at the edge.
 * Mirrors `formatMoney` on the JS side. Never use floats for storage/maths.
 */
class Money
{
    /** SAR (major) → halalas (integer minor). */
    public static function toMinor(int|float|string|null $major): int
    {
        if ($major === null || $major === '') {
            return 0;
        }

        return (int) round(((float) $major) * 100);
    }

    /** halalas (integer minor) → SAR (major float) for editing in forms. */
    public static function toMajor(?int $minor): float
    {
        return ($minor ?? 0) / 100;
    }
}
