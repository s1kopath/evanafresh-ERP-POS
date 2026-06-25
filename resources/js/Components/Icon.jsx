import {
    LayoutDashboard, ShoppingCart, Package, Hourglass, Truck, RefreshCw,
    Receipt, NotebookText, Wallet, Users, LineChart, Database, Building2,
    Settings, Puzzle, Sprout, Store, Tag, LayoutGrid, Scale, Contact,
    Inbox, Upload, Check, HelpCircle,
} from 'lucide-react';

/**
 * Single source of truth for the app's iconography. Reference icons by a
 * semantic name (a string) so both JSX and server-provided props (e.g. the
 * Master Data hub) can pick one. No emoji anywhere — see CLAUDE.md.
 */
const ICONS = {
    // Navigation
    dashboard: LayoutDashboard,
    pos: ShoppingCart,
    inventory: Package,
    expiry: Hourglass,
    purchasing: Truck,
    reorder: RefreshCw,
    'ledger-customer': Receipt,
    'ledger-supplier': NotebookText,
    accounting: Wallet,
    payroll: Users,
    reports: LineChart,
    'master-data': Database,
    branches: Building2,
    settings: Settings,
    'ui-kit': Puzzle,
    // Brand / chrome
    brand: Sprout,
    store: Store,
    // Master-data entities
    products: Tag,
    categories: LayoutGrid,
    units: Scale,
    customers: Users,
    suppliers: Truck,
    employees: Contact,
    import: Upload,
    // Misc
    inbox: Inbox,
    check: Check,
};

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 2, ...props }) {
    const Cmp = ICONS[name] ?? HelpCircle;
    return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
}
