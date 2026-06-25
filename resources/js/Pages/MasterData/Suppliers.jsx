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
import { formatMoney } from '@/lib/format';

export default function Suppliers({ suppliers, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => {
            router.get('/master-data/suppliers', { search: search || undefined }, { preserveState: true, replace: true, preserveScroll: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <AppLayout
            title="Suppliers"
            subtitle="Vendor profiles & opening balances"
            actions={<Button onClick={() => setEditing({})}>New supplier</Button>}
        >
            <MasterDataTabs />

            <Card padded={false}>
                <div className="border-b border-slate-100 p-4">
                    <Input type="search" placeholder="Search name, contact or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                </div>

                {suppliers.data.length === 0 ? (
                    <EmptyState icon="suppliers" title="No suppliers yet" description="Register suppliers to track purchases and payables." action={<Button onClick={() => setEditing({})}>New supplier</Button>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Contact</th>
                                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">VAT no.</th>
                                    <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Opening bal.</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.data.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                                        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{s.contact_name || s.phone || '—'}</td>
                                        <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{s.trn || '—'}</td>
                                        <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">{formatMoney(s.opening_balance)}</td>
                                        <td className="px-4 py-3">{s.is_active ? <Badge variant="success" dot>Active</Badge> : <Badge dot>Inactive</Badge>}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(s)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {suppliers.links && <div className="flex justify-end border-t border-slate-100 p-4"><Pagination links={suppliers.links} /></div>}
            </Card>

            <SupplierFormModal supplier={editing} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => router.delete(`/master-data/suppliers/${deleting.id}`, { preserveScroll: true, onFinish: () => setDeleting(null) })}
                title="Delete supplier?"
                description={deleting ? `“${deleting.name}” will be removed.` : ''}
                confirmText="Delete"
            />
        </AppLayout>
    );
}

function SupplierFormModal({ supplier, onClose }) {
    const editing = supplier && supplier.id;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '', contact_name: '', phone: '', email: '', address: '', trn: '', opening_balance: '', is_active: true,
    });

    useEffect(() => {
        if (!supplier) return;
        clearErrors();
        setData({
            name: supplier.name ?? '',
            contact_name: supplier.contact_name ?? '',
            phone: supplier.phone ?? '',
            email: supplier.email ?? '',
            address: supplier.address ?? '',
            trn: supplier.trn ?? '',
            opening_balance: supplier.opening_balance ?? '',
            is_active: supplier.is_active ?? true,
        });
    }, [supplier]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (editing) put(`/master-data/suppliers/${supplier.id}`, opts);
        else post('/master-data/suppliers', opts);
    };

    return (
        <Modal
            open={!!supplier}
            onClose={onClose}
            title={editing ? 'Edit supplier' : 'New supplier'}
            footer={<>
                <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
                <Button onClick={submit} loading={processing}>{editing ? 'Save changes' : 'Create supplier'}</Button>
            </>}
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Name" htmlFor="name" required error={errors.name}>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                    </FormField>
                    <FormField label="Contact person" htmlFor="contact_name" error={errors.contact_name}>
                        <Input id="contact_name" value={data.contact_name} onChange={(e) => setData('contact_name', e.target.value)} error={errors.contact_name} />
                    </FormField>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Phone" htmlFor="phone" error={errors.phone}>
                        <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                    </FormField>
                    <FormField label="Email" htmlFor="email" error={errors.email}>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                    </FormField>
                </div>
                <FormField label="Address" htmlFor="address" error={errors.address}>
                    <Textarea id="address" rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                </FormField>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="VAT number" htmlFor="trn" error={errors.trn}>
                        <Input id="trn" value={data.trn} onChange={(e) => setData('trn', e.target.value)} error={errors.trn} />
                    </FormField>
                    <FormField label="Opening balance (SAR)" htmlFor="opening_balance" error={errors.opening_balance} hint="Owed to supplier = positive">
                        <Input id="opening_balance" type="number" step="0.01" value={data.opening_balance} onChange={(e) => setData('opening_balance', e.target.value)} error={errors.opening_balance} />
                    </FormField>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Active
                </label>
            </form>
        </Modal>
    );
}
