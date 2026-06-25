import { Head, useForm } from '@inertiajs/react';
import Button from '@/Components/ui/Button';
import Icon from '@/Components/Icon';
import { FormField, Input, InputError } from '@/Components/ui/Form';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-900 px-4 py-10">
            <Head title="Sign in" />

            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="mb-6 flex items-center justify-center gap-3 text-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white">
                        <Icon name="brand" className="h-7 w-7" />
                    </div>
                    <div className="leading-tight">
                        <div className="text-lg font-extrabold tracking-wide">Evana Fresh</div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/70">ERP &amp; POS</div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
                    <h1 className="text-lg font-bold text-brand-900">Sign in</h1>
                    <p className="mt-1 text-sm text-slate-500">Access the Evana Fresh management system.</p>

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <FormField label="Email" htmlFor="email" required error={errors.email}>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                autoComplete="username"
                                autoFocus
                                error={errors.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Password" htmlFor="password" required>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                autoComplete="current-password"
                                error={errors.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </FormField>

                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            Remember me
                        </label>

                        <Button type="submit" className="w-full" loading={processing}>
                            Sign in
                        </Button>
                    </form>

                    {/* Demo credentials — remove before go-live (Phase 11). */}
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                        <div className="font-semibold text-slate-600">Demo logins (password: <code>password</code>)</div>
                        <div className="mt-1 grid gap-0.5">
                            <span>owner@evanafresh.com — all branches</span>
                            <span>manager@evanafresh.com — Branch B1</span>
                            <span>cashier@evanafresh.com — Branch B1</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
