import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useSelection } from '@/hooks/useSelection';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Select } from '@/Components/ui/Select';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { router } from '@inertiajs/react';
import { PageProps, ClassicalGuidance, AcademicYear, PaginatedData, SchoolClass } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

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

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: idLocale });

export default function ClassicalGuidanceIndex({
    records,
    classes,
    academic_years,
    filters,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const canWrite = permissions['counseling_classical']?.write;

    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        item: ClassicalGuidance | null;
    }>({ open: false, item: null });

    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('counseling.classical.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Catatan dihapus.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.delete(route('counseling.classical.bulk-destroy'), {
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
            route('counseling.classical.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

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
                        <div className="flex gap-2">
                            {selected.size > 0 && (
                                <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4" />
                                    Hapus {selected.size} terpilih
                                </Button>
                            )}
                            <Link href={route('counseling.classical.create')}>
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    Catat
                                </Button>
                            </Link>
                        </div>
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
                                        <td colSpan={7}>
                                            <EmptyState description="Belum ada catatan bimbingan klasikal." />
                                        </td>
                                    </tr>
                                ) : (
                                    records.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="cursor-pointer hover:bg-neutral-50/50"
                                            onClick={() =>
                                                router.visit(
                                                    route('counseling.classical.show', item.id),
                                                )
                                            }
                                        >
                                            <td
                                                className="px-4 py-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                    checked={selected.has(item.id)}
                                                    onChange={() => toggle(item.id)}
                                                />
                                            </td>
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
                                            <td
                                                className="px-4 py-3"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            'counseling.classical.show',
                                                            item.id,
                                                        )}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </Link>
                                                    {canWrite && (
                                                        <>
                                                            <Link
                                                                href={route(
                                                                    'counseling.classical.edit',
                                                                    item.id,
                                                                )}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                            </Link>
                                                            <button
                                                                type="button"
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
                            meta={records}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Catatan Bimbingan Klasikal"
                description={`Hapus catatan "${deleteModal.item?.topic}"?`}
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
