import { Head, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { Dialog } from '@/Components/ui/Dialog';
import { router } from '@inertiajs/react';
import { PageProps, ClassicalGuidance, AcademicYear, PaginatedData, SchoolClass } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    records: PaginatedData<ClassicalGuidance>;
    classes: SchoolClass[];
    academic_years: AcademicYear[];
    active_year: AcademicYear | null;
    filters: {
        search?: string;
        class_id?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const schema = z.object({
    class_id: z.string().min(1, 'Kelas wajib dipilih'),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    method: z.string().max(100).optional(),
    duration_minutes: z.coerce.number().int().min(1).max(480).optional().or(z.literal('')),
    description: z.string().optional(),
    evaluation: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const fmt = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: idLocale });

export default function ClassicalGuidanceIndex({
    records,
    classes,
    academic_years,
    active_year,
    filters,
    permissions,
}: Props) {
    const { flash } = usePage<Props>().props;

    const canWrite = permissions['counseling_classical']?.write;

    const [dialog, setDialog] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        item: ClassicalGuidance | null;
    }>({ open: false, mode: 'create', item: null });

    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        item: ClassicalGuidance | null;
    }>({ open: false, item: null });

    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            class_id: '',
            academic_year_id: active_year ? String(active_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            topic: '',
            method: '',
            description: '',
            evaluation: '',
        },
    });

    const openCreate = () => {
        reset({
            class_id: '',
            academic_year_id: active_year ? String(active_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            topic: '',
            method: '',
            description: '',
            evaluation: '',
        });
        setDialog({ open: true, mode: 'create', item: null });
    };

    const openEdit = (item: ClassicalGuidance) => {
        reset({
            class_id: String(item.class_id),
            academic_year_id: String(item.academic_year_id),
            date: item.date,
            topic: item.topic,
            method: item.method ?? '',
            duration_minutes: item.duration_minutes ?? '',
            description: item.description ?? '',
            evaluation: item.evaluation ?? '',
        });
        setDialog({ open: true, mode: 'edit', item });
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        if (dialog.mode === 'create') {
            router.post(route('counseling.classical.store'), data, {
                onSuccess: () => {
                    setDialog({ open: false, mode: 'create', item: null });
                    toast.success('Bimbingan klasikal dicatat.');
                },
                onError: () => toast.error('Terjadi kesalahan.'),
                onFinish: () => setProcessing(false),
            });
        } else if (dialog.item) {
            router.put(route('counseling.classical.update', dialog.item.id), data, {
                onSuccess: () => {
                    setDialog({ open: false, mode: 'create', item: null });
                    toast.success('Bimbingan klasikal diperbarui.');
                },
                onError: () => toast.error('Terjadi kesalahan.'),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('counseling.classical.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Catatan dihapus.');
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('counseling.classical.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const classOptions = [
        { value: '', label: '— Pilih Kelas —' },
        ...classes.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Bimbingan Klasikal', href: route('counseling.classical.index') },
            ]}
        >
            <Head title="Bimbingan Klasikal" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Bimbingan Klasikal
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Catatan masuk kelas dengan RPL BK
                        </p>
                    </div>
                    {canWrite && (
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Catat
                        </Button>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari topik..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-60"
                            />
                            <Select
                                value={filters.class_id ?? ''}
                                onValueChange={(v) => handleFilter('class_id', v)}
                                options={[
                                    { value: '', label: 'Semua Kelas' },
                                    ...classes.map((c) => ({ value: String(c.id), label: c.name })),
                                ]}
                                className="w-40"
                            />
                            <Select
                                value={filters.academic_year_id ?? ''}
                                onValueChange={(v) => handleFilter('academic_year_id', v)}
                                options={[
                                    { value: '', label: 'Semua TA' },
                                    ...academic_years.map((ay) => ({
                                        value: String(ay.id),
                                        label: `${ay.year} ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
                                    })),
                                ]}
                                className="w-44"
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
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Topik</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Metode</th>
                                    <th className="px-4 py-3">Durasi</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState description="Belum ada catatan bimbingan klasikal." />
                                        </td>
                                    </tr>
                                ) : (
                                    records.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-neutral-900">
                                                    {item.school_class?.name ?? '—'}
                                                </p>
                                            </td>
                                            <td className="max-w-xs px-4 py-3">
                                                <p className="truncate font-medium text-neutral-800">
                                                    {item.topic}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    oleh {item.counselor?.name ?? '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {fmt(item.date)}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.method ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.duration_minutes
                                                    ? `${item.duration_minutes} mnt`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {canWrite && (
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
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={records}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <Dialog
                open={dialog.open}
                onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
                title={
                    dialog.mode === 'create'
                        ? 'Catat Bimbingan Klasikal'
                        : 'Edit Bimbingan Klasikal'
                }
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Kelas</Label>
                            <Select
                                value={watch('class_id') ?? ''}
                                onValueChange={(v) => setValue('class_id', v)}
                                options={classOptions}
                                disabled={dialog.mode === 'edit'}
                            />
                            <InputError message={errors.class_id?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cl-date">Tanggal</Label>
                            <Input id="cl-date" type="date" {...register('date')} />
                            <InputError message={errors.date?.message} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cl-topic">Topik / Judul RPL</Label>
                        <Input
                            id="cl-topic"
                            placeholder="Contoh: Merencanakan Karier Masa Depan"
                            {...register('topic')}
                        />
                        <InputError message={errors.topic?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="cl-method">Metode</Label>
                            <Input
                                id="cl-method"
                                placeholder="Ceramah, diskusi, games..."
                                {...register('method')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cl-dur">Durasi (menit)</Label>
                            <Input
                                id="cl-dur"
                                type="number"
                                min={1}
                                max={480}
                                placeholder="45"
                                {...register('duration_minutes')}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cl-desc">Deskripsi / Materi</Label>
                        <Textarea
                            id="cl-desc"
                            rows={2}
                            placeholder="Rangkuman materi yang disampaikan..."
                            {...register('description')}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cl-eval">Evaluasi</Label>
                        <Textarea
                            id="cl-eval"
                            rows={2}
                            placeholder="Respon siswa, hambatan, catatan perbaikan..."
                            {...register('evaluation')}
                        />
                    </div>

                    <input type="hidden" {...register('academic_year_id')} />

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDialog((d) => ({ ...d, open: false }))}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Catatan Bimbingan Klasikal"
                description={`Hapus catatan "${deleteModal.item?.topic}"?`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
