import ModuleStub from '@/Components/ModuleStub';

export default function SettingsIndex() {
    return (
        <ModuleStub
            title="Settings"
            subtitle="Branches, users, products, tax & hardware"
            icon="⚙️"
            phase="Phase 2"
            summary="The foundation every other module builds on — stores, staff roles, the product catalogue, tax/ZATCA configuration, and POS hardware setup."
            planned={[
                {
                    group: 'Organisation',
                    items: [
                        'Multiple stores / branches',
                        'Users & role-based access (owner, manager, accountant, cashier)',
                        'Full audit trail',
                    ],
                },
                {
                    group: 'Catalogue',
                    items: [
                        'Products & categories with barcodes',
                        'Units of measure incl. weight-based items',
                        'Supplier & customer master data with opening balances',
                    ],
                },
                {
                    group: 'Compliance & devices',
                    items: [
                        'VAT / TRN configuration',
                        'ZATCA Phase-2 (FATOORA) device onboarding & credentials',
                        'POS hardware: scanner, scale, thermal printer, cash drawer',
                    ],
                },
            ]}
        />
    );
}
