import ModuleStub from '@/Components/ModuleStub';

export default function SettingsIndex() {
    return (
        <ModuleStub
            title="Settings"
            subtitle="Users, tax/ZATCA, POS devices & notifications"
            icon="⚙️"
            phase="Phase 2"
            summary="System configuration the rest of the platform builds on — staff roles & PINs, tax/ZATCA compliance, POS device setup, and notification & backup channels. (Products, categories and parties live in Master Data.)"
            planned={[
                {
                    group: 'Users & access',
                    items: [
                        'Users & role-based access (owner, manager, accountant, cashier)',
                        'Per-cashier POS PIN for terminal login',
                        'Full audit trail',
                    ],
                },
                {
                    group: 'Tax & compliance',
                    items: [
                        'VAT / TRN configuration',
                        'ZATCA Phase-2 (FATOORA) device onboarding & credentials',
                        'Store header / receipt settings',
                    ],
                },
                {
                    group: 'POS devices & hardware',
                    items: [
                        'POS device enrollment & trust registry (offline terminals)',
                        'Per-terminal document number ranges',
                        'Hardware: scanner, scale, thermal printer, cash drawer',
                    ],
                },
                {
                    group: 'Notifications & data',
                    items: [
                        'SMS & email gateways (low-stock / near-expiry alerts)',
                        'Encrypted automated daily cloud backups',
                    ],
                },
            ]}
        />
    );
}
