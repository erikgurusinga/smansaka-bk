import { Head, router, usePage } from '@inertiajs/react';
import { FileText, Download } from 'lucide-react';
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
    month: number;
    year: number;
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

export default function ReportsIndex() {
    const { summary, month, year, active_year } = usePage<Props>().props;

    const handleChange = (key: 'month' | 'year', value: string) => {
        router.get(
            route('reports.index'),
            { month: key === 'month' ? value : month, year: key === 'year' ? value : year },
            { preserveState: false },
        );
    };

    const pdfUrl = `${route('reports.monthly-pdf')}?month=${month}&year=${year}`;

    const yearOptions = [];
    const nowYear = new Date().getFullYear();
    for (let y = nowYear - 2; y <= nowYear + 1; y++) {
        yearOptions.push({ value: String(y), label: String(y) });
    }

    return (
        <AuthenticatedLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }]}>
            <Head title="Laporan BK" />

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Laporan BK</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Rekap bulanan layanan BK SMA Negeri 1 Kabanjahe
                            {active_year
                                ? ` · TA ${active_year.year} ${active_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`
                                : ''}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                    <div className="w-44 space-y-1.5">
                        <Label>Bulan</Label>
                        <Select
                            value={String(month)}
                            onValueChange={(v) => handleChange('month', v)}
                            options={MONTHS.map((m, i) => ({
                                value: String(i + 1),
                                label: m,
                            }))}
                        />
                    </div>
                    <div className="w-32 space-y-1.5">
                        <Label>Tahun</Label>
                        <Select
                            value={String(year)}
                            onValueChange={(v) => handleChange('year', v)}
                            options={yearOptions}
                        />
                    </div>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" className="gap-1.5">
                            <Download className="h-4 w-4" />
                            Unduh PDF Rekap
                        </Button>
                    </a>
                </div>

                <div className="from-primary-600 to-primary-800 rounded-2xl bg-gradient-to-br p-5 text-white shadow-md">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <h2 className="text-primary-50 text-sm font-semibold tracking-wide uppercase">
                            Rekap {MONTHS[month - 1]} {year}
                        </h2>
                    </div>
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
