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

            <h1 className="mb-1 text-2xl font-bold text-neutral-900">Selamat datang kembali</h1>
            <p className="mb-6 text-sm text-neutral-500">
                Masuk dengan akun yang diberikan oleh admin.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="username">Username atau Email</Label>
                    <div className="relative mt-1">
                        <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            autoFocus
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            placeholder="username atau email@sekolah.id"
                            className="focus:border-primary-400 focus:ring-primary-100 flex h-11 w-full rounded-xl border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm focus:ring-4 focus:outline-none"
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
                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="focus:border-primary-400 focus:ring-primary-100 flex h-11 w-full rounded-xl border border-neutral-200 bg-white py-2 pr-10 pl-9 text-sm focus:ring-4 focus:outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="text-primary-600 focus:ring-primary-400 rounded border-neutral-300"
                    />
                    Ingat saya di perangkat ini
                </label>

                <Button type="submit" size="lg" disabled={processing} className="w-full">
                    {processing ? 'Memproses...' : 'Masuk'}
                </Button>
            </form>

            <p className="mt-6 text-center text-xs text-neutral-500">
                Lupa password? Hubungi administrator sekolah.
            </p>
        </GuestLayout>
    );
}
