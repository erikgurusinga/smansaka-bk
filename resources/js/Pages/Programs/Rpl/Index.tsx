import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useSelection } from '@/hooks/useSelection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Eye, FileText } from 'lucide-react';
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
import { PageProps, RplBk, AcademicYear, PaginatedData } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    title: z.string().min(3, 'Judul minimal 3 karakter').max(255),
    bidang: z.enum(['pribadi', 'sosial', 'belajar', 'karier']),
    service_type: z.enum(['klasikal', 'kelompok', 'individual', 'konsultasi']),
    class_level: z.enum(['X', 'XI', 'XII', 'semua']),
    duration_minutes: z.coerce.number().int().min(15).max(480),
    semester: z.enum(['ganjil', 'genap']),
    objective: z.string().min(5, 'Tujuan wajib diisi'),
    method: z.string().optional(),
    materials: z.string().optional(),
    activities: z.string().optional(),
    evaluation: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    records: PaginatedData<RplBk>;
    academic_years: AcademicYear[];
    filters: {
        search?: string;
        bidang?: string;
        service_type?: string;
        semester?: string;
        class_level?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const bidangBadge = (b: string): 'info' | 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
        pribadi: 'info',
        sosial: 'success',
        belajar: 'warning',
        karier: 'danger',
    };
    return map[b] ?? 'info';
};

