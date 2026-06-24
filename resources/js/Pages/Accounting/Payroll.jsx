import ModuleStub from '@/Components/ModuleStub';

export default function PayrollIndex() {
    return (
        <ModuleStub
            title="Payroll & Employees"
            subtitle="Staff records & automated monthly salary"
            icon="👥"
            phase="Phase 2 · 7"
            summary="Maintain employee records per branch and run automated monthly payroll that posts straight to the general ledger and daily cash book."
            planned={[
                {
                    group: 'Employees (Phase 2)',
                    items: [
                        'Employee / staff records — salary, join date, branch, status',
                        'Role & branch assignment',
                    ],
                },
                {
                    group: 'Payroll run (Phase 7)',
                    items: [
                        'Automated monthly salary calculation',
                        'Allowances & deductions',
                        'Payslip generation',
                    ],
                },
                {
                    group: 'Posting',
                    items: [
                        'Payroll expense posts to the general ledger & cash book',
                        'Per-branch and company-consolidated payroll cost',
                    ],
                },
            ]}
            scenarios={['Monthly payroll run posts salary expense to the ledger']}
        />
    );
}
