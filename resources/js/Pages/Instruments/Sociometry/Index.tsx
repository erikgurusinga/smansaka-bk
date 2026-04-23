import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useSelection } from '@/hooks/useSelection';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { Select } from '@/Components/ui/Select';
import { EmptyState } from '@/Components/ui/EmptyState';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { PageProps, SociometrySession, SchoolClass, AcademicYear, PaginatedData } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface SessionRow extends SociometrySession {
    choices_count: number;
}

interface Props extends PageProps {
    records: PaginatedData<SessionRow>;
    classes: SchoolClass[];
    academic_years: AcademicYear[];
    filters: {
        class_id?: string;
        status?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const statusBadge = (s: string): 'info' | 'success' | 'warning' | 'neutral' => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
        draft: 'neutral',
        open: 'info',
        closed: 'success',
    };
    return map[s] ?? 'neutral';
};

const statusLabel = (s: string) => ({ draft: 'Draft', open: 'Terbuka', closed: 'Ditutup' })[s] ?? s;

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: idLocale });

export default function SociometryIndex({
    records,
    classes,
    academic_years,
    filters,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: SessionRow | null }>({
        open: false,
        item: null,
    });
    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const canWrite = permissions['instrument_sociometry']?.write;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('sociometry.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('sociometry.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Sesi dihapus.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.delete(route('sociometry.bulk-destroy'), {
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
                { label: 'Instrumen BK' },
                { label: 'Sosiometri', href: route('sociometry.index') },
            ]}
        >
            <Head title="Sosiometri" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Sosiometri</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Pemetaan hubungan sosial siswa per kelas
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
                            <Link href={route('sociometry.create')}>
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    Buat Sesi
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.class_id ?? ''}
                                onValueChange={(v) => handleFilter('class_id', v)}
                                options={[
                                    { value: '', label: 'Semua Kelas' },
                                    ...classes.map((c) => ({
                                        value: String(c.id),
                                        label: c.name,
                                    })),
                                ]}
                                className="w-44"
                            />
                            <Select
                                value={filters.status ?? ''}
                                onValueChange={(v) => handleFilter('status', v)}
                                options={[
                                    { value: '', label: 'Semua Status' },
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'open', label: 'Terbuka' },
                                    { value: 'closed', label: 'Ditutup' },
                                ]}
                                className="w-40"
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
                                                records.data.map((i) => i.id),
                                            )}
                                            onChange={() =>
                                                togglePage(records.data.map((i) => i.id))
                                            }
                                        />
                                    </th>
                                    <th className="px-4 py-3">Judul Sesi</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Kriteria</th>
                                    <th className="px-4 py-3">Pilihan</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState description="Belum ada sesi sosiometri." />
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
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-neutral-900">
                                                    {item.title}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.school_class?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {fmt(item.date)}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.criteria?.length ?? 0} kriteria
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.choices_count ?? 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={statusBadge(item.status)}>
                                                    {statusLabel(item.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('sociometry.show', item.id)}
                                                        className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {canWrite && (
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

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Sesi Sosiometri"
                description={`Hapus sesi "${deleteModal.item?.title}"? Semua pilihan akan ikut dihapus.`}
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
