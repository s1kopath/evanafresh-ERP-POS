import ModuleStub from '@/Components/ModuleStub';

export default function PurchasingIndex() {
    return (
        <ModuleStub
            title="Purchasing"
            subtitle="Purchase entry, returns & automatic reordering"
            icon="purchasing"
            phase="Phase 5"
            summary="Record supplier bills (with partial payment to the supplier ledger), handle purchase returns, track price history, and auto-generate reorder lists from minimum levels and sales trends."
            planned={[
                {
                    group: 'Purchase entry',
                    items: [
                        'Purchase entry with full or partial payment',
                        'Purchase returns with stock & ledger adjustment',
                        'Balance auto-posts to the supplier ledger as Accounts Payable',
                    ],
                },
                {
                    group: 'Analysis',
                    items: [
                        'Purchase price history tracking',
                        'Supplier-wise purchase analysis',
                    ],
                },
                {
                    group: 'Reorder planning',
                    items: [
                        'Automatic reorder list from min levels + sales velocity',
                        'Purchase suggestions based on sales trends (seasonal hints)',
                        'Export reorder reports to PDF & Excel',
                        'Share PDF to supplier on WhatsApp',
                    ],
                },
            ]}
            scenarios={['Purchase entry with partial payment', 'Reorder list generation & share']}
        />
    );
}
