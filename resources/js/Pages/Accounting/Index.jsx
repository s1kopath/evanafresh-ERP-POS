import ModuleStub from '@/Components/ModuleStub';

export default function AccountingIndex() {
    return (
        <ModuleStub
            title="Accounting"
            subtitle="Expenses, payroll, cash/bank & financial statements"
            icon="accounting"
            phase="Phase 7"
            summary="The financial books that every sale and purchase feeds into — expenses, payroll, cash and bank, and full statements (P&L, Balance Sheet) per branch and consolidated."
            planned={[
                {
                    group: 'Day-to-day',
                    items: [
                        'Expense management',
                        'Payroll & employee salary',
                        'Cash In / Cash Out & daily cash closing',
                        'Bank account management',
                    ],
                },
                {
                    group: 'Statements',
                    items: [
                        'Accounts Receivable (AR) & Accounts Payable (AP)',
                        'Profit & Loss statement',
                        'Balance Sheet',
                        'Per-branch and consolidated views',
                    ],
                },
                {
                    group: 'Tax',
                    items: ['15% VAT handling and VAT-return support'],
                },
            ]}
        />
    );
}
