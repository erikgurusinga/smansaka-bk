import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { Select } from '@/Components/ui/Select';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, SemesterProgram, AnnualProgram, PaginatedData } from '@/types';

interface SemesterRow extends SemesterProgram {
    annual_program?: AnnualProgram;
}

interface Props extends PageProps {
    records: PaginatedData<SemesterRow>;
    annuals: AnnualProgram[];
    filters: {
        annual_program_id?: string;
        per_page?: string;
    };
}

export default function SemesterIndex({ records, annuals, filters }: Props) {
    const { flash } = usePage<Props>().props;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('semester.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Program BK' },
                { label: 'Program Semesteran', href: route('semester.index') },
            ]}
        >
            <Head title="Program Semesteran" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        Program Semesteran BK
                    </h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                        Jadwal mingguan layanan BK — turunan dari Program Tahunan
                    </p>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <Select
                            value={filters.annual_program_id ?? ''}
                            onValueChange={(v) => handleFilter('annual_program_id', v)}
                            options={[
                                { value: '', label: 'Semua Program Tahunan' },
                                ...annuals.map((a) => ({
                                    value: String(a.id),
                                    label: a.title,
                                })),
                            ]}
                            className="w-80"
                        />
                        <PerPageSelect
                            value={Number(filters.per_page ?? 15)}
                            onChange={(v) => handleFilter('per_page', String(v))}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
                                    <th className="px-4 py-3">Judul</th>
                                    <th className="px-4 py-3">Program Tahunan</th>
                                    <th className="px-4 py-3">Semester</th>
                                    <th className="px-4 py-3">Jadwal</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState description="Belum ada program semesteran. Buat dari halaman Program Tahunan." />
                                        </td>
                                    </tr>
                                ) : (
                                    records.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.title}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.annual_program?.title ?? '—'}
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
                                            <td className="px-4 py-3 text-neutral-500">
                                                {(item.schedule ?? []).length} layanan
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end">
                                                    <Link
                                                        href={route('semester.show', item.id)}
                                                        className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
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
        </AuthenticatedLayout>
    );
}
