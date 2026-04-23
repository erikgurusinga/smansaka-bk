import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Pencil, Trash2, CheckCircle2, CalendarDays } from 'lucide-react';
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
import { PageProps, AcademicYear, PaginatedData } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    year: z
        .string()
        .min(1, 'Tahun ajaran wajib diisi')
        .regex(/^\d{4}\/\d{4}$/, 'Format: 2026/2027'),
    semester: z.enum(['ganjil', 'genap'], { required_error: 'Semester wajib dipilih' }),
    start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
    end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
    notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    academic_years: PaginatedData<AcademicYear>;
    filters: { search?: string; per_page?: string };
}

const SEMESTER_OPTIONS = [
    { value: 'ganjil', label: 'Ganjil' },
    { value: 'genap', label: 'Genap' },
];

const fmtDate = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: localeId });

export default function AcademicYearsIndex({ academic_years, filters, permissions }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: AcademicYear | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<AcademicYear | null>(null);
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['academic_years']?.write;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const openCreate = () => {
        reset({ year: '', semester: 'ganjil', start_date: '', end_date: '', notes: '' });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: AcademicYear) => {
        reset({
            year: item.year,
            semester: item.semester,
            start_date: item.start_date.slice(0, 10),
            end_date: item.end_date.slice(0, 10),
            notes: item.notes ?? '',
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const method = editing ? 'put' : 'post';
        const url = editing
            ? route('academic-years.update', editing.id)
            : route('academic-years.store');

        router[method](url, data, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'Tahun ajaran diperbarui.' : 'Tahun ajaran ditambahkan.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleActivate = (item: AcademicYear) => {
        setProcessing(true);
        router.post(
            route('academic-years.activate', item.id),
            {},
            {
                onSuccess: () => toast.success(`Tahun ajaran ${item.year} diaktifkan.`),
                onError: handleError,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('academic-years.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Tahun ajaran dihapus.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('academic-years.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Master Data' },
                { label: 'Tahun Ajaran', href: route('academic-years.index') },
            ]}
        >
            <Head title="Tahun Ajaran" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Tahun Ajaran</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Manajemen tahun ajaran dan semester aktif
                        </p>
                    </div>
                    {canWrite && (
                        <Button onClick={openCreate} size="md">
                            <Plus className="h-4 w-4" />
                            Tambah Tahun Ajaran
                        </Button>
                    )}
                </div>

                {/* Tabel */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <SearchInput
                            placeholder="Cari tahun ajaran..."
                            defaultValue={filters.search}
                            onChange={(e) => handleFilter('search', e.target.value)}
                            className="w-60"
                        />
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
                                    <th className="px-4 py-3">Tahun Ajaran</th>
                                    <th className="px-4 py-3">Semester</th>
                                    <th className="px-4 py-3">Periode</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Catatan</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {academic_years.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 6 : 5}>
                                            <EmptyState
                                                icon={<CalendarDays className="h-8 w-8" />}
                                                description="Belum ada tahun ajaran yang ditambahkan."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    academic_years.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 font-semibold text-neutral-900">
                                                {item.year}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        item.semester === 'ganjil'
                                                            ? 'info'
                                                            : 'warning'
                                                    }
                                                >
                                                    {item.semester === 'ganjil'
                                                        ? 'Ganjil'
                                                        : 'Genap'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {fmtDate(item.start_date)} –{' '}
                                                {fmtDate(item.end_date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.is_active ? (
                                                    <Badge variant="success">Aktif</Badge>
                                                ) : item.is_closed ? (
                                                    <Badge variant="neutral">Ditutup</Badge>
                                                ) : (
                                                    <Badge variant="default">Tidak Aktif</Badge>
                                                )}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-neutral-500">
                                                {item.notes ?? '—'}
                                            </td>
                                            {canWrite && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {!item.is_active && (
                                                            <button
                                                                onClick={() => handleActivate(item)}
                                                                disabled={processing}
                                                                title="Jadikan aktif"
                                                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-green-50 hover:text-green-600"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEdit(item)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        {!item.is_active && (
                                                            <button
                                                                onClick={() =>
                                                                    setDeleteModal({
                                                                        open: true,
                                                                        item,
                                                                    })
                                                                }
                                                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
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
                            meta={academic_years}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="year">Tahun Ajaran</Label>
                        <Input id="year" placeholder="Contoh: 2026/2027" {...register('year')} />
                        <InputError message={errors.year?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Semester</Label>
                        <Select
                            value={watch('semester') ?? 'ganjil'}
                            onValueChange={(v) => setValue('semester', v as 'ganjil' | 'genap')}
                            options={SEMESTER_OPTIONS}
                        />
                        <InputError message={errors.semester?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="start_date">Tanggal Mulai</Label>
                            <Input id="start_date" type="date" {...register('start_date')} />
                            <InputError message={errors.start_date?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="end_date">Tanggal Selesai</Label>
                            <Input id="end_date" type="date" {...register('end_date')} />
                            <InputError message={errors.end_date?.message} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Catatan</Label>
                        <Input id="notes" placeholder="Opsional" {...register('notes')} />
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
                            {processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Delete Modal */}
            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Tahun Ajaran"
                description={`Hapus tahun ajaran "${deleteModal.item?.year} ${deleteModal.item?.semester === 'ganjil' ? 'Ganjil' : 'Genap'}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmDelete}
                loading={processing}
            />
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
