import ModuleStub from '@/Components/ModuleStub';

export default function InventoryIndex() {
    return (
        <ModuleStub
            title="Inventory"
            subtitle="Real-time stock, expiry & valuation across branches"
            icon="📦"
            phase="Phase 3"
            summary="Live stock that updates the instant a sale or purchase posts. Tracks batches and expiry, flags low stock and near-expiry value-at-risk, and reports fast / slow / dead movers."
            planned={[
                {
                    group: 'Stock & valuation',
                    items: [
                        'Real-time stock monitoring, live across all branches',
                        'Inventory valuation on weighted-average cost',
                        'Inter-branch stock transfers',
                    ],
                },
                {
                    group: 'Stock levels',
                    items: [
                        'Minimum stock level per product / per branch (configurable)',
                        'Low-stock alerts on dashboard & mobile',
                    ],
                },
                {
                    group: 'Expiry management',
                    items: [
                        'Expiry tracking at batch / lot level',
                        'Near-expiry alerts with configurable thresholds',
                        'Expiry reports (expired & at-risk value)',
                        'One-click markdown / promotion for near-expiry items to POS',
                    ],
                },
                {
                    group: 'Velocity',
                    items: ['Fast / slow / dead-stock reports by velocity & days-since-sale'],
                },
            ]}
            scenarios={['Low-stock report → reorder', 'Near-expiry product report & markdown']}
        />
    );
}
