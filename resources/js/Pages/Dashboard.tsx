import { Head, Link, usePage } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    MessageCircle,
    Home,
    ClipboardList,
    Presentation,
    AlertTriangle,
    TrendingUp,
    FileText,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, AcademicYear } from '@/types';

interface Stats {
    total_students: number;
    active_cases: number;
    counseling_this_week: number;
    home_visits_this_month: number;
    total_referrals_this_year: number;
    classical_this_month: number;
}

interface CaseTrendPoint {
    label: string;
    kasus: number;
    pelanggaran: number;
    konseling: number;
}

interface ClassRisk {
    id: number;
    name: string;
    total_points: number;
    total_incidents: number;
}

interface AkpdBidang {
    bidang: string;
    count: number;
}

interface CaseStatusPoint {
    label: string;
    value: number;
}

interface RecentCase {
    id: number;
    title: string;
    status: string;
    created_at: string;
    student?: { id: number; name: string };
}

interface RecentCounseling {
    id: number;
    type: 'individual' | 'group';
    topic: string;
    date: string;
    counselor?: { id: number; name: string };
}

interface Props extends PageProps {
    stats: Stats;
    case_trend: CaseTrendPoint[];
    class_risk: ClassRisk[];
    akpd_distribution: AkpdBidang[];
    case_status: CaseStatusPoint[];
    recent_cases: RecentCase[];
    recent_counseling: RecentCounseling[];
    active_year: AcademicYear | null;
}

const AKPD_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#e11d48'];
const STATUS_COLORS: Record<string, string> = {
    Baru: '#0ea5e9',
    Penanganan: '#f59e0b',
    Selesai: '#10b981',
    Rujukan: '#8b5cf6',
};

const caseStatusBadge = (s: string): 'info' | 'warning' | 'success' | 'neutral' => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
        baru: 'info',
        penanganan: 'warning',
        selesai: 'success',
        rujukan: 'neutral',
    };
    return map[s] ?? 'info';
};

const fmt = (d: string) => format(new Date(d), 'd MMM', { locale: idLocale });

