import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Dialog } from '@/Components/ui/Dialog';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, Violation, PaginatedData } from '@/types';

const schema = z.object({
    name: z.string().min(1, 'Nama pelanggaran wajib diisi').max(200),
    category: z.enum(['ringan', 'sedang', 'berat'], { required_error: 'Kategori wajib dipilih' }),
    points: z.coerce.number().int().min(1).max(100),
    description: z.string().optional(),
    is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    violations: PaginatedData<Violation>;
    filters: {
        search?: string;
        category?: string;
        per_page?: string;
    };
}

const CATEGORY_OPTIONS = [
    { value: 'ringan', label: 'Ringan' },
    { value: 'sedang', label: 'Sedang' },
    { value: 'berat', label: 'Berat' },
];

const categoryBadge = (c: string): 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'success' | 'warning' | 'danger'> = {
        ringan: 'success',
        sedang: 'warning',
        berat: 'danger',
    };
    return map[c] ?? 'warning';
};

export default function ViolationsIndex({ violations, filters, permissions }: Props) {
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Violation | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<Violation | null>(null);
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['violations']?.write;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { category: 'ringan', points: 5, is_active: true },
    });

    const openCreate = () => {
        reset({ name: '', category: 'ringan', points: 5, description: '', is_active: true });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: Violation) => {
        reset({
            name: item.name,
            category: item.category,
            points: item.points,
            description: item.description ?? '',
            is_active: item.is_active,
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const method = editing ? 'put' : 'post';
        const url = editing ? route('violations.update', editing.id) : route('violations.store');

        router[method](url, data, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(
                    editing ? 'Jenis pelanggaran diperbarui.' : 'Jenis pelanggaran ditambahkan.',
                );
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('violations.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Jenis pelanggaran dihapus.');
            },
            onError: () => toast.error('Tidak dapat menghapus — sudah digunakan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('violations.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Kasus & Pelanggaran' },
                { label: 'Jenis Pelanggaran', href: route('violations.index') },
            ]}
        >
            <Head title="Jenis Pelanggaran" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Jenis Pelanggaran
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Master data jenis pelanggaran dan poin
                        </p>
                    </div>
                    {canWrite && (
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Tambah Jenis
                        </Button>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari nama pelanggaran..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-64"
                            />
                            <Select
                                value={filters.category ?? ''}
                                onValueChange={(v) => handleFilter('category', v)}
                                options={[
                                    { value: '', label: 'Semua Kategori' },
                                    ...CATEGORY_OPTIONS,
                                ]}
                                className="w-40"
                            />
                        </div>
                        <PerPageSelect
                            value={Number(filters.per_page ?? 25)}
                            onChange={(v) => handleFilter('per_page', String(v))}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
                                    <th className="px-4 py-3">Nama Pelanggaran</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Poin</th>
                                    <th className="px-4 py-3">Pemakaian</th>
                                    <th className="px-4 py-3">Status</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {violations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 6 : 5}>
                                            <EmptyState description="Belum ada jenis pelanggaran." />
                                        </td>
                                    </tr>
                                ) : (
                                    violations.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.name}
                                                {item.description && (
                                                    <p className="mt-0.5 text-xs font-normal text-neutral-400">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={categoryBadge(item.category)}>
                                                    {item.category.charAt(0).toUpperCase() +
                                                        item.category.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-neutral-800">
                                                    {item.points}
                                                </span>
                                                <span className="ml-1 text-xs text-neutral-400">
                                                    poin
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.student_violations_count ?? 0}× dipakai
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={item.is_active ? 'success' : 'neutral'}
                                                >
                                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
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
                            meta={violations}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran'}
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="v-name">Nama Pelanggaran</Label>
                        <Input id="v-name" {...register('name')} />
                        <InputError message={errors.name?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Kategori</Label>
                            <Select
                                value={watch('category') ?? 'ringan'}
                                onValueChange={(v) =>
                                    setValue('category', v as 'ringan' | 'sedang' | 'berat')
                                }
                                options={CATEGORY_OPTIONS}
                            />
                            <InputError message={errors.category?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="v-points">Poin (1–100)</Label>
                            <Input
                                id="v-points"
                                type="number"
                                min={1}
                                max={100}
                                {...register('points', { valueAsNumber: true })}
                            />
                            <InputError message={errors.points?.message} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="v-desc">Keterangan</Label>
                        <Textarea
                            id="v-desc"
                            rows={2}
                            placeholder="Opsional"
                            {...register('description')}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                        <input type="checkbox" {...register('is_active')} className="rounded" />
                        Aktif (muncul saat catat pelanggaran)
                    </label>

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
                title="Hapus Jenis Pelanggaran"
                description={`Hapus jenis pelanggaran "${deleteModal.item?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
