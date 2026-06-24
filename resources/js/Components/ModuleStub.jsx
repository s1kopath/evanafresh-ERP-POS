import AppLayout from '@/Layouts/AppLayout';

function PhaseBadge({ phase }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Planned · {phase}
        </span>
    );
}

/**
 * A placeholder screen for a module that is not yet built.
 * It renders the planned scope (taken from the client proposal) so the
 * stub doubles as a living specification while we develop module by module.
 */
export default function ModuleStub({ title, subtitle, icon, phase, summary, planned = [], scenarios = [] }) {
    return (
        <AppLayout title={title} subtitle={subtitle} actions={<PhaseBadge phase={phase} />}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-brand-900">Module blueprint</h2>
                        <p className="mt-1 max-w-3xl text-sm text-slate-600">{summary}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {planned.map((group) => (
                    <div key={group.group} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-brand-800">{group.group}</h3>
                        <ul className="mt-3 space-y-2">
                            {group.items.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="mt-0.5 text-brand-600">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {scenarios.length > 0 && (
                <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                    <h3 className="text-sm font-bold text-brand-800">Demo scenarios this module must support</h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {scenarios.map((s) => (
                            <li key={s} className="flex items-start gap-2 text-sm text-brand-900">
                                <span className="mt-0.5">▸</span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </AppLayout>
    );
}
