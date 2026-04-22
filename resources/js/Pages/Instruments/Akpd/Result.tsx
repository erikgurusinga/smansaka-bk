import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, Student, AcademicYear } from '@/types';

interface BidangResult {
    count: number;
    items: Array<{ id: number; question: string }>;
}

interface Props extends PageProps {
    student: Student;
    by_bidang: Record<string, BidangResult>;
    totals: Record<string, number>;
    academic_year: AcademicYear;
}

const BIDANG_META: Array<{
    key: string;
    label: string;
    badge: 'info' | 'success' | 'warning' | 'danger';
    bar: string;
}> = [
    { key: 'pribadi', label: 'Pribadi', badge: 'info', bar: 'bg-sky-500' },
    { key: 'sosial', label: 'Sosial', badge: 'success', bar: 'bg-emerald-500' },
    { key: 'belajar', label: 'Belajar', badge: 'warning', bar: 'bg-amber-500' },
    { key: 'karier', label: 'Karier', badge: 'danger', bar: 'bg-rose-500' },
];

export default function AkpdResult({ student, by_bidang, totals, academic_year }: Props) {
    const totalChecked = Object.values(by_bidang ?? {}).reduce(
        (acc, b) => acc + (b?.count ?? 0),
        0,
    );
    const totalItems = Object.values(totals).reduce((a, b) => a + b, 0);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'AKPD', href: route('akpd.responses') },
                { label: `${student.name} — Hasil` },
            ]}
        >
            <Head title={`AKPD Hasil — ${student.name}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('akpd.responses')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                Hasil AKPD — {student.name}
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {student.school_class?.name ?? 'Tanpa Kelas'} · {academic_year.year}{' '}
                                {academic_year.semester}
                            </p>
                        </div>
                    </div>
                    <Link href={route('akpd.fill', student.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ClipboardList className="h-4 w-4" />
                            Ubah Jawaban
                        </Button>
                    </Link>
                </div>

                <div className="from-primary-50 ring-primary-100 rounded-2xl bg-gradient-to-br to-white p-5 shadow-sm ring-1">
                    <p className="text-primary-700 text-xs font-semibold tracking-wide uppercase">
                        Ringkasan Kebutuhan
                    </p>
                    <p className="text-primary-900 mt-1 text-3xl font-bold">
                        {totalChecked}
                        <span className="text-primary-500 ml-1 text-base font-medium">
                            / {totalItems} butir
                        </span>
                    </p>
                    <p className="text-primary-700 mt-0.5 text-sm">
                        butir yang dirasakan bermasalah / dibutuhkan siswa
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {BIDANG_META.map(({ key, label, badge, bar }) => {
                        const count = by_bidang[key]?.count ?? 0;
                        const total = totals[key] ?? 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div
                                key={key}
                                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <Badge variant={badge}>{label}</Badge>
                                    <span className="text-xs text-neutral-500">{pct}%</span>
                                </div>
                                <p className="text-2xl font-semibold text-neutral-900">
                                    {count}
                                    <span className="ml-1 text-xs text-neutral-400">/ {total}</span>
                                </p>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                                    <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {BIDANG_META.map(({ key, label, badge }) => {
                    const section = by_bidang[key];
                    if (!section || section.count === 0) return null;
                    return (
                        <div
                            key={key}
                            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-neutral-700">
                                    Rincian {label}
                                </h2>
                                <Badge variant={badge}>{section.count} butir</Badge>
                            </div>
                            <ol className="space-y-1.5 text-sm text-neutral-700">
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
