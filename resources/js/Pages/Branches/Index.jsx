import ModuleStub from '@/Components/ModuleStub';

export default function BranchesIndex() {
    return (
        <ModuleStub
            title="Branches & Transfers"
            subtitle="Multi-branch control & inter-branch stock transfers"
            icon="🏢"
            phase="Phase 1 · 3"
            summary="Run all current and future branches from one login, move stock between them with a request / approve workflow, and roll every branch up into consolidated reporting."
            planned={[
                {
                    group: 'Branches',
                    items: [
                        'Centralized management of all branches from one login',
                        'Per-branch dashboards with strict data isolation',
                        'New branch setup without extra development (within license scope)',
                    ],
                },
                {
                    group: 'Access',
                    items: [
                        'Role-based visibility — manager sees own branch, owner sees all',
                        'Branch switcher in the topbar',
                    ],
                },
                {
                    group: 'Stock transfers',
                    items: [
                        'Inter-branch transfers: request → approve → receive',
                        'Transfers recorded as stock movements at both branches',
                    ],
                },
                {
                    group: 'Consolidation',
                    items: [
                        'Branch-wise sales, inventory & financial reporting',
                        'Company-level consolidated reporting across all branches',
                    ],
                },
            ]}
            scenarios={['Stock transferred between two branches with approval']}
        />
    );
}
