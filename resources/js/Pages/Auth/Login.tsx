import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Selamat datang kembali</h1>
            <p className="text-sm text-neutral-500 mb-6">
                Masuk dengan akun yang diberikan oleh admin.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="username">Username</Label>
                    <div className="relative mt-1">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            autoFocus
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                            required
                        />
                    </div>
                    <InputError message={errors.username} />
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Kata Sandi</Label>
                    </div>
                    <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-10 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
                    />
                    Ingat saya di perangkat ini
                </label>

                <Button type="submit" size="lg" disabled={processing} className="w-full">
                    {processing ? 'Memproses...' : 'Masuk'}
                </Button>
            </form>

            <p className="mt-6 text-xs text-center text-neutral-500">
                Lupa password? Hubungi administrator sekolah.
            </p>
        </GuestLayout>
    );
}
