import { useEffect, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MasterDataTabs from '@/Components/MasterDataTabs';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import Modal, { ConfirmDialog } from '@/Components/ui/Modal';
import Pagination from '@/Components/ui/Pagination';
import { FormField, Input, Textarea } from '@/Components/ui/Form';
import { formatNumber } from '@/lib/format';

export default function Categories({ categories, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState(null); // null | {} (new) | category
    const [deleting, setDeleting] = useState(null);
    const first = useRef(true);

    // Debounced server-side search.
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/master-data/categories', { search: search || undefined }, {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <AppLayout
            title="Categories"
            subtitle="Product categories — grocery, dairy, produce, frozen, beverages, …"
            actions={<Button onClick={() => setEditing({})}>New category</Button>}
        >
            <MasterDataTabs />

            <Card padded={false}>
                <div className="border-b border-slate-100 p-4">
                    <Input
                        type="search"
                        placeholder="Search categories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                {categories.data.length === 0 ? (
                    <EmptyState
                        icon="categories"
                        title="No categories yet"
                        description="Group your products to speed up POS lookup and reporting."
                        action={<Button onClick={() => setEditing({})}>New category</Button>}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Description</th>
                                    <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Products</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {categories.data.map((c) => (
                                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                                        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{c.description || '—'}</td>
                                        <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">
                                            {formatNumber(c.products_count)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.is_active ? (
                                                <Badge variant="success" dot>Active</Badge>
                                            ) : (
                                                <Badge variant="neutral" dot>Inactive</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(c)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {categories.links && (
                    <div className="flex justify-end border-t border-slate-100 p-4">
                        <Pagination links={categories.links} />
                    </div>
                )}
            </Card>

            <CategoryFormModal category={editing} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() =>
                    router.delete(`/master-data/categories/${deleting.id}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleting(null),
                    })
                }
                title="Delete category?"
                description={deleting ? `“${deleting.name}” will be removed. Categories with products can't be deleted.` : ''}
                confirmText="Delete"
            />
        </AppLayout>
    );
}

function CategoryFormModal({ category, onClose }) {
    const editing = category && category.id;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        if (!category) return;
        clearErrors();
        setData({
            name: category.name ?? '',
            description: category.description ?? '',
            is_active: category.is_active ?? true,
        });
    }, [category]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (editing) put(`/master-data/categories/${category.id}`, opts);
        else post('/master-data/categories', opts);
    };

    return (
        <Modal
            open={!!category}
            onClose={onClose}
            title={editing ? 'Edit category' : 'New category'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
                    <Button onClick={submit} loading={processing}>{editing ? 'Save changes' : 'Create category'}</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <FormField label="Name" htmlFor="name" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                </FormField>
                <FormField label="Description" htmlFor="description" error={errors.description}>
                    <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} />
                </FormField>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Active
                </label>
            </form>
        </Modal>
    );
}
