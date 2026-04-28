import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Lock,
    Eye,
    EyeOff,
    Shield,
    CheckCircle2,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { PageProps } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileUser {
    id: number;
    username: string;
    name: string;
    email: string | null;
    position: string | null;
    phone: string | null;
}

interface Props extends PageProps {
    user: ProfileUser;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
    position: z.string().optional(),
    phone: z.string().optional(),
});

const passwordSchema = z
    .object({
        current_password: z.string().min(1, 'Password saat ini wajib diisi'),
        password: z.string().min(8, 'Password baru minimal 8 karakter'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Konfirmasi password tidak cocok',
        path: ['password_confirmation'],
    });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileEdit() {
    const { user } = usePage<Props>().props;

    return (
        <AuthenticatedLayout breadcrumbs={[{ label: 'Profil Saya' }]}>
            <Head title="Profil Saya" />

            <div className="mb-6">
                <h1 className="text-xl font-semibold text-neutral-900">Profil Saya</h1>
                <p className="mt-1 text-sm text-neutral-500">
                    Kelola informasi akun dan keamanan login Anda.
                </p>
            </div>

            {/* Avatar + info singkat */}
            <div className="from-primary-600 to-primary-700 mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 text-white shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold uppercase">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <p className="text-lg leading-tight font-semibold">{user.name}</p>
                    <p className="text-primary-200 text-sm">{user.position ?? 'Pengguna BK'}</p>
                    <p className="text-primary-300 mt-0.5 font-mono text-xs">@{user.username}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <InfoSection user={user} />
                <PasswordSection />
            </div>
        </AuthenticatedLayout>
    );
}

// ─── Info Section ─────────────────────────────────────────────────────────────

function InfoSection({ user }: { user: ProfileUser }) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            email: user.email ?? '',
            position: user.position ?? '',
            phone: user.phone ?? '',
        },
    });

    const onSubmit = (data: ProfileFormData) => {
        router.put(
            route('profile.update'),
            { ...data, email: data.email || null },
            {
                onSuccess: () => toast.success('Profil berhasil diperbarui.'),
                onError: (e) => toast.error(Object.values(e)[0] as string),
            },
        );
    };

    return (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-4">
                <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                    <User className="text-primary-600 h-5 w-5" />
                </div>
                <div>
                    <h2 className="font-semibold text-neutral-900">Informasi Akun</h2>
                    <p className="text-xs text-neutral-500">Nama, email, dan kontak</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
                {/* Username — readonly */}
                <div>
                    <Label>Username</Label>
                    <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
                        <Shield className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="font-mono text-neutral-700">{user.username}</span>
                        <span className="ml-auto text-xs text-neutral-400">Tidak dapat diubah</span>
                    </div>
                </div>

                <div>
                    <Label htmlFor="name">
                        Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        className="mt-1.5"
                        placeholder="Nama lengkap Anda"
                        {...register('name')}
                    />
                    <InputError message={errors.name?.message} />
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1.5">
                        <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="email"
                            type="email"
                            className="pl-9"
                            placeholder="email@sman1kabanjahe.sch.id"
                            {...register('email')}
                        />
                    </div>
                    <InputError message={errors.email?.message} />
                </div>

                <div>
                    <Label htmlFor="position">Jabatan</Label>
                    <div className="relative mt-1.5">
                        <Briefcase className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="position"
                            className="pl-9"
                            placeholder="Guru BK / Koordinator BK"
                            {...register('position')}
                        />
                    </div>
                    <InputError message={errors.position?.message} />
                </div>

                <div>
                    <Label htmlFor="phone">No. HP</Label>
                    <div className="relative mt-1.5">
                        <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="phone"
                            className="pl-9"
                            placeholder="08xxxxxxxxxx"
                            {...register('phone')}
                        />
                    </div>
                    <InputError message={errors.phone?.message} />
                </div>

                <div className="pt-1">
                    <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full">
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// ─── Password Section ─────────────────────────────────────────────────────────

function PasswordSection() {
    const [show, setShow] = useState({ current: false, new: false, confirm: false });

    const toggle = (field: keyof typeof show) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

    const newPass = watch('password') ?? '';

    const strength = (() => {
        if (newPass.length === 0) return 0;
        let score = 0;
        if (newPass.length >= 8) score++;
        if (newPass.length >= 12) score++;
        if (/[A-Z]/.test(newPass)) score++;
        if (/[0-9]/.test(newPass)) score++;
        if (/[^A-Za-z0-9]/.test(newPass)) score++;
        return score;
    })();

    const strengthLabel = ['', 'Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][strength];
    const strengthColor = [
        '',
        'bg-red-400',
        'bg-orange-400',
        'bg-yellow-400',
        'bg-primary-500',
        'bg-green-500',
    ][strength];

    const onSubmit = (data: PasswordFormData) => {
        router.put(route('profile.password'), data, {
            onSuccess: () => {
                toast.success('Password berhasil diubah.');
                reset();
            },
            onError: (e) => toast.error(Object.values(e)[0] as string),
        });
    };

    return (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                    <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h2 className="font-semibold text-neutral-900">Ganti Password</h2>
                    <p className="text-xs text-neutral-500">
                        Pastikan menggunakan password yang kuat
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
                {/* Current password */}
                <div>
                    <Label htmlFor="current_password">
                        Password Saat Ini <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="current_password"
                            type={show.current ? 'text' : 'password'}
                            className="pr-10 pl-9"
                            placeholder="Password Anda saat ini"
                            {...register('current_password')}
                        />
                        <button
                            type="button"
                            onClick={() => toggle('current')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            tabIndex={-1}
                        >
                            {show.current ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.current_password?.message} />
                </div>

                {/* New password + strength */}
                <div>
                    <Label htmlFor="password">
                        Password Baru <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="password"
                            type={show.new ? 'text' : 'password'}
                            className="pr-10 pl-9"
                            placeholder="Minimal 8 karakter"
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => toggle('new')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            tabIndex={-1}
                        >
                            {show.new ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {/* Strength bar */}
                    {newPass.length > 0 && (
                        <div className="mt-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-all ${
                                            i <= strength ? strengthColor : 'bg-neutral-200'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Kekuatan: <span className="font-medium">{strengthLabel}</span>
                            </p>
                        </div>
                    )}
                    <InputError message={errors.password?.message} />
                </div>

                {/* Confirm password */}
                <div>
                    <Label htmlFor="password_confirmation">
                        Konfirmasi Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="password_confirmation"
                            type={show.confirm ? 'text' : 'password'}
                            className="pr-10 pl-9"
                            placeholder="Ulangi password baru"
                            {...register('password_confirmation')}
                        />
                        <button
                            type="button"
                            onClick={() => toggle('confirm')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            tabIndex={-1}
                        >
                            {show.confirm ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                        {/* Match indicator */}
                        {watch('password_confirmation')?.length > 0 &&
                            watch('password') === watch('password_confirmation') && (
                                <CheckCircle2 className="absolute top-1/2 right-9 h-4 w-4 -translate-y-1/2 text-green-500" />
                            )}
                    </div>
                    <InputError message={errors.password_confirmation?.message} />
                </div>

                {/* Tips */}
                <div className="rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                    <p className="mb-1 font-medium text-neutral-700">Tips password kuat:</p>
                    <ul className="list-inside list-disc space-y-0.5">
                        <li>Minimal 8 karakter</li>
                        <li>Kombinasi huruf besar, kecil, angka, dan simbol</li>
                        <li>Jangan gunakan informasi pribadi</li>
                    </ul>
                </div>

                <div className="pt-1">
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? 'Memproses...' : 'Ubah Password'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
