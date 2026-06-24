import ModuleStub from '@/Components/ModuleStub';

export default function MasterDataIndex() {
    return (
        <ModuleStub
            title="Master Data"
            subtitle="Products, categories, units, customers & suppliers"
            icon="🗂️"
            phase="Phase 2"
            summary="The catalogue and parties every transaction depends on — products with barcodes and tax, units with conversions, categories, and customer / supplier registration with opening balances."
            planned={[
                {
                    group: 'Catalogue',
                    items: [
                        'Products — barcode, price, tax, weight-based flag, reorder level',
                        'Categories — grocery, dairy, produce, frozen, beverages, …',
                        'Units of measure + conversions (kg, g, pcs, box, …)',
                    ],
                },
                {
                    group: 'Labels',
                    items: [
                        'Barcode & QR generation with label preview',
                    ],
                },
                {
                    group: 'Parties',
                    items: [
                        'Customer registration — credit limit & opening balance',
                        'Supplier registration — profile & opening balance',
                    ],
                },
                {
                    group: 'Setup',
                    items: [
                        'Per-branch minimum stock levels & price overrides',
                        'Opening-data CSV import',
                    ],
                },
            ]}
            scenarios={['New product created with barcode, tax and a per-branch min level']}
        />
    );
}
