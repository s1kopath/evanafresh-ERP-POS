import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MasterDataTabs from '@/Components/MasterDataTabs';
import Button, { buttonVariants } from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import { cn } from '@/lib/cn';

const LABELS = { products: 'Products', customers: 'Customers', suppliers: 'Suppliers' };

export default function Import({ type, types, columns, summary }) {
    const { data, setData, post, processing, errors, progress } = useForm({ file: null });

    const submit = (e) => {
        e.preventDefault();
        post(`/master-data/import/${type}`, { forceFormData: true, onSuccess: () => setData('file', null) });
    };

    return (
        <AppLayout title="Import" subtitle="Bulk-load opening data from a CSV file">
            <MasterDataTabs />

            {/* Entity selector */}
            <div className="mb-5 flex flex-wrap gap-2">
                {types.map((t) => (
                    <Link
                        key={t}
                        href={`/master-data/import?type=${t}`}
                        className={cn(
                            'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                            t === type ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                        )}
                    >
                        {LABELS[t] ?? t}
                    </Link>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-5">
                    <Card title={`Upload ${LABELS[type] ?? type} CSV`} subtitle="First row must be the column headers below">
                        <form onSubmit={submit} className="space-y-4">
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => setData('file', e.target.files[0] ?? null)}
                                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                            />
                            {errors.file && <p className="text-xs text-red-600">{errors.file}</p>}
                            {progress && (
                                <div className="h-1.5 w-full overflow-hidden rounded bg-slate-100">
                                    <div className="h-full bg-brand-500" style={{ width: `${progress.percentage}%` }} />
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Button type="submit" loading={processing} disabled={!data.file}>Import</Button>
                                <a href={`/master-data/import/${type}/template`} className={buttonVariants({ variant: 'secondary' })}>
                                    Download template
                                </a>
                            </div>
                        </form>
                    </Card>

                    {summary && (
                        <Card title="Last import result">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="success">Created {summary.created}</Badge>
                                <Badge variant="info">Updated {summary.updated}</Badge>
                                <Badge variant={summary.skipped ? 'warning' : 'neutral'}>Skipped {summary.skipped}</Badge>
                            </div>
                            {summary.errors?.length > 0 && (
                                <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skipped rows</p>
                                    {summary.errors.map((err, i) => (
                                        <p key={i} className="text-sm text-slate-600">
                                            <span className="font-medium text-red-600">Line {err.line}:</span> {err.message}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                <Card title="Expected columns">
                    <div className="space-y-2">
                        {columns.map((c) => (
                            <div key={c.key} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2 last:border-0">
                                <div>
                                    <code className="text-xs font-semibold text-slate-700">{c.key}</code>
                                    <div className="text-xs text-slate-400">e.g. {c.example}</div>
                                </div>
                                {c.required ? <Badge variant="danger">Required</Badge> : <Badge>Optional</Badge>}
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                        Rows are matched by {type === 'products' ? 'barcode → SKU → name' : 'name'} and updated if they already exist.
                    </p>
                </Card>
            </div>
        </AppLayout>
    );
}
