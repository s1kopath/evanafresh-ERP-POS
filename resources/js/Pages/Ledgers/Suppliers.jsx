import ModuleStub from '@/Components/ModuleStub';

export default function SuppliersLedger() {
    return (
        <ModuleStub
            title="Supplier Ledger"
            subtitle="Purchases, payments & ageing"
            icon="📒"
            phase="Phase 6"
            summary="A complete account per supplier: purchases, payments and returns with a running balance, ageing analysis of what is due, and printable statements."
            planned={[
                {
                    group: 'Balances',
                    items: [
                        'Per-supplier ledger with running balance',
                        'Partial payment & outstanding balance tracking',
                    ],
                },
                {
                    group: 'Reporting',
                    items: [
                        'Supplier due reports',
                        'Ageing analysis (30 / 60 / 90+ days)',
                    ],
                },
                {
                    group: 'Statements',
                    items: ['Supplier statements (PDF / print) for any date range'],
                },
            ]}
            scenarios={['Complete supplier ledger & statement']}
        />
    );
}
