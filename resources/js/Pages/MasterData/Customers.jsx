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
import { FormField, Input, Select, Textarea } from '@/Components/ui/Form';
import { formatMoney } from '@/lib/format';

export default function Customers({ customers, branches, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => {
            router.get('/master-data/customers', { search: search || undefined }, { preserveState: true, replace: true, preserveScroll: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <AppLayout
            title="Customers"
            subtitle="Credit customers — limit & opening balance"
            actions={<Button onClick={() => setEditing({})}>New customer</Button>}
        >
            <MasterDataTabs />

            <Card padded={false}>
                <div className="border-b border-slate-100 p-4">
                    <Input type="search" placeholder="Search name, phone or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                </div>

                {customers.data.length === 0 ? (
                    <EmptyState icon="customers" title="No customers yet" description="Register credit customers to track dues and statements." action={<Button onClick={() => setEditing({})}>New customer</Button>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Contact</th>
                                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Branch</th>
                                    <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell">Credit limit</th>
                                    <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Opening bal.</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.map((c) => (
                                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                                        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{c.phone || c.email || '—'}</td>
                                        <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{c.branch || '—'}</td>
                                        <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 lg:table-cell">{formatMoney(c.credit_limit)}</td>
                                        <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">{formatMoney(c.opening_balance)}</td>
                                        <td className="px-4 py-3">{c.is_active ? <Badge variant="success" dot>Active</Badge> : <Badge dot>Inactive</Badge>}</td>
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

                {customers.links && <div className="flex justify-end border-t border-slate-100 p-4"><Pagination links={customers.links} /></div>}
            </Card>

            <CustomerFormModal customer={editing} branches={branches} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => router.delete(`/master-data/customers/${deleting.id}`, { preserveScroll: true, onFinish: () => setDeleting(null) })}
                title="Delete customer?"
                description={deleting ? `“${deleting.name}” will be removed.` : ''}
                confirmText="Delete"
            />
        </AppLayout>
    );
}

function CustomerFormModal({ customer, branches, onClose }) {
    const editing = customer && customer.id;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '', phone: '', email: '', address: '', branch_id: '', credit_limit: '', opening_balance: '', is_active: true,
    });

    useEffect(() => {
        if (!customer) return;
        clearErrors();
        setData({
            name: customer.name ?? '',
            phone: customer.phone ?? '',
            email: customer.email ?? '',
            address: customer.address ?? '',
            branch_id: customer.branch_id ?? '',
            credit_limit: customer.credit_limit ?? '',
            opening_balance: customer.opening_balance ?? '',
            is_active: customer.is_active ?? true,
        });
    }, [customer]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (editing) put(`/master-data/customers/${customer.id}`, opts);
        else post('/master-data/customers', opts);
    };

    return (
        <Modal
            open={!!customer}
            onClose={onClose}
            title={editing ? 'Edit customer' : 'New customer'}
            footer={<>
                <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
                <Button onClick={submit} loading={processing}>{editing ? 'Save changes' : 'Create customer'}</Button>
            </>}
        >
            <form onSubmit={submit} className="space-y-4">
                <FormField label="Name" htmlFor="name" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                </FormField>
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
                <FormField label="Registered at branch" error={errors.branch_id}>
                    <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} error={errors.branch_id}>
                        <option value="">—</option>
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.name}</option>)}
                    </Select>
                </FormField>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Credit limit (SAR)" htmlFor="credit_limit" error={errors.credit_limit}>
                        <Input id="credit_limit" type="number" step="0.01" min="0" value={data.credit_limit} onChange={(e) => setData('credit_limit', e.target.value)} error={errors.credit_limit} />
                    </FormField>
                    <FormField label="Opening balance (SAR)" htmlFor="opening_balance" error={errors.opening_balance} hint="Owed by customer = positive">
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
