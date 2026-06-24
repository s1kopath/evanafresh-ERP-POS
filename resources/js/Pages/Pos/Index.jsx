import ModuleStub from '@/Components/ModuleStub';

export default function PosIndex() {
    return (
        <ModuleStub
            title="POS Terminal"
            subtitle="Fast day-to-day selling — barcode, weight & credit"
            icon="🛒"
            phase="Phase 4"
            summary="The point-of-sale till for cashiers: scan or search items, weigh produce, take mixed payments, handle returns, and print a ZATCA-compliant e-invoice — even while offline."
            planned={[
                {
                    group: 'Selling',
                    items: [
                        'Barcode & non-barcode product sales (scan or search by name)',
                        'Weight-based sales for fruit, veg, fish, chicken (scale integration, price-per-kg)',
                        'Held / parked bills and quick item lookup',
                    ],
                },
                {
                    group: 'Payments',
                    items: [
                        'Cash, card & partial payment with split / mixed tenders',
                        'Customer credit sales with credit limits & due tracking',
                        'Change calculation and cash drawer trigger',
                    ],
                },
                {
                    group: 'Returns & receipts',
                    items: [
                        'Sales return & refund (full / partial) with automatic stock reversal',
                        'Thermal receipt printing & customer-facing display',
                    ],
                },
                {
                    group: 'Compliance & offline',
                    items: [
                        'ZATCA Phase-2 simplified e-invoice with QR on every sale',
                        'Offline selling with local queue and automatic cloud sync on reconnect',
                    ],
                },
            ]}
            scenarios={['Product sale with customer credit / due']}
        />
    );
}
