import { Head, Link, router, usePage } from '@inertiajs/react';
import { ClipboardList, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { Select } from '@/Components/ui/Select';
import { EmptyState } from '@/Components/ui/EmptyState';
import {
    PageProps,
    Student,
    SchoolClass,
    AcademicYear,
    PaginatedData,
    CareerAssessment,
} from '@/types';

interface StudentRow extends Student {
    career_assessments: CareerAssessment[];
}

interface Props extends PageProps {
    students: PaginatedData<StudentRow>;
    classes: SchoolClass[];
    academic_years: AcademicYear[];
    filters: {
        search?: string;
        class_id?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

export default function CareerIndex({ students, classes, academic_years, filters }: Props) {
    const { flash } = usePage<Props>().props;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('career.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'Minat Bakat (RIASEC)', href: route('career.index') },
            ]}
        >
            <Head title="Minat Bakat — RIASEC" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        Minat Bakat / Karier (RIASEC)
                    </h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                        Inventori 48 butir skala 1–5 · Holland Code Career Assessment
                    </p>
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
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Kode Holland</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>
                                            <EmptyState description="Belum ada siswa." />
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((s) => {
                                        const assessment = s.career_assessments?.[0];
                                        return (
                                            <tr key={s.id} className="hover:bg-neutral-50/50">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-neutral-900">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-xs text-neutral-400">
                                                        NIS {s.nis}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600">
                                                    {s.school_class?.name ?? 'Tanpa Kelas'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {assessment ? (
                                                        <Badge variant="success">
                                                            {assessment.dominant_codes}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="neutral">
                                                            Belum asesmen
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('career.fill', s.id)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600"
                                                        >
                                                            <ClipboardList className="h-4 w-4" />
                                                            Isi
                                                        </Link>
                                                        {assessment && (
                                                            <Link
                                                                href={route('career.result', s.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-amber-50 hover:text-amber-600"
                                                            >
                                                                <BarChart3 className="h-4 w-4" />
                                                                Hasil
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={students}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