export default function RplIndex({ records, academic_years, filters, permissions }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: RplBk | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<RplBk | null>(null);
    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const canWrite = permissions['program_rpl']?.write;

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
            bidang: 'pribadi',
            service_type: 'klasikal',
            class_level: 'semua',
            semester: 'ganjil',
            duration_minutes: 90,
        },
    });

    const openCreate = () => {
        reset({
            title: '',
            bidang: 'pribadi',
            service_type: 'klasikal',
            class_level: 'semua',
            semester: 'ganjil',
            duration_minutes: 90,
            objective: '',
            method: '',
            materials: '',
            activities: '',
            evaluation: '',
        });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: RplBk) => {
        reset({
            title: item.title,
            bidang: item.bidang,
            service_type: item.service_type,
            class_level: item.class_level,
            semester: item.semester,
            duration_minutes: item.duration_minutes,
            objective: item.objective,
            method: item.method ?? '',
            materials: item.materials ?? '',
            activities: item.activities ?? '',
            evaluation: item.evaluation ?? '',
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const method = editing ? 'put' : 'post';
        const url = editing ? route('rpl.update', editing.id) : route('rpl.store');

        router[method](url, data, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'RPL BK diperbarui.' : 'RPL BK ditambahkan.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('rpl.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('RPL BK dihapus.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.delete(route('rpl.bulk-destroy'), {
            data: { ids: Array.from(selected) },
            onSuccess: () => {
                setBulkDeleteOpen(false);
                clearSelection();
                toast.success(`${selected.size} item dihapus.`);
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('rpl.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Program BK' }, { label: 'RPL BK', href: route('rpl.index') }]}
        >
            <Head title="RPL BK" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">RPL BK</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Rencana Pelaksanaan Layanan BK (dasar bimbingan klasikal, kelompok,
                            konsultasi)
                        </p>
                    </div>
                    {canWrite && (
                        <div className="flex gap-2">
                            {selected.size > 0 && (
                                <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4" />
                                    Hapus {selected.size} terpilih
                                </Button>
                            )}
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Tambah RPL
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari judul RPL..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-60"
                            />
                            <Select
                                value={filters.bidang ?? ''}
                                onValueChange={(v) => handleFilter('bidang', v)}
                                options={[
                                    { value: '', label: 'Semua Bidang' },
                                    { value: 'pribadi', label: 'Pribadi' },
                                    { value: 'sosial', label: 'Sosial' },
                                    { value: 'belajar', label: 'Belajar' },
                                    { value: 'karier', label: 'Karier' },
                                ]}
                                className="w-40"
                            />
                            <Select
                                value={filters.service_type ?? ''}
                                onValueChange={(v) => handleFilter('service_type', v)}
                                options={[
                                    { value: '', label: 'Semua Jenis' },
                                    { value: 'klasikal', label: 'Klasikal' },
                                    { value: 'kelompok', label: 'Kelompok' },
                                    { value: 'individual', label: 'Individual' },
                                    { value: 'konsultasi', label: 'Konsultasi' },
                                ]}
                                className="w-40"
                            />
                            <Select
                                value={filters.semester ?? ''}
                                onValueChange={(v) => handleFilter('semester', v)}
                                options={[
                                    { value: '', label: 'Semua Sem.' },
                                    { value: 'ganjil', label: 'Ganjil' },
                                    { value: 'genap', label: 'Genap' },
                                ]}
                                className="w-36"
                            />
                            <Select
                                value={filters.academic_year_id ?? ''}
                                onValueChange={(v) => handleFilter('academic_year_id', v)}
                                options={[
                                    { value: '', label: 'TA Aktif' },
                                    ...academic_years.map((ay) => ({
                                        value: String(ay.id),
                                        label: `${ay.year} ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
                                    })),
                                ]}
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
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                            checked={isAllPageSelected(
                                                records.data.map((i) => i.id),
                                            )}
                                            onChange={() =>
                                                togglePage(records.data.map((i) => i.id))
                                            }
                                        />
                                    </th>
                                    <th className="px-4 py-3">Judul</th>
                                    <th className="px-4 py-3">Bidang</th>
                                    <th className="px-4 py-3">Jenis</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Durasi</th>
                                    <th className="px-4 py-3">Sem.</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 8 : 7}>
                                            <EmptyState description="Belum ada RPL BK. Mulai dengan menambah rencana layanan." />
                                        </td>
                                    </tr>
                                ) : (
                                    records.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                    checked={selected.has(item.id)}
                                                    onChange={() => toggle(item.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.title}
                                                <p className="mt-0.5 text-xs font-normal text-neutral-400">
                                                    {item.counselor?.name ?? '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={bidangBadge(item.bidang)}>
                                                    {item.bidang.charAt(0).toUpperCase() +
                                                        item.bidang.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.service_type.charAt(0).toUpperCase() +
                                                    item.service_type.slice(1)}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.class_level === 'semua'
                                                    ? 'Semua'
                                                    : item.class_level}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.duration_minutes} mnt
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
                                            {canWrite && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={route('rpl.show', item.id)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                        <a
                                                            href={route('rpl.pdf', item.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-600"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => openEdit(item)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
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
                            meta={records}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit RPL BK' : 'Tambah RPL BK'}
                className="max-w-3xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Judul Layanan</Label>
                        <Input id="title" {...register('title')} />
                        <InputError message={errors.title?.message} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label>Bidang</Label>
                            <Select
                                value={watch('bidang')}
                                onValueChange={(v) => setValue('bidang', v as FormData['bidang'])}
                                options={[
                                    { value: 'pribadi', label: 'Pribadi' },
                                    { value: 'sosial', label: 'Sosial' },
                                    { value: 'belajar', label: 'Belajar' },
                                    { value: 'karier', label: 'Karier' },
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Jenis Layanan</Label>
                            <Select
                                value={watch('service_type')}
                                onValueChange={(v) =>
                                    setValue('service_type', v as FormData['service_type'])
                                }
                                options={[
                                    { value: 'klasikal', label: 'Klasikal' },
                                    { value: 'kelompok', label: 'Kelompok' },
                                    { value: 'individual', label: 'Individual' },
                                    { value: 'konsultasi', label: 'Konsultasi' },
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kelas</Label>
                            <Select
                                value={watch('class_level')}
                                onValueChange={(v) =>
                                    setValue('class_level', v as FormData['class_level'])
                                }
                                options={[
                                    { value: 'semua', label: 'Semua' },
                                    { value: 'X', label: 'X' },
                                    { value: 'XI', label: 'XI' },
                                    { value: 'XII', label: 'XII' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="dur">Durasi (menit)</Label>
                            <Input
                                id="dur"
                                type="number"
                                min={15}
                                max={480}
                                {...register('duration_minutes', { valueAsNumber: true })}
                            />
                            <InputError message={errors.duration_minutes?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Semester</Label>
                            <Select
                                value={watch('semester')}
                                onValueChange={(v) =>
                                    setValue('semester', v as FormData['semester'])
                                }
                                options={[
                                    { value: 'ganjil', label: 'Ganjil' },
                                    { value: 'genap', label: 'Genap' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="obj">Tujuan Layanan</Label>
                        <Textarea id="obj" rows={2} {...register('objective')} />
                        <InputError message={errors.objective?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="mtd">Metode / Teknik</Label>
                            <Textarea id="mtd" rows={2} {...register('method')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="mat">Media / Materi</Label>
                            <Textarea id="mat" rows={2} {...register('materials')} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="act">Langkah Kegiatan</Label>
                        <Textarea
                            id="act"
                            rows={4}
                            placeholder="Pembukaan (5m) — Inti (...) — Penutup (5m)"
                            {...register('activities')}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="eval">Evaluasi</Label>
                        <Textarea
                            id="eval"
                            rows={2}
                            placeholder="Evaluasi proses & hasil"
                            {...register('evaluation')}
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
                            {processing ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus RPL BK"
                description={`Hapus "${deleteModal.item?.title}"? Tindakan ini permanen.`}
                onConfirm={confirmDelete}
                loading={processing}
            />

            <DeleteModal
                open={bulkDeleteOpen}
                onOpenChange={setBulkDeleteOpen}
                title="Hapus Data Terpilih"
                description={`Yakin ingin menghapus ${selected.size} item? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmBulkDelete}
                loading={processing}
            />
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
