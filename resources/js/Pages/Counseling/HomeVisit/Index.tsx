import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { Select } from '@/Components/ui/Select';
import { EmptyState } from '@/Components/ui/EmptyState';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { PageProps, HomeVisit, AcademicYear, PaginatedData } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    records: PaginatedData<HomeVisit>;
    academic_years: AcademicYear[];
    filters: {
        search?: string;
        status?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const fmt = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: idLocale });

export default function HomeVisitIndex({ records, academic_years, filters, permissions }: Props) {
    const { flash } = usePage<Props>().props;

    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        item: HomeVisit | null;
    }>({ open: false, item: null });
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['home_visit']?.write;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('home-visits.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('home-visits.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Home visit dihapus.');
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Home Visit', href: route('home-visits.index') },
            ]}
        >
            <Head title="Home Visit" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Home Visit</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Kunjungan rumah siswa + berita acara digital
                        </p>
                    </div>
                    {canWrite && (
                        <Link href={route('home-visits.create')}>
                            <Button>
                                <Plus className="h-4 w-4" />
                                Catat Kunjungan
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari nama siswa..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-60"
                            />
                            <Select
                                value={filters.status ?? ''}
                                onValueChange={(v) => handleFilter('status', v)}
                                options={[
                                    { value: '', label: 'Semua Status' },
                                    { value: 'dijadwalkan', label: 'Dijadwalkan' },
                                    { value: 'selesai', label: 'Selesai' },
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
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="px-4 py-3">Tujuan Kunjungan</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Konselor</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState description="Belum ada catatan home visit." />
                                        </td>
                                    </tr>
                                ) : (
                                    records.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-neutral-900">
                                                    {item.student?.name ?? '—'}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    {item.student?.school_class?.name ??
                                                        'Tanpa Kelas'}
                                                </p>
                                            </td>
                                            <td className="max-w-xs px-4 py-3">
                                                <p className="truncate text-neutral-700">
                                                    {item.purpose}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {fmt(item.date)}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {item.counselor?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        item.status === 'selesai'
                                                            ? 'success'
                                                            : 'info'
                                                    }
                                                >
                                                    {item.status === 'selesai'
                                                        ? 'Selesai'
                                                        : 'Dijadwalkan'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('home-visits.show', item.id)}
                                                        className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <a
                                                        href={route('home-visits.pdf', item.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-600"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </a>
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
                title="Hapus Home Visit"
                description={`Hapus catatan home visit untuk "${deleteModal.item?.student?.name}"?`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
