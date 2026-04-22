import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, Student, AcademicYear, CareerAssessment } from '@/types';

interface DimLabel {
    label: string;
    short: string;
    desc: string;
}

interface Props extends PageProps {
    student: Student;
    assessment: CareerAssessment | null;
    dimension_labels: Record<string, DimLabel>;
    academic_year: AcademicYear;
}

const MAX_SCORE = 40; // 8 items × 5 max

export default function CareerResult({
    student,
    assessment,
    dimension_labels,
    academic_year,
}: Props) {
    if (!assessment) {
        return (
            <AuthenticatedLayout
                breadcrumbs={[
                    { label: 'Instrumen BK' },
                    { label: 'Minat Bakat', href: route('career.index') },
                    { label: `${student.name} — Hasil` },
                ]}
            >
                <Head title="Hasil Asesmen" />
                <EmptyState description="Siswa ini belum mengerjakan asesmen minat bakat." />
            </AuthenticatedLayout>
        );
    }

    const scores = assessment.scores as Record<string, number>;
    const sortedDims = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'Minat Bakat', href: route('career.index') },
                { label: `${student.name} — Hasil` },
            ]}
        >
            <Head title={`Hasil Minat Bakat — ${student.name}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('career.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                Hasil Asesmen — {student.name}
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {student.school_class?.name ?? 'Tanpa Kelas'} · {academic_year.year}{' '}
                                {academic_year.semester}
                            </p>
                        </div>
                    </div>
                    <Link href={route('career.fill', student.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ClipboardList className="h-4 w-4" />
                            Isi Ulang
                        </Button>
                    </Link>
                </div>

                <div className="from-primary-600 to-primary-800 rounded-2xl bg-gradient-to-br p-6 text-white shadow-md">
                    <p className="text-primary-100 text-xs font-semibold tracking-wide uppercase">
                        Kode Holland Dominan
                    </p>
                    <p className="mt-1 text-5xl font-bold tracking-wider">
                        {assessment.dominant_codes}
                    </p>
                    <p className="text-primary-100 mt-2 text-sm">
                        Tiga dimensi teratas membentuk &ldquo;Kode Holland&rdquo; — kombinasi profil
                        minat yang paling kuat.
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-4 text-sm font-semibold text-neutral-700">
                        Skor per Dimensi
                    </h2>
                    <div className="space-y-3">
                        {sortedDims.map(([dim, score]) => {
                            const pct = Math.round(((score as number) / MAX_SCORE) * 100);
                            const meta = dimension_labels[dim];
                            const idx = sortedDims.findIndex(([d]) => d === dim);
                            return (
                                <div key={dim} className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary-100 text-primary-800 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                                                {dim}
                                            </span>
                                            <span className="text-sm font-medium text-neutral-800">
                                                {meta?.label} ({meta?.short})
                                            </span>
                                            {idx < 3 && (
                                                <Badge variant={idx === 0 ? 'success' : 'info'}>
                                                    #{idx + 1}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-neutral-500">
                                            {score}/{MAX_SCORE} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                                        <div
                                            className="from-primary-400 to-primary-600 h-full rounded-full bg-gradient-to-r"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    {meta && (
                                        <p className="text-xs text-neutral-500">{meta.desc}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                        Rekomendasi Jurusan
                    </p>
                    <p className="text-sm leading-relaxed text-amber-900">
                        {assessment.recommendations}
                    </p>
                </div>

                {assessment.notes && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                            Catatan Siswa
                        </p>
                        <p className="text-sm whitespace-pre-wrap text-neutral-700">
                            {assessment.notes}
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
