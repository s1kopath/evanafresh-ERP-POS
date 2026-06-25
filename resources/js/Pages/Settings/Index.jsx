import { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Modal, { ConfirmDialog } from '@/Components/ui/Modal';
import { FormField, Input, Textarea } from '@/Components/ui/Form';

export default function SettingsIndex({ settings, company, taxRates }) {
    return (
        <AppLayout title="Settings" subtitle="Store header, VAT/TRN, alert thresholds & tax rates">
            <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    <StoreSettings settings={settings} company={company} />
                </div>
                <TaxRates taxRates={taxRates} />
            </div>
        </AppLayout>
    );
}

function StoreSettings({ settings, company }) {
    const { data, setData, put, processing, errors } = useForm({
        store_header_name: settings.store_header_name ?? '',
        store_header_address: settings.store_header_address ?? '',
        store_header_phone: settings.store_header_phone ?? '',
        vat_number: settings.vat_number ?? '',
        near_expiry_days: settings.near_expiry_days ?? 30,
        low_stock_alerts: settings.low_stock_alerts ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        put('/settings', { preserveScroll: true });
    };

    return (
        <Card title="Store & VAT" subtitle="Printed on receipts and tax invoices">
            <form onSubmit={submit} className="space-y-4">
                <FormField label="Store header name" htmlFor="store_header_name" required error={errors.store_header_name}>
                    <Input id="store_header_name" value={data.store_header_name} onChange={(e) => setData('store_header_name', e.target.value)} error={errors.store_header_name} />
                </FormField>
                <FormField label="Address" htmlFor="store_header_address" error={errors.store_header_address}>
                    <Textarea id="store_header_address" rows={2} value={data.store_header_address} onChange={(e) => setData('store_header_address', e.target.value)} error={errors.store_header_address} />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Phone" htmlFor="store_header_phone" error={errors.store_header_phone}>
                        <Input id="store_header_phone" value={data.store_header_phone} onChange={(e) => setData('store_header_phone', e.target.value)} error={errors.store_header_phone} />
                    </FormField>
                    <FormField label="VAT number (TRN)" htmlFor="vat_number" error={errors.vat_number} hint="15-digit ZATCA TRN">
                        <Input id="vat_number" value={data.vat_number} onChange={(e) => setData('vat_number', e.target.value)} error={errors.vat_number} />
                    </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Currency" hint="Set on the company record">
                        <Input value={company.currency} disabled />
                    </FormField>
                    <FormField label="Near-expiry threshold (days)" htmlFor="near_expiry_days" required error={errors.near_expiry_days} hint="Drives near-expiry alerts (Phase 3)">
                        <Input id="near_expiry_days" type="number" min="1" max="365" value={data.near_expiry_days} onChange={(e) => setData('near_expiry_days', e.target.value)} error={errors.near_expiry_days} />
                    </FormField>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={data.low_stock_alerts} onChange={(e) => setData('low_stock_alerts', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Enable low-stock alerts
                </label>

                <div className="flex justify-end pt-2">
                    <Button type="submit" loading={processing}>Save settings</Button>
                </div>
            </form>
        </Card>
    );
}

function TaxRates({ taxRates }) {
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    return (
        <Card title="Tax rates" subtitle="VAT — Saudi standard is 15%" actions={<Button size="sm" onClick={() => setEditing({})}>Add</Button>}>
            <div className="space-y-2">
                {taxRates.length === 0 ? (
                    <p className="text-sm text-slate-400">No tax rates yet.</p>
                ) : (
                    taxRates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                    {t.name}
                                    {t.is_default && <Badge variant="brand">Default</Badge>}
                                    {!t.is_active && <Badge>Inactive</Badge>}
                                </div>
                                <div className="text-xs text-slate-500">{Number(t.rate)}%</div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(t)}>Delete</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <TaxRateModal taxRate={editing} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => router.delete(`/settings/tax-rates/${deleting.id}`, { preserveScroll: true, onFinish: () => setDeleting(null) })}
                title="Delete tax rate?"
                description={deleting ? `“${deleting.name}” will be removed. Rates assigned to products can't be deleted.` : ''}
                confirmText="Delete"
            />
        </Card>
    );
}

function TaxRateModal({ taxRate, onClose }) {
    const editing = taxRate && taxRate.id;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '', rate: '', is_default: false, is_active: true,
    });

    useEffect(() => {
        if (!taxRate) return;
        clearErrors();
        setData({
            name: taxRate.name ?? '',
            rate: taxRate.rate ?? '',
            is_default: taxRate.is_default ?? false,
            is_active: taxRate.is_active ?? true,
        });
    }, [taxRate]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (editing) put(`/settings/tax-rates/${taxRate.id}`, opts);
        else post('/settings/tax-rates', opts);
    };

    return (
        <Modal
            open={!!taxRate}
            onClose={onClose}
            title={editing ? 'Edit tax rate' : 'New tax rate'}
            footer={<>
                <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
                <Button onClick={submit} loading={processing}>{editing ? 'Save changes' : 'Create'}</Button>
            </>}
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Name" htmlFor="name" required error={errors.name}>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus placeholder="Standard VAT" />
                    </FormField>
                    <FormField label="Rate (%)" htmlFor="rate" required error={errors.rate}>
                        <Input id="rate" type="number" step="0.01" min="0" max="100" value={data.rate} onChange={(e) => setData('rate', e.target.value)} error={errors.rate} placeholder="15" />
                    </FormField>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Default rate for new products
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    Active
                </label>
            </form>
        </Modal>
    );
}
