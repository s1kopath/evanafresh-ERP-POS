import { useEffect, useMemo, useRef } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button, { buttonVariants } from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Barcode from '@/Components/Barcode';
import ProductImage from '@/Components/ProductImage';
import { FormField, Input, Select } from '@/Components/ui/Form';

export default function ProductForm({ product, categories, units, taxRates, branches }) {
    const editing = !!product;

    const { data, setData, post, transform, processing, errors } = useForm({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        barcode: product?.barcode ?? '',
        category_id: product?.category_id ?? '',
        unit_id: product?.unit_id ?? '',
        tax_rate_id: product?.tax_rate_id ?? '',
        cost_price: product?.cost_price ?? '',
        sell_price: product?.sell_price ?? '',
        is_weight_based: product?.is_weight_based ?? false,
        reorder_level: product?.reorder_level ?? 0,
        is_active: product?.is_active ?? true,
        image: null,
        remove_image: false,
        branches: branches ?? [],
    });

    const setBranch = (idx, key, value) => {
        const next = data.branches.map((b, i) => (i === idx ? { ...b, [key]: value } : b));
        setData('branches', next);
    };

    const submit = (e) => {
        e.preventDefault();
        const url = editing ? `/master-data/products/${product.id}` : '/master-data/products';
        // Multipart (forceFormData) so the photo uploads; booleans → 1/0 for the
        // FormData path; PUT is method-spoofed since PHP can't parse multipart PUT.
        transform((d) => ({
            ...d,
            is_weight_based: d.is_weight_based ? 1 : 0,
            is_active: d.is_active ? 1 : 0,
            remove_image: d.remove_image ? 1 : 0,
            branches: d.branches.map((b) => ({ ...b, stocked: b.stocked ? 1 : 0 })),
            ...(editing ? { _method: 'put' } : {}),
        }));
        post(url, { forceFormData: true });
    };

    return (
        <AppLayout
            title={editing ? 'Edit product' : 'New product'}
            subtitle="Company-wide catalogue entry with per-branch overrides"
            actions={<Link href="/master-data/products" className={buttonVariants({ variant: 'secondary' })}>Back to products</Link>}
        >
            <form onSubmit={submit} className="grid gap-5 lg:grid-cols-3">
                {/* Main details */}
                <div className="space-y-5 lg:col-span-2">
                    <Card title="Details">
                        <div className="space-y-4">
                            <FormField label="Name" htmlFor="name" required error={errors.name}>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                            </FormField>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="SKU" htmlFor="sku" error={errors.sku} hint="Internal code (optional)">
                                    <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} error={errors.sku} />
                                </FormField>
                                <FormField label="Barcode" htmlFor="barcode" error={errors.barcode} hint="EAN / UPC / Code128">
                                    <Input id="barcode" value={data.barcode} onChange={(e) => setData('barcode', e.target.value)} error={errors.barcode} />
                                </FormField>
                            </div>

                            {data.barcode && (
                                <div className="flex justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-3">
                                    <Barcode value={data.barcode} height={44} />
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-3">
                                <FormField label="Category" error={errors.category_id}>
                                    <Select value={data.category_id} onChange={(e) => setData('category_id', e.target.value)} error={errors.category_id}>
                                        <option value="">—</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Select>
                                </FormField>
                                <FormField label="Unit" error={errors.unit_id}>
                                    <Select value={data.unit_id} onChange={(e) => setData('unit_id', e.target.value)} error={errors.unit_id}>
                                        <option value="">—</option>
                                        {units.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                                    </Select>
                                </FormField>
                                <FormField label="VAT rate" error={errors.tax_rate_id}>
                                    <Select value={data.tax_rate_id} onChange={(e) => setData('tax_rate_id', e.target.value)} error={errors.tax_rate_id}>
                                        <option value="">No tax</option>
                                        {taxRates.map((t) => <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>)}
                                    </Select>
                                </FormField>
                            </div>
                        </div>
                    </Card>

                    <Card title="Per-branch overrides" subtitle="Minimum stock level and an optional price override at each branch">
                        {data.branches.length === 0 ? (
                            <p className="text-sm text-slate-400">No active branches.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                                            <th className="py-2 pr-3 font-semibold">Branch</th>
                                            <th className="py-2 pr-3 font-semibold">Stocked</th>
                                            <th className="py-2 pr-3 font-semibold">Min level</th>
                                            <th className="py-2 font-semibold">Price override (SAR)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.branches.map((b, idx) => (
                                            <tr key={b.branch_id} className="border-t border-slate-50">
                                                <td className="py-2 pr-3 font-medium text-slate-700">{b.code} — {b.name}</td>
                                                <td className="py-2 pr-3">
                                                    <input type="checkbox" checked={b.stocked} onChange={(e) => setBranch(idx, 'stocked', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <Input type="number" step="any" min="0" value={b.min_stock_level} onChange={(e) => setBranch(idx, 'min_stock_level', e.target.value)} className="w-24" />
                                                </td>
                                                <td className="py-2">
                                                    <Input type="number" step="0.01" min="0" placeholder="inherit" value={b.price} onChange={(e) => setBranch(idx, 'price', e.target.value)} className="w-28" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Image, pricing & flags */}
                <div className="space-y-5">
                    <Card title="Image">
                        <ImagePicker data={data} setData={setData} currentUrl={product?.image_url} error={errors.image} />
                    </Card>

                    <Card title="Pricing">
                        <div className="space-y-4">
                            <FormField label="Sell price (SAR)" htmlFor="sell_price" required error={errors.sell_price}>
                                <Input id="sell_price" type="number" step="0.01" min="0" value={data.sell_price} onChange={(e) => setData('sell_price', e.target.value)} error={errors.sell_price} />
                            </FormField>
                            <FormField label="Cost price (SAR)" htmlFor="cost_price" error={errors.cost_price} hint="For valuation & margin">
                                <Input id="cost_price" type="number" step="0.01" min="0" value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} error={errors.cost_price} />
                            </FormField>
                            <FormField label="Reorder level" htmlFor="reorder_level" error={errors.reorder_level} hint="Default min stock (branches can override)">
                                <Input id="reorder_level" type="number" step="any" min="0" value={data.reorder_level} onChange={(e) => setData('reorder_level', e.target.value)} error={errors.reorder_level} />
                            </FormField>
                        </div>
                    </Card>

                    <Card title="Flags">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={data.is_weight_based} onChange={(e) => setData('is_weight_based', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                Sold by weight (price per kg)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                Active
                            </label>
                        </div>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" loading={processing} className="flex-1">
                            {editing ? 'Save changes' : 'Create product'}
                        </Button>
                        <Link href="/master-data/products" className={buttonVariants({ variant: 'secondary' })}>Cancel</Link>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}

function ImagePicker({ data, setData, currentUrl, error }) {
    const fileRef = useRef(null);

    // Preview the freshly-picked file; otherwise the saved image (unless cleared).
    const objectUrl = useMemo(() => (data.image ? URL.createObjectURL(data.image) : null), [data.image]);
    useEffect(() => () => objectUrl && URL.revokeObjectURL(objectUrl), [objectUrl]);
    const preview = objectUrl ?? (data.remove_image ? null : currentUrl);

    const choose = (e) => {
        const file = e.target.files?.[0];
        if (file) setData({ ...data, image: file, remove_image: false });
        e.target.value = ''; // allow re-selecting the same file
    };

    return (
        <div className="space-y-3">
            <ProductImage src={preview} alt="" className="aspect-square w-full rounded-xl border border-slate-200" iconClassName="h-12 w-12" />
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choose} />
            <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                    {preview ? 'Change' : 'Upload image'}
                </Button>
                {preview && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => setData({ ...data, image: null, remove_image: true })}>
                        Remove
                    </Button>
                )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <p className="text-xs text-slate-400">JPG, PNG or WebP, up to 5 MB — optimized automatically.</p>
        </div>
    );
}
