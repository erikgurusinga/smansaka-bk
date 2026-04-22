import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, Student, AcademicYear } from '@/types';

interface TopicResult {
    count: number;
    items: Array<{ id: number; question: string }>;
}

interface TopicTotal {
    topic: string;
    topic_order: number;
    total: number;
}

interface Props extends PageProps {
    student: Student;
    by_topic: Record<string, TopicResult>;
    topic_totals: TopicTotal[];
    academic_year: AcademicYear;
}

// DCM derajat masalah standar: pct% dari total per topik
// 0–10% ringan · 11–25% sedang · 26–50% cukup berat · >50% berat
const severityBadge = (
    pct: number,
): { label: string; variant: 'success' | 'info' | 'warning' | 'danger' } => {
    if (pct <= 10) return { label: 'Ringan', variant: 'success' };
    if (pct <= 25) return { label: 'Sedang', variant: 'info' };
    if (pct <= 50) return { label: 'Cukup Berat', variant: 'warning' };
    return { label: 'Berat', variant: 'danger' };
};

export default function DcmResult({ student, by_topic, topic_totals, academic_year }: Props) {
    const totalChecked = Object.values(by_topic ?? {}).reduce((acc, t) => acc + (t?.count ?? 0), 0);
    const totalItems = topic_totals.reduce((a, b) => a + b.total, 0);
    const overallPct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'DCM', href: route('dcm.responses') },
                { label: `${student.name} — Hasil` },
            ]}
        >
            <Head title={`DCM Hasil — ${student.name}`} />

            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('dcm.responses')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                Hasil DCM — {student.name}
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {student.school_class?.name ?? 'Tanpa Kelas'} · {academic_year.year}{' '}
                                {academic_year.semester}
                            </p>
                        </div>
                    </div>
                    <Link href={route('dcm.fill', student.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ClipboardList className="h-4 w-4" />
                            Ubah Jawaban
                        </Button>
                    </Link>
                </div>

                <div className="from-primary-50 ring-primary-100 rounded-2xl bg-gradient-to-br to-white p-5 shadow-sm ring-1">
                    <p className="text-primary-700 text-xs font-semibold tracking-wide uppercase">
                        Total Masalah Teridentifikasi
                    </p>
                    <p className="text-primary-900 mt-1 text-3xl font-bold">
                        {totalChecked}
                        <span className="text-primary-500 ml-1 text-base font-medium">
                            / {totalItems} butir ({overallPct}%)
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-4 text-sm font-semibold text-neutral-700">
                        Profil Masalah per Topik
                    </h2>
                    <div className="space-y-3">
                        {topic_totals.map((t) => {
                            const count = by_topic[t.topic]?.count ?? 0;
                            const pct = t.total > 0 ? Math.round((count / t.total) * 100) : 0;
                            const sev = severityBadge(pct);
                            return (
                                <div key={t.topic} className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-neutral-800">
                                            {t.topic_order}. {t.topic}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500">
                                                {count}/{t.total} ({pct}%)
                                            </span>
                                            <Badge variant={sev.variant}>{sev.label}</Badge>
                                        </div>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                                        <div
                                            className={`h-full ${
                                                pct <= 10
                                                    ? 'bg-emerald-500'
                                                    : pct <= 25
                                                      ? 'bg-sky-500'
                                                      : pct <= 50
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {topic_totals.map((t) => {
                    const section = by_topic[t.topic];
                    if (!section || section.count === 0) return null;
                    const pct = t.total > 0 ? Math.round((section.count / t.total) * 100) : 0;
                    const sev = severityBadge(pct);
                    return (
                        <div
                            key={t.topic}
                            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-neutral-700">
                                    Rincian: {t.topic}
                                </h2>
                                <Badge variant={sev.variant}>
                                    {section.count} masalah — {sev.label}
                                </Badge>
                            </div>
                            <ol className="space-y-1 text-sm text-neutral-700">
                                {section.items.map((it, idx) => (
                                    <li key={it.id} className="flex gap-2">
                                        <span className="text-neutral-400">{idx + 1}.</span>
                                        <span>{it.question}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}
