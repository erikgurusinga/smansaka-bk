import { Head, router, usePage } from '@inertiajs/react';
import { FileText, FileSpreadsheet, Calendar, CalendarDays, Calendar1 } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Select } from '@/Components/ui/Select';
import { Label } from '@/Components/ui/Label';
import { PageProps, AcademicYear } from '@/types';

interface Summary {
    cases_total: number;
    cases_resolved: number;
    cases_by_category: Record<string, number>;
    violations_total: number;
    counseling_individual: number;
    counseling_group: number;
    classical: number;
    home_visits: number;
    referrals: number;
}

interface Props extends PageProps {
    summary: Summary;
    type: 'monthly' | 'semester' | 'yearly';
    month: number;
    year: number;
    semester: 'ganjil' | 'genap';
    period_label: string;
    active_year: AcademicYear | null;
}

const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const TABS: Array<{
    key: 'monthly' | 'semester' | 'yearly';
    label: string;
    icon: React.ReactNode;
}> = [
    { key: 'monthly', label: 'Bulanan', icon: <Calendar className="h-4 w-4" /> },
    { key: 'semester', label: 'Semester', icon: <Calendar1 className="h-4 w-4" /> },
    { key: 'yearly', label: 'Tahunan', icon: <CalendarDays className="h-4 w-4" /> },
];

export default function ReportsIndex() {
    const { summary, type, month, year, semester, period_label, active_year } =
        usePage<Props>().props;

    const navigate = (next: Partial<Pick<Props, 'type' | 'month' | 'year' | 'semester'>>) => {
        router.get(
            route('reports.index'),
            { type, month, year, semester, ...next },
            { preserveState: false },
        );
    };

    const buildUrl = (action: 'pdf' | 'excel') => {
        const base = route(action === 'pdf' ? 'reports.pdf' : 'reports.excel');
        const params = new URLSearchParams({
            type,
            month: String(month),
            year: String(year),
            semester,
        });
        return `${base}?${params.toString()}`;
    };

    const yearOptions = [];
    const nowYear = new Date().getFullYear();
    for (let y = nowYear - 2; y <= nowYear + 1; y++) {
        yearOptions.push({ value: String(y), label: String(y) });
    }

    return (
        <AuthenticatedLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }]}>
            <Head title="Laporan BK" />

            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900">Laporan BK</h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                        Rekap layanan BK SMA Negeri 1 Kabanjahe
                        {active_year
                            ? ` · TA ${active_year.year} ${active_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`
                            : ''}
                    </p>
                </div>

                <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => navigate({ type: tab.key })}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                                type === tab.key
                                    ? 'text-primary-700 bg-white shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                    {type === 'monthly' && (
                        <div className="w-44 space-y-1.5">
                            <Label>Bulan</Label>
                            <Select
                                value={String(month)}
                                onValueChange={(v) => navigate({ month: Number(v) })}
                                options={MONTHS.map((m, i) => ({
                                    value: String(i + 1),
                                    label: m,
                                }))}
                            />
                        </div>
                    )}
                    {type === 'semester' && (
                        <div className="w-44 space-y-1.5">
                            <Label>Semester</Label>
                            <Select
                                value={semester}
                                onValueChange={(v) =>
                                    navigate({ semester: v as 'ganjil' | 'genap' })
                                }
                                options={[
                                    { value: 'ganjil', label: 'Ganjil (Jul–Des)' },
                                    { value: 'genap', label: 'Genap (Jan–Jun)' },
                                ]}
                            />
                        </div>
                    )}
                    <div className="w-32 space-y-1.5">
                        <Label>Tahun</Label>
                        <Select
                            value={String(year)}
                            onValueChange={(v) => navigate({ year: Number(v) })}
                            options={yearOptions}
                        />
                    </div>
                    <div className="flex gap-2">
                        <a href={buildUrl('pdf')} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" className="gap-1.5">
                                <FileText className="h-4 w-4" />
                                Unduh PDF
                            </Button>
                        </a>
                        <a href={buildUrl('excel')}>
                            <Button variant="secondary" className="gap-1.5 text-emerald-700">
                                <FileSpreadsheet className="h-4 w-4" />
                                Unduh Excel
                            </Button>
                        </a>
                    </div>
                </div>

                <div className="from-primary-600 to-primary-800 rounded-2xl bg-gradient-to-br p-5 text-white shadow-md">
                    <p className="text-primary-100 text-xs font-semibold tracking-wide uppercase">
                        Periode
                    </p>
                    <p className="mt-1 text-2xl font-bold">{period_label}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Kasus Baru" value={summary.cases_total} />
                    <StatCard
                        label="Kasus Selesai"
                        value={summary.cases_resolved}
                        color="success"
                    />
                    <StatCard
                        label="Pelanggaran Tercatat"
                        value={summary.violations_total}
                        color="danger"
                    />
                    <StatCard label="Referral" value={summary.referrals} />
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-4 text-sm font-semibold text-neutral-700">Kategori Kasus</h2>
                    <div className="grid grid-cols-5 gap-3">
                        {Object.entries(summary.cases_by_category).map(([key, value]) => (
                            <div key={key} className="rounded-xl bg-neutral-50 p-3 text-center">
                                <p className="text-xs text-neutral-500 capitalize">{key}</p>
                                <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="mb-4 text-sm font-semibold text-neutral-700">
                            Layanan Konseling
                        </h2>
                        <div className="space-y-2 text-sm">
                            <Row
                                label="Konseling Individual"
                                value={summary.counseling_individual}
                            />
                            <Row label="Konseling Kelompok" value={summary.counseling_group} />
                            <Row label="Bimbingan Klasikal" value={summary.classical} />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="mb-4 text-sm font-semibold text-neutral-700">
                            Layanan Pendukung
                        </h2>
                        <div className="space-y-2 text-sm">
                            <Row label="Home Visit" value={summary.home_visits} />
                            <Row label="Referral" value={summary.referrals} />
                            <Row label="Pelanggaran Siswa" value={summary.violations_total} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

const COLOR_MAP = {
    default: 'bg-primary-50 text-primary-700',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-rose-50 text-rose-700',
};

function StatCard({
    label,
    value,
    color = 'default',
}: {
    label: string;
    value: number;
    color?: keyof typeof COLOR_MAP;
}) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs text-neutral-500">{label}</p>
            <p
                className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-3xl font-bold ${COLOR_MAP[color]}`}
            >
                {value}
            </p>
        </div>
    );
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50">
            <span className="text-neutral-600">{label}</span>
            <span className="text-base font-semibold text-neutral-900">{value}</span>
        </div>
    );
}
