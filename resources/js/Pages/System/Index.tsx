import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Users,
    ShieldCheck,
    Palette,
    ScrollText,
    Plus,
    Pencil,
    Trash2,
    KeyRound,
    Check,
    X,
    Eye,
    EyeOff,
    School,
    ImageIcon,
    GraduationCap,
    Globe,
    Phone,
    Mail,
    UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Dialog } from '@/Components/ui/Dialog';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, PaginatedData } from '@/types';
import { cn } from '@/lib/utils';
import { FileDropZone } from '@/Components/ui/FileDropZone';
import { Textarea } from '@/Components/ui/Textarea';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemUser {
    id: number;
    username: string;
    name: string;
    email: string | null;
    position: string | null;
    phone: string | null;
    groups: number[];
    is_active: boolean;
    last_login_at: string | null;
}

interface SystemGroup {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    accesses: Record<string, { read: boolean; write: boolean }>;
}

interface SystemModule {
    id: number;
    name: string;
    slug: string;
    parent_slug: string | null;
    is_active: boolean;
}

interface BrandingField {
    value: string;
    label: string;
}

interface ActivityItem {
    id: number;
    description: string;
    event: string | null;
    subject_type: string | null;
    subject_id: number | null;
    causer: { id: number; name: string; username: string } | null;
    created_at: string;
}

interface Props extends PageProps {
    system_users: SystemUser[];
    groups: SystemGroup[];
    modules: SystemModule[];
    settings: Record<string, BrandingField>;
    activity_log: PaginatedData<ActivityItem>;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const userSchema = z.object({
    username: z.string().min(3, 'Minimal 3 karakter'),
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
    password: z.string().min(8, 'Minimal 8 karakter').optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
    position: z.string().optional(),
    phone: z.string().optional(),
    groups: z.array(z.number()),
    is_active: z.boolean(),
});
type UserFormData = z.infer<typeof userSchema>;

const brandingSchema = z.object({
    site_name: z.string().min(1, 'Wajib diisi'),
    site_short_name: z.string().min(1, 'Wajib diisi'),
    footer_text: z.string().optional(),
    school_name: z.string().min(1, 'Wajib diisi'),
    school_address: z.string().optional(),
    npsn: z.string().optional(),
    school_phone: z.string().optional(),
    school_email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
    school_website: z.string().optional(),
    principal_name: z.string().optional(),
    principal_nip: z.string().optional(),
    coordinator_name: z.string().optional(),
    coordinator_nip: z.string().optional(),
});
type BrandingFormData = z.infer<typeof brandingSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = 'users' | 'groups' | 'branding' | 'log';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'Pengguna', icon: <Users className="h-4 w-4" /> },
    { key: 'groups', label: 'Grup & Akses', icon: <ShieldCheck className="h-4 w-4" /> },
    { key: 'branding', label: 'Profil Sekolah', icon: <Palette className="h-4 w-4" /> },
    { key: 'log', label: 'Log Aktivitas', icon: <ScrollText className="h-4 w-4" /> },
];

const MODULE_GROUP_LABELS: Record<string, string> = {
    '': 'Umum',
    master: 'Master Data',
    counseling: 'Layanan BK',
    cases_group: 'Kasus & Pelanggaran',
    instrument: 'Instrumen',
    program: 'Program BK',
    report: 'Laporan',
    system: 'Sistem',
};

function getModuleGroupLabel(parentSlug: string | null): string {
    if (!parentSlug) return 'Umum';
    return MODULE_GROUP_LABELS[parentSlug] ?? parentSlug;
}