export default function Dashboard() {
    const {
        auth,
        stats,
        case_trend,
        class_risk,
        akpd_distribution,
        case_status,
        recent_cases,
        recent_counseling,
        active_year,
    } = usePage<Props>().props;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-primary-900 text-2xl font-bold">
                        Selamat datang, {auth.user?.name?.split(' ')[0]}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Ringkasan aktivitas BK
                        {active_year
                            ? ` · TA ${active_year.year} ${active_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`
                            : ''}
                    </p>
                </div>
            }
            breadcrumbs={[{ label: 'Dashboard' }]}
        >
            <Head title="Dashboard" />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard
                    icon={<Users className="h-5 w-5" />}
                    label="Siswa Aktif"
                    value={stats.total_students}
                    suffix="siswa"
                    color="primary"
                />
                <StatCard
                    icon={<BookOpen className="h-5 w-5" />}
                    label="Kasus Aktif"
                    value={stats.active_cases}
                    suffix="kasus"
                    color="warning"
                />
                <StatCard
                    icon={<MessageCircle className="h-5 w-5" />}
                    label="Konseling Minggu Ini"
                    value={stats.counseling_this_week}
                    suffix="sesi"
                    color="accent"
                />
                <StatCard
                    icon={<Home className="h-5 w-5" />}
                    label="Home Visit Bulan Ini"
                    value={stats.home_visits_this_month}
                    suffix="kunjungan"
                    color="success"
                />
                <StatCard
                    icon={<Presentation className="h-5 w-5" />}
                    label="Klasikal Bulan Ini"
                    value={stats.classical_this_month}
                    suffix="kelas"
                    color="primary"
                />
                <StatCard
                    icon={<ClipboardList className="h-5 w-5" />}
                    label="Referral TA Aktif"
                    value={stats.total_referrals_this_year}
                    suffix="rujukan"
                    color="warning"
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 lg:col-span-2">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp className="text-primary-600 h-5 w-5" />
                        <h2 className="font-semibold text-neutral-900">
                            Tren Aktivitas 6 Bulan Terakhir
                        </h2>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={case_trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                                type="monotone"
                                dataKey="kasus"
                                stroke="#117481"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="pelanggaran"
                                stroke="#e11d48"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="konseling"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-4 font-semibold text-neutral-900">Status Kasus</h2>
                    {case_status.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={case_status}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    label={(e) => `${e.label}: ${e.value}`}
                                    labelLine={false}
                                    style={{ fontSize: 11 }}
                                >
                                    {case_status.map((entry) => (
                                        <Cell
                                            key={entry.label}
                                            fill={STATUS_COLORS[entry.label] ?? '#64748b'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-20 text-center text-sm text-neutral-400">
                            Belum ada data kasus.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        <h2 className="font-semibold text-neutral-900">Kelas Rawan</h2>
                        <span className="text-xs text-neutral-400">
                            · Top 5 akumulasi poin pelanggaran
                        </span>
                    </div>
                    {class_risk.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={class_risk} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11 }}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    width={90}
                                />
                                <Tooltip />
                                <Bar dataKey="total_points" fill="#e11d48" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-20 text-center text-sm text-neutral-400">
                            Belum ada data pelanggaran.
                        </p>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="mb-4 flex items-center gap-2">
                        <FileText className="text-primary-600 h-5 w-5" />
                        <h2 className="font-semibold text-neutral-900">
                            Kebutuhan AKPD per Bidang
                        </h2>
                    </div>
                    {akpd_distribution.some((b) => b.count > 0) ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={akpd_distribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="bidang" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {akpd_distribution.map((_, i) => (
                                        <Cell key={i} fill={AKPD_COLORS[i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-20 text-center text-sm text-neutral-400">
                            Belum ada data AKPD. Mulai dari menu{' '}
                            <Link
                                href="/instruments/akpd/responses"
                                className="text-primary-600 hover:underline"
                            >
                                AKPD
                            </Link>
                            .
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-3 text-sm font-semibold text-neutral-700">Kasus Terbaru</h2>
                    {recent_cases.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-400">
                            Belum ada kasus.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {recent_cases.map((c) => (
                                <li
                                    key={c.id}
                                    className="flex items-start gap-2 rounded-xl p-2 hover:bg-neutral-50"
                                >
                                    <div className="flex-1">
                                        <Link
                                            href={`/cases/${c.id}`}
                                            className="hover:text-primary-600 text-sm font-medium text-neutral-800"
                                        >
                                            {c.title}
                                        </Link>
                                        <p className="text-xs text-neutral-400">
                                            {c.student?.name ?? '—'} · {fmt(c.created_at)}
                                        </p>
                                    </div>
                                    <Badge variant={caseStatusBadge(c.status)}>{c.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                        Konseling Terbaru
                    </h2>
                    {recent_counseling.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-400">
                            Belum ada sesi konseling.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {recent_counseling.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-start gap-2 rounded-xl p-2 hover:bg-neutral-50"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-neutral-800">
                                            {s.topic}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {s.counselor?.name ?? '—'} · {fmt(s.date)}
                                        </p>
                                    </div>
                                    <Badge variant={s.type === 'group' ? 'info' : 'success'}>
                                        {s.type === 'group' ? 'Kelompok' : 'Individual'}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

const colorMap = {
    primary: 'bg-primary-50 text-primary-700',
    warning: 'bg-amber-50 text-amber-700',
    accent: 'bg-rose-50 text-rose-700',
    success: 'bg-emerald-50 text-emerald-700',
};

function StatCard({
    icon,
    label,
    value,
    suffix,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    suffix: string;
    color: keyof typeof colorMap;
}) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}
            >
                {icon}
            </div>
            <p className="mt-2 text-xs text-neutral-500">{label}</p>
            <p className="mt-0.5 text-xl font-bold text-neutral-900">
                {value}
                <span className="ml-1 text-xs font-normal text-neutral-500">{suffix}</span>
            </p>
        </div>
    );
}
