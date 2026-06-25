import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import AppLayout from '@/Layouts/AppLayout';
import Button, { buttonVariants } from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import { FormField, Input, Select } from '@/Components/ui/Form';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

const PRESETS = [1, 10, 20, 30, 50];
const MAX = 200;

/** One label. Barcode SVG + QR are generated once on the page and passed in,
 *  so rendering N copies costs nothing extra. */
function LabelCell({ product, store, price, barcodeSvg, qrSrc }) {
    return (
        <div className="label-cell">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{store.name}</div>
            <div className="mt-0.5 text-sm font-bold text-slate-900">{product.name}</div>
            <div className="label-price mt-1 text-xl font-extrabold text-brand-700">
                {price}
                {product.is_weight_based && <span className="text-[10px] font-medium text-slate-400"> / kg</span>}
            </div>
            <div className="mt-2 flex items-end justify-center gap-3">
                {barcodeSvg ? (
                    <span dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                ) : (
                    <span className="text-[10px] text-slate-400">No barcode</span>
                )}
                {qrSrc && <img src={qrSrc} width={56} height={56} alt="" />}
            </div>
            {product.sku && <div className="mt-1 text-[9px] uppercase tracking-wide text-slate-400">SKU {product.sku}</div>}
        </div>
    );
}

export default function ProductLabel({ product, store }) {
    const [quantity, setQuantity] = useState(1);
    const [cols, setCols] = useState(1);
    const [barcodeSvg, setBarcodeSvg] = useState(null);
    const [qrSrc, setQrSrc] = useState(null);

    const price = formatMoney(product.sell_price_minor / 100, { currency: store.currency });
    const qrPayload = product.barcode || product.sku || product.name;

    // Render the barcode once; reuse its SVG string for every copy.
    useEffect(() => {
        if (!product.barcode) {
            setBarcodeSvg(null);
            return;
        }
        try {
            const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            JsBarcode(el, String(product.barcode), {
                format: 'CODE128', height: 44, width: 1.5, displayValue: true,
                margin: 0, fontSize: 12, fontOptions: 'bold',
            });
            setBarcodeSvg(el.outerHTML);
        } catch {
            setBarcodeSvg(null);
        }
    }, [product.barcode]);

    // Generate the QR once; reuse the data URL for every copy.
    useEffect(() => {
        let active = true;
        QRCode.toDataURL(String(qrPayload), { width: 160, margin: 1, errorCorrectionLevel: 'M' })
            .then((url) => active && setQrSrc(url))
            .catch(() => active && setQrSrc(null));
        return () => { active = false; };
    }, [qrPayload]);

    const count = Math.max(1, Math.min(MAX, Number(quantity) || 1));
    const cells = useMemo(() => Array.from({ length: count }), [count]);
    const cellProps = { product, store, price, barcodeSvg, qrSrc };
    const printLabel = `Print ${count} label${count > 1 ? 's' : ''}`;

    return (
        <AppLayout
            title="Product label"
            subtitle={product.name}
            actions={
                <div className="flex gap-2">
                    <Link href="/master-data/products" className={buttonVariants({ variant: 'secondary' })}>Back</Link>
                    <Button onClick={() => window.print()}>{printLabel}</Button>
                </div>
            }
        >
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Print queue controls */}
                <Card title="Print queue" subtitle="Choose how many labels to print">
                    <div className="space-y-4">
                        <FormField label="Quantity" htmlFor="qty">
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="secondary" size="icon" onClick={() => setQuantity((q) => Math.max(1, Number(q) - 1))} aria-label="Decrease">−</Button>
                                <Input id="qty" type="number" min="1" max={MAX} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="text-center" />
                                <Button type="button" variant="secondary" size="icon" onClick={() => setQuantity((q) => Math.min(MAX, Number(q) + 1))} aria-label="Increase">+</Button>
                            </div>
                        </FormField>

                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setQuantity(n)}
                                    className={cn(
                                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                                        count === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                    )}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        <FormField label="Labels per row (on the printed sheet)" htmlFor="cols">
                            <Select id="cols" value={cols} onChange={(e) => setCols(Number(e.target.value))}>
                                <option value={1}>1 per row</option>
                                <option value={2}>2 per row</option>
                                <option value={3}>3 per row</option>
                                <option value={4}>4 per row</option>
                            </Select>
                        </FormField>

                        <Button onClick={() => window.print()} className="w-full">{printLabel}</Button>
                        <p className="text-xs text-slate-400">
                            Only the labels print — the app frame is excluded from the print output.
                        </p>
                    </div>
                </Card>

                {/* On-screen preview — mirrors the printed sheet exactly. */}
                <div className="lg:col-span-2">
                    <Card title="Preview" subtitle={`${count} label${count > 1 ? 's' : ''} · ${cols} per row — exactly what prints`}>
                        <div className="max-h-[70vh] overflow-auto rounded-lg bg-slate-50 p-3 sm:p-4">
                            <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                                    {cells.map((_, i) => <LabelCell key={i} {...cellProps} />)}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Print sheet — portaled to <body>, hidden on screen, tiled when printing. */}
            {createPortal(
                <div id="label-sheet" style={{ '--label-cols': cols }}>
                    {cells.map((_, i) => <LabelCell key={i} {...cellProps} />)}
                </div>,
                document.body,
            )}
        </AppLayout>
    );
}
