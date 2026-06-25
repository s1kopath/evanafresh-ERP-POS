import { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MasterDataTabs from '@/Components/MasterDataTabs';
import Button, { buttonVariants } from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import { ConfirmDialog } from '@/Components/ui/Modal';
import Pagination from '@/Components/ui/Pagination';
import ProductImage from '@/Components/ProductImage';
import { Input, Select } from '@/Components/ui/Form';
import { formatMoney } from '@/lib/format';

export default function ProductsIndex({ products, categories, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState(null);
    const first = useRef(true);

    const reload = (params) => {
        router.get('/master-data/products', params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(
            () => reload({ ...filters, search: search || undefined }),
            300,
        );
        return () => clearTimeout(t);
    }, [search]);

    return (
        <AppLayout
            title="Products"
            subtitle="The shared catalogue — barcode, price, tax, reorder level, per-branch overrides"
            actions={
                <Link href="/master-data/products/create" className={buttonVariants()}>
                    New product
                </Link>
            }
        >
            <MasterDataTabs />

            <Card padded={false}>
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
                    <Input
                        type="search"
                        placeholder="Search name, SKU or barcode…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select
                        value={filters.category_id ?? ''}
                        onChange={(e) => reload({ ...filters, category_id: e.target.value || undefined })}
                        className="max-w-48"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select
                        value={filters.status ?? ''}
                        onChange={(e) => reload({ ...filters, status: e.target.value || undefined })}
                        className="max-w-40"
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </div>

                {products.data.length === 0 ? (
                    <EmptyState
                        icon="products"
                        title="No products found"
                        description="Add your first product, or adjust the filters above."
                        action={<Link href="/master-data/products/create" className={buttonVariants()}>New product</Link>}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-4 py-3 font-semibold">Product</th>
                                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Barcode</th>
                                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Category</th>
                                    <th className="px-4 py-3 text-right font-semibold">Price</th>
                                    <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell">VAT</th>
                                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {products.data.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <ProductImage src={p.image_url} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg" />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-800">{p.name}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {p.sku ? `SKU ${p.sku}` : 'No SKU'}
                                                        {p.is_weight_based && <Badge variant="info" className="ml-2">By weight</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                                            {p.barcode ? <code className="text-xs">{p.barcode}</code> : '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{p.category || '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                            {formatMoney(p.sell_price_minor / 100)}
                                            {p.unit && <span className="text-xs text-slate-400"> /{p.unit}</span>}
                                        </td>
                                        <td className="hidden px-4 py-3 text-right tabular-nums text-slate-500 lg:table-cell">
                                            {p.tax !== null ? `${Number(p.tax)}%` : '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            {p.is_active ? <Badge variant="success" dot>Active</Badge> : <Badge dot>Inactive</Badge>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/master-data/products/${p.id}/label`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Label</Link>
                                                <Link href={`/master-data/products/${p.id}/edit`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Edit</Link>
                                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(p)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {products.links && (
                    <div className="flex justify-end border-t border-slate-100 p-4">
                        <Pagination links={products.links} />
                    </div>
                )}
            </Card>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() =>
                    router.delete(`/master-data/products/${deleting.id}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleting(null),
                    })
                }
                title="Delete product?"
                description={deleting ? `“${deleting.name}” will be removed from the catalogue.` : ''}
                confirmText="Delete"
            />
        </AppLayout>
    );
}
