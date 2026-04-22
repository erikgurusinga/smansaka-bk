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
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, SchoolClass, AcademicYear, User, PaginatedData } from '@/types';

const schema = z.object({
    name: z.string().min(1, 'Nama kelas wajib diisi'),
    level: z.enum(['X', 'XI', 'XII'], { required_error: 'Tingkat wajib dipilih' }),
    academic_year_id: z.string().min(1, 'Tahun ajaran wajib dipilih'),
    homeroom_teacher_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: PaginatedData<SchoolClass>;
    academic_years: AcademicYear[];
    homeroom_teachers: User[];
    filters: { search?: string; level?: string; academic_year_id?: string; per_page?: string };
}

const LEVEL_OPTIONS = [
    { value: 'X', label: 'Kelas X' },
    { value: 'XI', label: 'Kelas XI' },
    { value: 'XII', label: 'Kelas XII' },
];

const levelBadge = (level: string) => {
    const map: Record<string, 'default' | 'info' | 'success'> = {
        X: 'default',
        XI: 'info',
        XII: 'success',
    };
    return map[level] ?? 'neutral';
};

export default function ClassesIndex({
    classes,
    academic_years,
    homeroom_teachers,
    filters,
    permissions,
}: Props) {
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: SchoolClass | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<SchoolClass | null>(null);
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['classes']?.write;

    const ayOptions = academic_years.map((ay) => ({
        value: String(ay.id),
        label: `${ay.year} ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
    }));

    const teacherOptions = [
        { value: '', label: '— Belum ditentukan —' },
        ...homeroom_teachers.map((t) => ({ value: String(t.id), label: t.name })),
    ];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const openCreate = () => {
        reset({
            name: '',
            level: 'X',
            academic_year_id: String(academic_years[0]?.id ?? ''),
            homeroom_teacher_id: '',
        });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: SchoolClass) => {
        reset({
            name: item.name,
            level: item.level,
            academic_year_id: String(item.academic_year_id),
            homeroom_teacher_id: item.homeroom_teacher_id ? String(item.homeroom_teacher_id) : '',
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const payload = {
            ...data,
            academic_year_id: Number(data.academic_year_id),
            homeroom_teacher_id: data.homeroom_teacher_id ? Number(data.homeroom_teacher_id) : null,
        };

        const method = editing ? 'put' : 'post';
        const url = editing ? route('classes.update', editing.id) : route('classes.store');

        router[method](url, payload, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'Kelas diperbarui.' : 'Kelas ditambahkan.');
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('classes.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Kelas dihapus.');
            },
            onError: () => toast.error('Gagal menghapus.'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('classes.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Master Data' },
                { label: 'Kelas & Wali Kelas', href: route('classes.index') },
            ]}
        >
            <Head title="Kelas & Wali Kelas" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Kelas & Wali Kelas
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Manajemen data kelas dan penugasan wali kelas
                        </p>
                    </div>
                    {canWrite && (
                        <Button onClick={openCreate} size="md">
                            <Plus className="h-4 w-4" />
                            Tambah Kelas
                        </Button>
                    )}
                </div>

                {/* Tabel */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari kelas..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-56"
                            />
                            <Select
                                value={filters.level ?? ''}
                                onValueChange={(v) => handleFilter('level', v)}
                                options={[{ value: '', label: 'Semua Tingkat' }, ...LEVEL_OPTIONS]}
                                className="w-40"
                            />
                            <Select
                                value={filters.academic_year_id ?? ''}
                                onValueChange={(v) => handleFilter('academic_year_id', v)}
                                options={[{ value: '', label: 'Semua TA' }, ...ayOptions]}
                                className="w-48"
                            />
                        </div>
                        <PerPageSelect
                            value={Number(filters.per_page ?? 15)}
                            onChange={(v) => handleFilter('per_page', String(v))}
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
                                    <th className="px-4 py-3">Nama Kelas</th>
                                    <th className="px-4 py-3">Tingkat</th>
                                    <th className="px-4 py-3">Tahun Ajaran</th>
                                    <th className="px-4 py-3">Wali Kelas</th>
                                    <th className="px-4 py-3 text-center">Siswa</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {classes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 6 : 5}>
                                            <EmptyState description="Belum ada kelas yang ditambahkan." />
                                        </td>
                                    </tr>
                                ) : (
                                    classes.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={levelBadge(item.level)}>
                                                    Kelas {item.level}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.academic_year
                                                    ? `${item.academic_year.year} ${item.academic_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.homeroom_teacher?.name ?? (
                                                    <span className="text-neutral-300">
                                                        Belum ditentukan
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                                                    {item.students_count ?? 0}
                                                </span>
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

                    {/* Pagination */}
                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={classes}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Kelas' : 'Tambah Kelas'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nama Kelas</Label>
                        <Input id="name" placeholder="Contoh: X IPA 1" {...register('name')} />
                        <InputError message={errors.name?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Tingkat</Label>
                        <Select
                            value={watch('level') ?? ''}
                            onValueChange={(v) => setValue('level', v as 'X' | 'XI' | 'XII')}
                            options={LEVEL_OPTIONS}
                        />
                        <InputError message={errors.level?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Tahun Ajaran</Label>
                        <Select
                            value={watch('academic_year_id') ?? ''}
                            onValueChange={(v) => setValue('academic_year_id', v)}
                            options={ayOptions}
                        />
                        <InputError message={errors.academic_year_id?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Wali Kelas</Label>
                        <Select
                            value={watch('homeroom_teacher_id') ?? ''}
                            onValueChange={(v) => setValue('homeroom_teacher_id', v)}
                            options={teacherOptions}
                        />
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
                            {processing
                                ? 'Menyimpan...'
                                : editing
                                  ? 'Simpan Perubahan'
                                  : 'Tambah Kelas'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Delete Modal */}
            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Kelas"
                description={`Hapus kelas "${deleteModal.item?.name}"? Siswa yang terdaftar di kelas ini tidak akan ikut terhapus.`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
