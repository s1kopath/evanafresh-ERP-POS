import ModuleStub from '@/Components/ModuleStub';

export default function ReorderIndex() {
    return (
        <ModuleStub
            title="Reorder Planning"
            subtitle="Auto reorder lists & one-click purchase orders"
            icon="reorder"
            phase="Phase 5"
            summary="Turn looming stock-outs into purchase orders automatically — build reorder lists from min levels and sales trends, pick the preferred supplier, then share or convert to a PO in one click."
            planned={[
                {
                    group: 'Suggestions',
                    items: [
                        'Automatic reorder list (current stock vs minimum levels)',
                        'Purchase suggestions from historical sales trends & seasonality',
                        'Supplier-linked suggestions — preferred supplier shown per product',
                    ],
                },
                {
                    group: 'Action',
                    items: [
                        'One-click conversion of a reorder list into a purchase order',
                        'Adjust quantities before dispatch',
                    ],
                },
                {
                    group: 'Sharing',
                    items: [
                        'Export reorder reports to PDF & Excel',
                        'WhatsApp sharing of reorder reports directly from the system',
                    ],
                },
            ]}
            scenarios={['Low-stock items auto-listed and converted to a purchase order']}
        />
    );
}