function subjectLabel(type: string | null): string {
    if (!type) return '—';
    const map: Record<string, string> = {
        'App\\Models\\User': 'Pengguna',
        'App\\Models\\Student': 'Siswa',
        'App\\Models\\CaseRecord': 'Buku Kasus',
        'App\\Models\\CounselingSession': 'Konseling',
        'App\\Models\\HomeVisit': 'Home Visit',
        'App\\Models\\Referral': 'Referral',
        'App\\Models\\StudentViolation': 'Pelanggaran',
    };
    return map[type] ?? type.split('\\').pop() ?? type;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemIndex() {
    const { system_users, groups, modules, settings, activity_log } = usePage<Props>().props;
    const [tab, setTab] = useState<TabKey>('users');

    return (
        <AuthenticatedLayout breadcrumbs={[{ label: 'Sistem' }]}>
            <Head title="Sistem" />

            <div className="mb-6">
                <h1 className="text-xl font-semibold text-neutral-900">Pengaturan Sistem</h1>
                <p className="mt-1 text-sm text-neutral-500">
                    Kelola pengguna, hak akses grup, branding, dan log aktivitas.
                </p>
            </div>

            {/* Tab bar */}
            <div className="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                            tab === t.key
                                ? 'bg-white text-neutral-900 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700',
                        )}
                    >
                        {t.icon}
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {tab === 'users' && <UsersTab users={system_users} groups={groups} />}
            {tab === 'groups' && <GroupsTab groups={groups} modules={modules} />}
            {tab === 'branding' && <BrandingTab settings={settings} />}
            {tab === 'log' && <LogTab activityLog={activity_log} />}
        </AuthenticatedLayout>
    );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ users, groups }: { users: SystemUser[]; groups: SystemGroup[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const groupOptions = groups.map((g) => ({ value: String(g.id), label: g.name }));

    const schema = z
        .object({
            username: z.string().min(3, 'Minimal 3 karakter'),
            name: z.string().min(1, 'Nama wajib diisi'),
            email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
            password: z.string().min(8, 'Minimal 8 karakter').optional().or(z.literal('')),
            password_confirmation: z.string().optional().or(z.literal('')),
            position: z.string().optional(),
            phone: z.string().optional(),
            groups: z.array(z.number()),
            is_active: z.boolean(),
        })
        .superRefine((data, ctx) => {
            if (data.password && data.password !== data.password_confirmation) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Konfirmasi password tidak cocok',
                    path: ['password_confirmation'],
                });
            }
        });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<UserFormData>({ resolver: zodResolver(schema) });

    const selectedGroups = watch('groups') ?? [];

    const openCreate = () => {
        setEditTarget(null);
        setShowPassword(false);
        setShowConfirm(false);
        reset({
            username: '',
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            position: '',
            phone: '',
            groups: [],
            is_active: true,
        });
        setDialogOpen(true);
    };

    const openEdit = (u: SystemUser) => {
        setEditTarget(u);
        setShowPassword(false);
        setShowConfirm(false);
        reset({
            username: u.username,
            name: u.name,
            email: u.email ?? '',
            password: '',
            password_confirmation: '',
            position: u.position ?? '',
            phone: u.phone ?? '',
            groups: u.groups ?? [],
            is_active: u.is_active,
        });
        setDialogOpen(true);
    };

    const toggleGroup = (id: number) => {
        const current = selectedGroups;
        setValue(
            'groups',
            current.includes(id) ? current.filter((g) => g !== id) : [...current, id],
        );
    };

    const onSubmit = (data: UserFormData) => {
        const payload: Record<string, unknown> = {
            username: data.username,
            name: data.name,
            email: data.email || null,
            position: data.position,
            phone: data.phone,
            groups: data.groups,
            is_active: data.is_active,
        };
        if (data.password) {
            payload.password = data.password;
        }

        if (editTarget) {
            router.put(route('system.users.update', editTarget.id), payload, {
                onSuccess: () => {
                    setDialogOpen(false);
                    toast.success('Pengguna diperbarui.');
                },
                onError: (e) => toast.error(Object.values(e)[0] as string),
            });
        } else {
            router.post(route('system.users.store'), payload, {
                onSuccess: () => {
                    setDialogOpen(false);
                    toast.success('Pengguna ditambahkan.');
                },
                onError: (e) => toast.error(Object.values(e)[0] as string),
            });
        }
    };

    const onDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('system.users.destroy', deleteTarget.id), {
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success('Pengguna dihapus.');
            },
            onError: () => toast.error('Gagal menghapus pengguna.'),
        });
    };

    return (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                <p className="font-medium text-neutral-900">Daftar Pengguna ({users.length})</p>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-1.5 h-4 w-4" /> Tambah Pengguna
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 text-left text-xs font-medium text-neutral-500 uppercase">
                            <th className="px-6 py-3">Username</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Jabatan</th>
                            <th className="px-4 py-3">Grup</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Login Terakhir</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-3 font-mono font-medium text-neutral-900">
                                    {u.username}
                                </td>
                                <td className="px-4 py-3 text-neutral-700">{u.name}</td>
                                <td className="px-4 py-3 text-neutral-500">{u.position ?? '—'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {(u.groups ?? []).map((gid) => {
                                            const g = groups.find((x) => x.id === gid);
                                            return g ? (
                                                <Badge key={gid} variant="info">
                                                    {g.name}
                                                </Badge>
                                            ) : null;
                                        })}
                                        {(u.groups ?? []).length === 0 && (
                                            <span className="text-neutral-400">—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-neutral-500">
                                    {u.last_login_at
                                        ? format(new Date(u.last_login_at), 'd MMM yyyy', {
                                              locale: idLocale,
                                          })
                                        : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        {u.id !== 1 && (
                                            <button
                                                onClick={() => setDeleteTarget(u)}
                                                className="hover:bg-danger-50 hover:text-danger-600 rounded-lg p-1.5 text-neutral-400"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <EmptyState
                        icon={<Users className="h-8 w-8" />}
                        title="Belum ada pengguna"
                        description="Tambahkan pengguna pertama."
                    />
                )}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editTarget ? 'Edit Pengguna' : 'Tambah Pengguna'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Username</Label>
                            <Input
                                {...register('username')}
                                placeholder="username"
                                disabled={editTarget?.id === 1}
                                className="mt-1 font-mono"
                            />
                            <InputError message={errors.username?.message} />
                        </div>
                        <div>
                            <Label>Nama Lengkap</Label>
                            <Input {...register('name')} placeholder="Nama" className="mt-1" />
                            <InputError message={errors.name?.message} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Email</Label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="email@sekolah.id"
                                className="mt-1"
                            />
                            <InputError message={errors.email?.message} />
                        </div>
                        <div>
                            <Label>
                                {editTarget ? (
                                    <span className="flex items-center gap-1">
                                        <KeyRound className="h-3.5 w-3.5" />
                                        Password Baru
                                    </span>
                                ) : (
                                    'Password *'
                                )}
                            </Label>
                            <div className="relative mt-1">
                                <Input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={
                                        editTarget
                                            ? 'Kosongkan jika tidak diubah'
                                            : 'Min. 8 karakter'
                                    }
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password?.message} />
                        </div>
                    </div>

                    {/* Konfirmasi password — tampil saat ada isian password */}
                    {watch('password') && (
                        <div>
                            <Label>Konfirmasi Password *</Label>
                            <div className="relative mt-1">
                                <Input
                                    {...register('password_confirmation')}
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Ulangi password di atas"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                                {watch('password_confirmation') &&
                                    watch('password') === watch('password_confirmation') && (
                                        <Check className="absolute top-1/2 right-9 h-4 w-4 -translate-y-1/2 text-green-500" />
                                    )}
                            </div>
                            <InputError message={errors.password_confirmation?.message} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Jabatan</Label>
                            <Input
                                {...register('position')}
                                placeholder="Guru BK"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>No. Telepon</Label>
                            <Input {...register('phone')} placeholder="08xx" className="mt-1" />
                        </div>
                    </div>

                    {editTarget?.id !== 1 && (
                        <>
                            <div>
                                <Label>Grup</Label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {groups.map((g) => (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => toggleGroup(g.id)}
                                            className={cn(
                                                'rounded-lg border px-3 py-1.5 text-sm transition',
                                                selectedGroups.includes(g.id)
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300',
                                            )}
                                        >
                                            {g.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    {...register('is_active')}
                                    className="h-4 w-4 rounded border-neutral-300"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    Pengguna aktif
                                </Label>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {editTarget ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DeleteModal
                open={!!deleteTarget}
                title="Hapus Pengguna"
                description={`Hapus pengguna "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={onDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </div>
    );
}

// ─── Groups Tab ───────────────────────────────────────────────────────────────

function GroupsTab({ groups, modules }: { groups: SystemGroup[]; modules: SystemModule[] }) {
    const [accessTarget, setAccessTarget] = useState<SystemGroup | null>(null);
    const [matrix, setMatrix] = useState<Record<number, { read: boolean; write: boolean }>>({});

    const openAccessModal = (g: SystemGroup) => {
        const initial: Record<number, { read: boolean; write: boolean }> = {};
        modules.forEach((m) => {
            const a = g.accesses[m.slug];
            initial[m.id] = { read: a?.read ?? false, write: a?.write ?? false };
        });
        setMatrix(initial);
        setAccessTarget(g);
    };

    const toggleAccess = (moduleId: number, field: 'read' | 'write') => {
        setMatrix((prev) => {
            const cur = prev[moduleId] ?? { read: false, write: false };
            const next = { ...cur, [field]: !cur[field] };
            if (field === 'write' && next.write) next.read = true;
            if (field === 'read' && !next.read) next.write = false;
            return { ...prev, [moduleId]: next };
        });
    };

    const saveAccess = () => {
        if (!accessTarget) return;
        const accesses = modules.map((m) => ({
            module_id: m.id,
            can_read: matrix[m.id]?.read ?? false,
            can_write: matrix[m.id]?.write ?? false,
        }));
        router.put(
            route('system.groups.access', accessTarget.id),
            { accesses },
            {
                onSuccess: () => {
                    setAccessTarget(null);
                    toast.success('Hak akses disimpan.');
                },
                onError: () => toast.error('Gagal menyimpan hak akses.'),
            },
        );
    };

    // Group modules by parent_slug
    const moduleGroups = modules.reduce<Record<string, SystemModule[]>>((acc, m) => {
        const key = m.parent_slug ?? '';
        (acc[key] = acc[key] ?? []).push(m);
        return acc;
    }, {});

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((g) => {
                    const accessCount = Object.values(g.accesses).filter((a) => a.read).length;
                    return (
                        <div
                            key={g.id}
                            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-neutral-900">{g.name}</p>
                                    {g.description && (
                                        <p className="mt-0.5 text-xs text-neutral-500">
                                            {g.description}
                                        </p>
                                    )}
                                </div>
                                {g.is_system && <Badge variant="info">Sistem</Badge>}
                            </div>
                            <p className="mt-3 text-sm text-neutral-500">
                                Akses ke{' '}
                                <span className="font-medium text-neutral-700">{accessCount}</span>{' '}
                                modul
                            </p>
                            <button
                                onClick={() => openAccessModal(g)}
                                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                            >
                                <ShieldCheck className="h-4 w-4" /> Edit Hak Akses
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Permissions matrix dialog */}
            <Dialog
                open={!!accessTarget}
                onClose={() => setAccessTarget(null)}
                title={`Hak Akses: ${accessTarget?.name}`}
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    {Object.entries(moduleGroups).map(([parentSlug, mods]) => (
                        <div key={parentSlug} className="mb-4">
                            <p className="mb-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                                {getModuleGroupLabel(parentSlug || null)}
                            </p>
                            <div className="overflow-hidden rounded-xl border border-neutral-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-neutral-50 text-xs text-neutral-500">
                                            <th className="px-4 py-2 text-left font-medium">
                                                Modul
                                            </th>
                                            <th className="w-16 px-4 py-2 text-center font-medium">
                                                Baca
                                            </th>
                                            <th className="w-16 px-4 py-2 text-center font-medium">
                                                Tulis
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-50">
                                        {mods.map((m) => (
                                            <tr key={m.id} className="hover:bg-neutral-50">
                                                <td className="px-4 py-2.5 text-neutral-700">
                                                    {m.name}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAccess(m.id, 'read')}
                                                        className={cn(
                                                            'inline-flex h-6 w-6 items-center justify-center rounded-md transition',
                                                            matrix[m.id]?.read
                                                                ? 'bg-primary-100 text-primary-700'
                                                                : 'bg-neutral-100 text-neutral-300',
                                                        )}
                                                    >
                                                        {matrix[m.id]?.read ? (
                                                            <Check className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <X className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAccess(m.id, 'write')}
                                                        className={cn(
                                                            'inline-flex h-6 w-6 items-center justify-center rounded-md transition',
                                                            matrix[m.id]?.write
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-neutral-100 text-neutral-300',
                                                        )}
                                                    >
                                                        {matrix[m.id]?.write ? (
                                                            <Check className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <X className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                    <Button variant="secondary" onClick={() => setAccessTarget(null)}>
                        Batal
                    </Button>
                    <Button onClick={saveAccess}>Simpan Hak Akses</Button>
                </div>
            </Dialog>
        </>
    );
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────

function BrandingTab({ settings }: { settings: Record<string, BrandingField> }) {
    const [logoUploading, setLogoUploading] = useState(false);
    const [faviconUploading, setFaviconUploading] = useState(false);

    const logoUrl = settings.logo?.value ? `/storage/${settings.logo.value}` : null;
    const faviconUrl = settings.favicon?.value ? `/storage/${settings.favicon.value}` : null;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<BrandingFormData>({
        resolver: zodResolver(brandingSchema),
        defaultValues: {
            site_name: settings.site_name?.value ?? '',
            site_short_name: settings.site_short_name?.value ?? '',
            footer_text: settings.footer_text?.value ?? '',
            school_name: settings.school_name?.value ?? '',
            school_address: settings.school_address?.value ?? '',
            npsn: settings.npsn?.value ?? '',
            school_phone: settings.school_phone?.value ?? '',
            school_email: settings.school_email?.value ?? '',
            school_website: settings.school_website?.value ?? '',
            principal_name: settings.principal_name?.value ?? '',
            principal_nip: settings.principal_nip?.value ?? '',
            coordinator_name: settings.coordinator_name?.value ?? '',
            coordinator_nip: settings.coordinator_nip?.value ?? '',
        },
    });

    const onSubmit = (data: BrandingFormData) => {
        router.post(route('system.branding.update'), data, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan berhasil disimpan.'),
            onError: (e) => toast.error(Object.values(e)[0] as string),
        });
    };

    const uploadLogo = (file: File) => {
        setLogoUploading(true);
        router.post(
            route('system.branding.logo'),
            { logo: file },
            {
                forceFormData: true,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => toast.success('Logo berhasil diunggah.'),
                onError: () => toast.error('Gagal mengunggah logo.'),
                onFinish: () => setLogoUploading(false),
            },
        );
    };

    const uploadFavicon = (file: File) => {
        setFaviconUploading(true);
        router.post(
            route('system.branding.favicon'),
            { favicon: file },
            {
                forceFormData: true,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => toast.success('Favicon berhasil diunggah.'),
                onError: () => toast.error('Gagal mengunggah favicon.'),
                onFinish: () => setFaviconUploading(false),
            },
        );
    };

    return (
        <div className="space-y-5">
            {/* Section 1 — Identitas Visual */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                <div className="mb-5 flex items-center gap-2">
                    <div className="bg-primary-50 flex h-8 w-8 items-center justify-center rounded-lg">
                        <ImageIcon className="text-primary-600 h-4 w-4" />
                    </div>
                    <h2 className="font-semibold text-neutral-900">Identitas Visual</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Logo Sekolah</Label>
                        <FileDropZone
                            key={logoUrl ?? 'no-logo'}
                            shape="wide"
                            currentUrl={logoUrl}
                            onFile={uploadLogo}
                            uploading={logoUploading}
                            label="Klik atau seret logo ke sini"
                            hint="PNG/SVG transparan, maks 2 MB"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Favicon</Label>
                        <FileDropZone
                            key={faviconUrl ?? 'no-favicon'}
                            shape="square"
                            currentUrl={faviconUrl}
                            onFile={uploadFavicon}
                            uploading={faviconUploading}
                            label="Klik atau seret favicon"
                            hint="ICO/PNG 32×32 atau 64×64, maks 2 MB"
                        />
                    </div>
                </div>
            </div>

            {/* Sections 2–4 — text fields */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Section 2 — Identitas Aplikasi */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="mb-5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                            <Palette className="h-4 w-4 text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-neutral-900">Identitas Aplikasi</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label>Nama Aplikasi</Label>
                            <Input
                                {...register('site_name')}
                                className="mt-1"
                                placeholder="Sistem Informasi BK..."
                            />
                            <InputError message={errors.site_name?.message} />
                        </div>
                        <div>
                            <Label>Nama Singkat</Label>
                            <Input
                                {...register('site_short_name')}
                                className="mt-1"
                                placeholder="BK SMANSAKA"
                            />
                            <InputError message={errors.site_short_name?.message} />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>Teks Footer</Label>
                            <Textarea
                                {...register('footer_text')}
                                className="mt-1"
                                rows={2}
                                placeholder="© 2026 SMA Negeri 1 Kabanjahe. Hak cipta dilindungi."
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3 — Identitas Sekolah */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="mb-5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                            <School className="h-4 w-4 text-emerald-600" />
                        </div>
                        <h2 className="font-semibold text-neutral-900">Identitas Sekolah</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label>Nama Sekolah</Label>
                            <Input
                                {...register('school_name')}
                                className="mt-1"
                                placeholder="SMA Negeri 1 Kabanjahe"
                            />
                            <InputError message={errors.school_name?.message} />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>Alamat Sekolah</Label>
                            <Textarea
                                {...register('school_address')}
                                className="mt-1"
                                rows={2}
                                placeholder="Jl. Veteran No. 1, Kabanjahe..."
                            />
                        </div>
                        <div>
                            <Label>NPSN</Label>
                            <Input {...register('npsn')} className="mt-1" placeholder="10200001" />
                        </div>
                        <div>
                            <Label>Nomor Telepon Sekolah</Label>
                            <div className="relative mt-1">
                                <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    {...register('school_phone')}
                                    className="pl-9"
                                    placeholder="0628-XXXXXX"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Email Sekolah</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    {...register('school_email')}
                                    className="pl-9"
                                    placeholder="info@sman1kabanjahe.sch.id"
                                />
                            </div>
                            <InputError message={errors.school_email?.message} />
                        </div>
                        <div>
                            <Label>Website Sekolah</Label>
                            <div className="relative mt-1">
                                <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    {...register('school_website')}
                                    className="pl-9"
                                    placeholder="https://sman1kabanjahe.sch.id"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4 — Pejabat Sekolah */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="mb-5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                            <UserCog className="h-4 w-4 text-violet-600" />
                        </div>
                        <h2 className="font-semibold text-neutral-900">Pejabat Sekolah</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label>Nama Kepala Sekolah</Label>
                            <div className="relative mt-1">
                                <GraduationCap className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    {...register('principal_name')}
                                    className="pl-9"
                                    placeholder="Drs. ..."
                                />
                            </div>
                        </div>
                        <div>
                            <Label>NIP Kepala Sekolah</Label>
                            <Input
                                {...register('principal_nip')}
                                className="mt-1"
                                placeholder="19XXXXXXXXXXXXXX"
                            />
                        </div>
                        <div>
                            <Label>Nama Koordinator BK</Label>
                            <div className="relative mt-1">
                                <UserCog className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    {...register('coordinator_name')}
                                    className="pl-9"
                                    placeholder="..."
                                />
                            </div>
                        </div>
                        <div>
                            <Label>NIP Koordinator BK</Label>
                            <Input
                                {...register('coordinator_nip')}
                                className="mt-1"
                                placeholder="19XXXXXXXXXXXXXX"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !isDirty} className="px-8">
                        Simpan Pengaturan
                    </Button>
                </div>
            </form>
        </div>
    );
}

// ─── Activity Log Tab ─────────────────────────────────────────────────────────

function LogTab({ activityLog }: { activityLog: PaginatedData<ActivityItem> }) {
    const eventBadge = (event: string | null) => {
        const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
            created: 'success',
            updated: 'warning',
            deleted: 'danger',
        };
        return map[event ?? ''] ?? 'info';
    };

    const eventLabel = (e: string | null) => {
        const map: Record<string, string> = {
            created: 'Dibuat',
            updated: 'Diubah',
            deleted: 'Dihapus',
        };
        return map[e ?? ''] ?? e ?? '—';
    };

    return (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
            <div className="border-b border-neutral-100 px-6 py-4">
                <p className="font-medium text-neutral-900">
                    Log Aktivitas ({activityLog.total} entri)
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 text-left text-xs font-medium text-neutral-500 uppercase">
                            <th className="px-6 py-3">Waktu</th>
                            <th className="px-4 py-3">Pengguna</th>
                            <th className="px-4 py-3">Aksi</th>
                            <th className="px-4 py-3">Subjek</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {activityLog.data.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-3 text-neutral-500">
                                    {format(new Date(item.created_at), 'd MMM yyyy HH:mm', {
                                        locale: idLocale,
                                    })}
                                </td>
                                <td className="px-4 py-3">
                                    {item.causer ? (
                                        <span className="font-medium text-neutral-700">
                                            {item.causer.name}
                                        </span>
                                    ) : (
                                        <span className="text-neutral-400">Sistem</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={eventBadge(item.event)}>
                                        {eventLabel(item.event)}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-neutral-500">
                                    {subjectLabel(item.subject_type)}
                                    {item.subject_id ? (
                                        <span className="ml-1 text-neutral-400">
                                            #{item.subject_id}
                                        </span>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {activityLog.data.length === 0 && (
                    <EmptyState
                        icon={<ScrollText className="h-8 w-8" />}
                        title="Belum ada log"
                        description="Aktivitas akan muncul di sini."
                    />
                )}
            </div>
            <div className="border-t border-neutral-100 px-6 py-4">
                <Pagination
                    meta={activityLog}
                    onPageChange={(p) =>
                        router.get(route('system.index'), { page: p }, { preserveState: true })
                    }
                />
            </div>
        </div>
    );
}
