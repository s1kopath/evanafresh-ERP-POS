import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import Spinner from '@/Components/ui/Spinner';
import EmptyState from '@/Components/ui/EmptyState';
import Modal, { ConfirmDialog } from '@/Components/ui/Modal';
import Pagination from '@/Components/ui/Pagination';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from '@/Components/ui/Skeleton';
import { FormField, Input, Select, Textarea } from '@/Components/ui/Form';
import { useToast } from '@/Components/ui/Toast';
import { formatMoney, formatDate } from '@/lib/format';

function Section({ title, description, children }) {
    return (
        <Card title={title} subtitle={description} className="mb-5">
            {children}
        </Card>
    );
}

// Fake Laravel-style paginator links for the demo.
const demoLinks = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: '#', label: '1', active: true },
    { url: '#', label: '2', active: false },
    { url: '#', label: '3', active: false },
    { url: '#', label: 'Next &raquo;', active: false },
];

export default function UiKit() {
    const toast = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [loadingDemo, setLoadingDemo] = useState(true);

    return (
        <AppLayout title="UI Kit" subtitle="Reusable components reference (Phase 0)">
            <p className="mb-5 max-w-3xl text-sm text-slate-600">
                Living reference for the shared components in{' '}
                <code className="rounded bg-slate-100 px-1">resources/js/Components/ui</code>. Use these everywhere
                during development. Resize the window or open on a phone to check responsiveness.
            </p>

            <Section title="Buttons" description="Variants, sizes & loading state">
                <div className="flex flex-wrap items-center gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="subtle">Subtle</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button loading>Saving…</Button>
                    <Button size="sm">Small</Button>
                    <Button size="lg">Large</Button>
                </div>
            </Section>

            <Section title="Toasts" description="Programmatic alerts via useToast(); also auto-fired from Laravel flash">
                <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => toast.success('Saved successfully.')}>
                        Success
                    </Button>
                    <Button variant="secondary" onClick={() => toast.error('Something went wrong.')}>
                        Error
                    </Button>
                    <Button variant="secondary" onClick={() => toast.warning('Stock is running low.')}>
                        Warning
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => toast.info('Sync completed.', { title: 'Offline POS' })}
                    >
                        Info (with title)
                    </Button>
                </div>
            </Section>

            <Section title="Badges" description="Status pills">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="brand">Brand</Badge>
                    <Badge variant="success" dot>
                        Paid
                    </Badge>
                    <Badge variant="warning" dot>
                        Near expiry
                    </Badge>
                    <Badge variant="danger" dot>
                        Overdue
                    </Badge>
                    <Badge variant="info">Draft</Badge>
                    <Badge>Neutral</Badge>
                </div>
            </Section>

            <Section title="Form fields" description="Label + control + validation error">
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Product name" htmlFor="demo-name" required>
                        <Input id="demo-name" placeholder="e.g. Bananas (per kg)" />
                    </FormField>
                    <FormField label="Category" htmlFor="demo-cat">
                        <Select id="demo-cat" defaultValue="">
                            <option value="" disabled>
                                Select…
                            </option>
                            <option>Produce</option>
                            <option>Dairy</option>
                            <option>Frozen</option>
                        </Select>
                    </FormField>
                    <FormField label="Price" htmlFor="demo-price" hint="Excludes 15% VAT">
                        <Input id="demo-price" type="number" placeholder="0.00" />
                    </FormField>
                    <FormField label="Barcode" htmlFor="demo-bc" error="This barcode already exists.">
                        <Input id="demo-bc" error defaultValue="6281000000000" />
                    </FormField>
                    <FormField label="Notes" htmlFor="demo-notes" className="sm:col-span-2">
                        <Textarea id="demo-notes" placeholder="Optional notes…" />
                    </FormField>
                </div>
            </Section>

            <Section title="Modal & confirm dialog" description="Bottom-sheet on mobile, centered on desktop">
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setModalOpen(true)}>Open modal</Button>
                    <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                        Delete (confirm)
                    </Button>
                </div>
            </Section>

            <Section title="Loading: spinner & skeletons" description="Toggle to compare loaded vs. loading">
                <div className="mb-4 flex items-center gap-3">
                    <Spinner />
                    <Spinner size="sm" className="text-brand-600" />
                    <Button size="sm" variant="secondary" onClick={() => setLoadingDemo((v) => !v)}>
                        {loadingDemo ? 'Show loaded' : 'Show skeletons'}
                    </Button>
                </div>
                {loadingDemo ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <SkeletonCard />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-1/2" />
                            <SkeletonText lines={4} />
                        </div>
                        <SkeletonTable rows={4} cols={4} className="lg:col-span-2" />
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Today's sales">
                            <div className="text-2xl font-extrabold text-brand-700">{formatMoney(12450)}</div>
                            <p className="mt-1 text-xs text-slate-500">As of {formatDate(new Date())}</p>
                        </Card>
                        <Card title="Notes">
                            <p className="text-sm text-slate-600">
                                Loaded content. Swap skeletons in while data is fetching.
                            </p>
                        </Card>
                    </div>
                )}
            </Section>

            <Section title="Empty state" description="For lists with no data">
                <EmptyState
                    icon="🛒"
                    title="No sales yet today"
                    description="Completed sales will appear here as cashiers ring them up."
                    action={<Button size="sm">New sale</Button>}
                />
            </Section>

            <Section title="Pagination" description="Renders a Laravel paginator's links array">
                <Pagination links={demoLinks} />
            </Section>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Example modal"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setModalOpen(false);
                                toast.success('Modal action confirmed.');
                            }}
                        >
                            Save
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Modals are full-screen-safe, close on Escape or backdrop click, and lock body scroll.
                </p>
            </Modal>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                loading={confirmLoading}
                title="Delete product?"
                description="This action cannot be undone."
                confirmText="Delete"
                onConfirm={() => {
                    setConfirmLoading(true);
                    setTimeout(() => {
                        setConfirmLoading(false);
                        setConfirmOpen(false);
                        toast.success('Deleted.');
                    }, 900);
                }}
            />
        </AppLayout>
    );
}
