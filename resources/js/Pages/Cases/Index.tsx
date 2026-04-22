import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
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
import { PageProps, CaseRecord, AcademicYear, PaginatedData } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    cases: PaginatedData<CaseRecord>;
    academic_years: AcademicYear[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const CATEGORY_OPTIONS = [
    { value: 'akademik', label: 'Akademik' },
    { value: 'pribadi', label: 'Pribadi' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'karier', label: 'Karier' },
    { value: 'pelanggaran', label: 'Pelanggaran' },
];

const STATUS_OPTIONS = [
    { value: 'baru', label: 'Baru' },
    { value: 'penanganan', label: 'Penanganan' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'rujukan', label: 'Rujukan' },
];

const statusBadge = (s: string): 'info' | 'warning' | 'success' | 'danger' => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
        baru: 'info',
        penanganan: 'warning',
        selesai: 'success',
        rujukan: 'danger',
    };
    return map[s] ?? 'info';
};

const categoryBadge = (c: string): 'default' | 'info' | 'warning' | 'danger' | 'success' => {
    const map: Record<string, 'default' | 'info' | 'warning' | 'danger' | 'success'> = {
        akademik: 'info',
        pribadi: 'default',
        sosial: 'success',
        karier: 'warning',
        pelanggaran: 'danger',
    };
    return map[c] ?? 'default';
};

export default function CasesIndex({ cases, academic_years, filters, permissions }: Props) {
    const { flash } = usePage<Props>().props;

    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: CaseRecord | null }>({
        open: false,
        item: null,
    });
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['cases']?.write;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('cases.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('cases.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Kasus dihapus.');
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const formatDate = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: idLocale });

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Kasus & Pelanggaran' },
                { label: 'Buku Kasus', href: route('cases.index') },
            ]}
        >
            <Head title="Buku Kasus" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Buku Kasus</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Catatan kasus siswa (akademik, pribadi, sosial, karier, pelanggaran)
                        </p>
                    </div>
                    {canWrite && (
                        <Link href={route('cases.create')}>
                            <Button>
                                <Plus className="h-4 w-4" />
                                Catat Kasus
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari judul / nama siswa..."
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
                                className="w-48"
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
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Judul</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Kerahasiaan</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {cases.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState description="Belum ada catatan kasus." />
                                        </td>
                                    </tr>
                                ) : (
                                    cases.data.map((item) => (
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
                                            <td className="px-4 py-3">
                                                <Badge variant={categoryBadge(item.category)}>
                                                    {item.category.charAt(0).toUpperCase() +
                                                        item.category.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="max-w-xs px-4 py-3">
                                                <p className="truncate font-medium text-neutral-800">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    oleh {item.reporter?.name ?? '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={statusBadge(item.status)}>
                                                    {item.status.charAt(0).toUpperCase() +
                                                        item.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.is_confidential ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                                        <Lock className="h-3 w-3" />
                                                        Rahasia
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                                                        <Unlock className="h-3 w-3" />
                                                        Umum
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('cases.show', item.id)}
                                                        className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {canWrite && (
                                                        <>
                                                            <Link
                                                                href={route('cases.edit', item.id)}
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
                            meta={cases}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Catatan Kasus"
                description={`Hapus kasus "${deleteModal.item?.title}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
