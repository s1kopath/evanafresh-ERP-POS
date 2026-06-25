import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * Renders a barcode (Code128 by default) as crisp SVG from a value.
 * Returns nothing if the value is empty or invalid for the chosen symbology.
 */
export default function Barcode({
    value,
    format = 'CODE128',
    height = 48,
    width = 1.6,
    displayValue = true,
    className,
}) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || !value) return;
        try {
            JsBarcode(ref.current, String(value), {
                format,
                height,
                width,
                displayValue,
                margin: 0,
                fontSize: 13,
                fontOptions: 'bold',
            });
        } catch {
            // Value isn't valid for this symbology — render nothing.
        }
    }, [value, format, height, width, displayValue]);

    if (!value) return null;
    return <svg ref={ref} className={className} />;
}
