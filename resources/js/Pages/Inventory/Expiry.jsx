import ModuleStub from '@/Components/ModuleStub';

export default function ExpiryIndex() {
    return (
        <ModuleStub
            title="Expiry Management"
            subtitle="Near-expiry alerts & clearance for perishables"
            icon="expiry"
            phase="Phase 3"
            summary="Track expiry from goods receipt through clearance — flag near-expiry stock early, push clearance discounts, and keep spoilage off the shelf and out of the P&L."
            planned={[
                {
                    group: 'Capture & traceability',
                    items: [
                        'Expiry date entry at goods receipt (GRN)',
                        'Batch / lot expiry tracking with full traceability',
                    ],
                },
                {
                    group: 'Alerts',
                    items: [
                        'Configurable near-expiry thresholds (e.g. 7 / 14 / 30 days)',
                        'In-app, SMS & email notifications',
                    ],
                },
                {
                    group: 'Clearance',
                    items: [
                        'Near-expiry promotion / automatic discount management',
                        'Accelerated clearance of at-risk batches',
                    ],
                },
                {
                    group: 'Reporting',
                    items: [
                        'Expired stock reports — filter by product / category / branch',
                        'Expiry-risk dashboard — total near-expiry stock value at a glance',
                    ],
                },
            ]}
            scenarios={['Near-expiry stock flagged and cleared with an auto-discount']}
        />
    );
}
