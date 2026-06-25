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
import { FormField, Input, Select } from '@/Components/ui/Form';
import { formatMoney, formatDate } from '@/lib/format';

const STATUS = {
    active: { label: 'Active', variant: 'success' },
    on_leave: { label: 'On leave', variant: 'warning' },
    terminated: { label: 'Terminated', variant: 'danger' },
};

export default function Employees({ employees, branches, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => {
            router.get('/master-data/employees', { search: search || undefined }, { preserveState: true, replace: true, preserveScroll: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <AppLayout
            title="Employees"
            subtitle="Staff records — salary, join date, branch, status (feeds payroll)"
            actions={<Button onClick={() => setEditing({})}>New employee</Button>}
        >
            <MasterDataTabs />

            <Card padded={false}>
                <div className="border-b border-slate-100 p-4">
                    <Input type="search" placeholder="Search name, number or position…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                </div>

                {employees.data.length === 0 ? (
                    <EmptyState icon="employees" title="No employees yet" description="Add staff records to drive payroll and branch staffing." action={<Button onClick={() => setEditing({})}>New employee</Button>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Position</th>
                                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Branch</th>
                                    <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Salary</th>
                                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">Joined</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {employees.data.map((e) => {
                                    const st = STATUS[e.status] ?? STATUS.active;
                                    return (
                                        <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800">{e.name}</div>
                                                <div className="text-xs text-slate-400">{e.employee_no ? `#${e.employee_no}` : '—'}</div>
                                            </td>
                                            <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{e.position || '—'}</td>
                                            <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{e.branch || '—'}</td>
                                            <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">{formatMoney(e.salary)}</td>
                                            <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{formatDate(e.joined_on)}</td>
                                            <td className="px-4 py-3"><Badge variant={st.variant} dot>{st.label}</Badge></td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>Edit</Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(e)}>Delete</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {employees.links && <div className="flex justify-end border-t border-slate-100 p-4"><Pagination links={employees.links} /></div>}
            </Card>

            <EmployeeFormModal employee={editing} branches={branches} onClose={() => setEditing(null)} />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => router.delete(`/master-data/employees/${deleting.id}`, { preserveScroll: true, onFinish: () => setDeleting(null) })}
                title="Delete employee?"
                description={deleting ? `“${deleting.name}” will be removed.` : ''}
                confirmText="Delete"
            />
        </AppLayout>
    );
}

function EmployeeFormModal({ employee, branches, onClose }) {
    const editing = employee && employee.id;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '', employee_no: '', position: '', phone: '', email: '', branch_id: '', salary: '', joined_on: '', status: 'active',
    });

    useEffect(() => {
        if (!employee) return;
        clearErrors();
        setData({
            name: employee.name ?? '',
            employee_no: employee.employee_no ?? '',
            position: employee.position ?? '',
            phone: employee.phone ?? '',
            email: employee.email ?? '',
            branch_id: employee.branch_id ?? '',
            salary: employee.salary ?? '',
            joined_on: employee.joined_on ?? '',
            status: employee.status ?? 'active',
        });
    }, [employee]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (editing) put(`/master-data/employees/${employee.id}`, opts);
        else post('/master-data/employees', opts);
    };

    return (
        <Modal
            open={!!employee}
            onClose={onClose}
            title={editing ? 'Edit employee' : 'New employee'}
            footer={<>
                <Button variant="secondary" onClick={onClose} disabled={processing}>Cancel</Button>
                <Button onClick={submit} loading={processing}>{editing ? 'Save changes' : 'Create employee'}</Button>
            </>}
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Name" htmlFor="name" required error={errors.name}>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                    </FormField>
                    <FormField label="Employee no." htmlFor="employee_no" error={errors.employee_no}>
                        <Input id="employee_no" value={data.employee_no} onChange={(e) => setData('employee_no', e.target.value)} error={errors.employee_no} />
                    </FormField>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Position" htmlFor="position" error={errors.position}>
                        <Input id="position" value={data.position} onChange={(e) => setData('position', e.target.value)} error={errors.position} placeholder="Cashier" />
                    </FormField>
                    <FormField label="Branch" error={errors.branch_id}>
                        <Select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} error={errors.branch_id}>
                            <option value="">—</option>
                            {branches.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.name}</option>)}
                        </Select>
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <FormField label="Salary (SAR)" htmlFor="salary" error={errors.salary}>
                        <Input id="salary" type="number" step="0.01" min="0" value={data.salary} onChange={(e) => setData('salary', e.target.value)} error={errors.salary} />
                    </FormField>
                    <FormField label="Joined on" htmlFor="joined_on" error={errors.joined_on}>
                        <Input id="joined_on" type="date" value={data.joined_on} onChange={(e) => setData('joined_on', e.target.value)} error={errors.joined_on} />
                    </FormField>
                    <FormField label="Status" error={errors.status}>
                        <Select value={data.status} onChange={(e) => setData('status', e.target.value)} error={errors.status}>
                            <option value="active">Active</option>
                            <option value="on_leave">On leave</option>
                            <option value="terminated">Terminated</option>
                        </Select>
                    </FormField>
                </div>
            </form>
        </Modal>
    );
}
