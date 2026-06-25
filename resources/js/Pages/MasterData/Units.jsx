import { useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MasterDataTabs from '@/Components/MasterDataTabs';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import Modal, { ConfirmDialog } from '@/Components/ui/Modal';
import { FormField, Input, Select } from '@/Components/ui/Form';
import { useState } from 'react';

export default function Units({ units, conversions }) {
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    return (
        <AppLayout
            title="Units & Conversions"
            subtitle="Units of measurement and the factors that convert between them"
            actions={<Button onClick={() => setEditing({})}>New unit</Button>}
        >
            <MasterDataTabs />

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Units */}
                <div className="lg:col-span-2">
                    <Card title="Units" padded={false}>
                        {units.length === 0 ? (
                            <EmptyState
                                icon="units"
                                title="No units yet"
                                description="Add the units you sell in — kg, g, pcs, box…"
                                action={<Button onClick={() => setEditing({})}>New unit</Button>}
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                                            <th className="px-4 py-3 font-semibold">Name</th>
                                            <th className="px-4 py-3 font-semibold">Code</th>
                                            <th className="hidden px-4 py-3 font-semibold md:table-cell">Type</th>
                                            <th className="hidden px-4 py-3 font-semibold sm:table-cell">Status</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {units.map((u) => (
                                            <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                                                <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{u.code}</code></td>
                                                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{u.is_fractional ? 'Fractional (weight/volume)' : 'Whole units'}</td>
                                                <td className="hidden px-4 py-3 sm:table-cell">
                                                    {u.is_active ? <Badge variant="success" dot>Active</Badge> : <Badge dot>Inactive</Badge>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>Edit</Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(u)}>Delete</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Conversions */}
                <Conversions units={units} conversions={conversions} />
            </div>

            <UnitFormModal unit={editing} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() =>
                    router.delete(`/master-data/units/${deleting.id}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleting(null),
                    })
                }
                title="Delete unit?"
                description={deleting ? `“${deleting.name}” will be removed. Units assigned to products can't be deleted.` : ''}
                confirmText="Delete"
            />
        </AppLayout>
    );
}

function Conversions({ units, conversions }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        from_unit_id: '',
        to_unit_id: '',
        factor: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/master-data/unit-conversions', { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <Card title="Conversions" subtitle="1 from-unit = factor × to-unit">
            <form onSubmit={submit} className="space-y-3">
                <FormField label="From" error={errors.from_unit_id}>
                    <Select value={data.from_unit_id} onChange={(e) => setData('from_unit_id', e.target.value)} error={errors.from_unit_id}>
                        <option value="">Select unit…</option>
                        {units.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                    </Select>
                </FormField>
                <FormField label="Factor" error={errors.factor} hint="e.g. 1 kg = 1000 g → factor 1000">
                    <Input type="number" step="any" min="0" value={data.factor} onChange={(e) => setData('factor', e.target.value)} error={errors.factor} />
                </FormField>
                <FormField label="To" error={errors.to_unit_id}>
                    <Select value={data.to_unit_id} onChange={(e) => setData('to_unit_id', e.target.value)} error={errors.to_unit_id}>
                        <option value="">Select unit…</option>
                        {units.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                    </Select>
                </FormField>
                <Button type="submit" size="sm" loading={processing} className="w-full">Add conversion</Button>
            </form>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {conversions.length === 0 ? (
                    <p className="text-center text-xs text-slate-400">No conversions defined.</p>
                ) : (
                    conversions.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                            <span className="text-slate-700">
                                1 <strong>{c.from}</strong> = {Number(c.factor)} <strong>{c.to}</strong>
                            </span>
                            <button
                                onClick={() => router.delete(`/master-data/unit-conversions/${c.id}`, { preserveScroll: true })}
                                className="text-xs font-medium text-red-600 hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

function UnitFormModal({ unit, onClose }) {
    const editing = unit && unit.id;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        is_fractional: false,
        is_active: true,
    });

    useEffect(() => {
        if (!unit) return;
        clearErrors();
        setData({
            name: unit.name ?? '',
            code: unit.code ?? '',
            is_fractional: unit.is_fractional ?? false,
            is_active: unit.is_active ?? true,
        });
    }, [unit]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (editing) put(`/master-data/units/${unit.id}`, opts);
        else post('/master-data/units', opts);
    };

    return (
        <Modal
            open={!!unit}
            onClose={onClose}
            title={editing ? 'Edit unit' : 'New unit'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
                    <Button onClick={submit} loading={processing}>{editing ? 'Save changes' : 'Create unit'}</Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Name" htmlFor="name" required error={errors.name}>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                    </FormField>
                    <FormField label="Code" htmlFor="code" required error={errors.code}>
                        <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} error={errors.code} placeholder="kg" />
                    </FormField>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={data.is_fractional} onChange={(e) => setData('is_fractional', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Fractional — allows decimal quantities (weight / volume)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Active
                </label>
            </form>
        </Modal>
    );
}
