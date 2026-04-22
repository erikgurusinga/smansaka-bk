import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
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
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, Teacher, User, PaginatedData } from '@/types';

const schema = z.object({
    nip: z.string().optional(),
    name: z.string().min(1, 'Nama wajib diisi'),
    phone: z.string().optional(),
    email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
    is_bk: z.boolean(),
    user_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    teachers: PaginatedData<Teacher>;
    users: User[];
    filters: { search?: string; is_bk?: string; per_page?: string };
}

export default function TeachersIndex({ teachers, users, filters, permissions }: Props) {
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Teacher | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<Teacher | null>(null);
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['classes']?.write;

    const userOptions = [
        { value: '', label: '— Tidak terhubung —' },
        ...users.map((u) => ({ value: String(u.id), label: `${u.name} (${u.username})` })),
    ];

    const bkFilterOptions = [
        { value: '', label: 'Semua Guru' },
        { value: '1', label: 'Guru BK' },
        { value: '0', label: 'Bukan Guru BK' },
    ];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { is_bk: false },
    });

    const openCreate = () => {
        reset({ nip: '', name: '', phone: '', email: '', is_bk: false, user_id: '' });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: Teacher) => {
        reset({
            nip: item.nip ?? '',
            name: item.name,
            phone: item.phone ?? '',
            email: item.email ?? '',
            is_bk: item.is_bk,
            user_id: item.user_id ? String(item.user_id) : '',
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const payload = {
            ...data,
            user_id: data.user_id ? Number(data.user_id) : null,
        };

        const method = editing ? 'put' : 'post';
        const url = editing ? route('teachers.update', editing.id) : route('teachers.store');

        router[method](url, payload, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'Data guru diperbarui.' : 'Guru ditambahkan.');
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('teachers.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Guru dihapus.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('teachers.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Master Data' },
                { label: 'Guru', href: route('teachers.index') },
            ]}
        >
            <Head title="Data Guru" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Data Guru</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Termasuk Guru BK yang menjadi konselor siswa
                        </p>
                    </div>
                    {canWrite && (
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Tambah Guru
                        </Button>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari nama / NIP..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-56"
                            />
                            <Select
                                value={filters.is_bk ?? ''}
                                onValueChange={(v) => handleFilter('is_bk', v)}
                                options={bkFilterOptions}
                                className="w-40"
                            />
                        </div>
                        <PerPageSelect
                            value={Number(filters.per_page ?? 15)}
                            onChange={(v) => handleFilter('per_page', String(v))}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">NIP</th>
                                    <th className="px-4 py-3">Telepon</th>
                                    <th className="px-4 py-3">Akun</th>
                                    <th className="px-4 py-3">Status</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {teachers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 6 : 5}>
                                            <EmptyState description="Belum ada data guru." />
                                        </td>
                                    </tr>
                                ) : (
                                    teachers.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.nip ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.phone ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.user ? (
                                                    <span className="font-mono text-xs">
                                                        {item.user.username}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.is_bk ? (
                                                    <Badge variant="success">
                                                        <ShieldCheck className="mr-1 h-3 w-3" />
                                                        Guru BK
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="neutral">Guru Mapel</Badge>
                                                )}
                                            </td>
                                            {canWrite && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openEdit(item)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setDeleteModal({ open: true, item })
                                                            }
                                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={teachers}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Guru' : 'Tambah Guru'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input id="name" {...register('name')} />
                        <InputError message={errors.name?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="nip">NIP</Label>
                            <Input id="nip" placeholder="Opsional" {...register('nip')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Telepon</Label>
                            <Input id="phone" {...register('phone')} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} />
                        <InputError message={errors.email?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Akun Login</Label>
                        <Select
                            value={watch('user_id') ?? ''}
                            onValueChange={(v) => setValue('user_id', v)}
                            options={userOptions}
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5">
                        <input
                            type="checkbox"
                            id="is_bk"
                            {...register('is_bk')}
                            className="text-primary-600 h-4 w-4 rounded"
                        />
                        <Label htmlFor="is_bk" className="cursor-pointer">
                            Guru BK (Bimbingan & Konseling)
                        </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDialogOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Guru"
                description={`Hapus data guru "${deleteModal.item?.name}"?`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
