import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Renders a QR code as an <img> from a value (encoded to a data URL). */
export default function QrCode({ value, size = 96, className }) {
    const [src, setSrc] = useState(null);

    useEffect(() => {
        let active = true;
        if (!value) {
            setSrc(null);
            return undefined;
        }
        QRCode.toDataURL(String(value), { width: size, margin: 1, errorCorrectionLevel: 'M' })
            .then((url) => active && setSrc(url))
            .catch(() => active && setSrc(null));
        return () => {
            active = false;
        };
    }, [value, size]);

    if (!src) return null;
    return <img src={src} width={size} height={size} alt="QR code" className={className} />;
}
