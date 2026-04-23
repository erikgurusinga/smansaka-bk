import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useSelection } from '@/hooks/useSelection';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { Select } from '@/Components/ui/Select';
import { EmptyState } from '@/Components/ui/EmptyState';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { PageProps, CounselingSession, AcademicYear, PaginatedData } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface Props extends PageProps {
    sessions: PaginatedData<CounselingSession>;
    academic_years: AcademicYear[];
    filters: {
        search?: string;
        status?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

const statusBadge = (s: string): 'info' | 'warning' | 'success' | 'neutral' => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
        dijadwalkan: 'info',
        berlangsung: 'warning',
        selesai: 'success',
        dibatalkan: 'neutral',
    };
    return map[s] ?? 'info';
};

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: idLocale });

export default function GroupCounselingIndex({
    sessions,
    academic_years,
    filters,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        item: CounselingSession | null;
    }>({ open: false, item: null });
    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const canWrite = permissions['counseling_group']?.write;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('counseling.group.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('counseling.group.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Sesi konseling kelompok dihapus.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.delete(route('counseling.group.bulk-destroy'), {
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

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Konseling Kelompok', href: route('counseling.group.index') },
            ]}
        >
            <Head title="Konseling Kelompok" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Konseling Kelompok
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Log sesi konseling kelompok siswa
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {canWrite && selected.size > 0 && (
                            <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4" />
                                Hapus {selected.size} terpilih
                            </Button>
                        )}
                        {canWrite && (
                            <Link href={route('counseling.group.create')}>
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    Catat Sesi
                                </Button>
                            </Link>
                        )}
                    </div>
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
                                value={filters.status ?? ''}
                                onValueChange={(v) => handleFilter('status', v)}
                                options={[{ value: '', label: 'Semua Status' }, ...STATUS_OPTIONS]}
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
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                            checked={isAllPageSelected(
                                                sessions.data.map((i) => i.id),
                                            )}
                                            onChange={() =>
                                                togglePage(sessions.data.map((i) => i.id))
                                            }
                                        />
                                    </th>
                                    <th className="px-4 py-3">Topik</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Peserta</th>
                                    <th className="px-4 py-3">Durasi</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {sessions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState description="Belum ada catatan sesi konseling kelompok." />
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                    checked={selected.has(item.id)}
                                                    onChange={() => toggle(item.id)}
                                                />
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
                                                {item.start_time && (
                                                    <span className="ml-1 text-xs text-neutral-400">
                                                        {item.start_time.slice(0, 5)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.participants_count ??
                                                    item.students?.length ??
                                                    0}{' '}
                                                siswa
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.duration_minutes
                                                    ? `${item.duration_minutes} mnt`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={statusBadge(item.status)}>
                                                    {item.status.charAt(0).toUpperCase() +
                                                        item.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            'counseling.group.show',
                                                            item.id,
                                                        )}
                                                        className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {canWrite && (
                                                        <>
                                                            <Link
                                                                href={route(
                                                                    'counseling.group.edit',
                                                                    item.id,
                                                                )}
                                                                className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
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
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={sessions}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Sesi Konseling Kelompok"
                description={`Hapus sesi konseling "${deleteModal.item?.topic}"?`}
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
