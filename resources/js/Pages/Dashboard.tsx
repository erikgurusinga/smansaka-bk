import { useState, useRef, useEffect } from 'react';
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
    Search,
    X,
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
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/Badge';
import { Dialog } from '@/Components/ui/Dialog';
import { Lightbox } from '@/Components/ui/Lightbox';
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

interface SearchResult {
    id: number;
    nis: string;
    name: string;
    gender: 'L' | 'P';
    status: string;
    class_name: string | null;
    photo_url: string;
}

interface GuardianProfile {
    id: number;
    name: string;
    relation: 'ayah' | 'ibu' | 'wali';
    phone: string | null;
    email: string | null;
    occupation: string | null;
    address: string | null;
    photo_url: string;
}

interface StudentProfile {
    id: number;
    nis: string;
    nisn: string | null;
    name: string;
    gender: 'L' | 'P';
    birth_place: string | null;
    birth_date: string | null;
    address: string | null;
    phone: string | null;
    religion: string | null;
    status: string;
    class_name: string | null;
    photo_url: string;
    guardians: GuardianProfile[];
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

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMM', { locale: idLocale });

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

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.trim().length < 2) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/students/lookup?q=${encodeURIComponent(value.trim())}`);
                if (res.ok) {
                    const data: SearchResult[] = await res.json();
                    setSearchResults(data);
                    setSearchOpen(true);
                }
            } finally {
                setSearching(false);
            }
        }, 300);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchOpen(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
    };

    const openProfile = async (id: number) => {
        clearSearch();
        setProfile(null);
        setProfileLoading(true);
        setProfileOpen(true);
        try {
            const res = await fetch(`/students/${id}/profile`);
            if (res.ok) setProfile(await res.json());
        } finally {
            setProfileLoading(false);
        }
    };

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

            {/* ── Pencarian Siswa ── */}
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                <div className="mb-3 flex items-center gap-2">
                    <Search className="text-primary-600 h-4 w-4" />
                    <span className="text-sm font-semibold text-neutral-700">Cari Siswa</span>
                    <span className="text-xs text-neutral-400">· NIS atau nama</span>
                </div>
                <div className="relative" ref={searchRef}>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Ketik minimal 2 karakter…"
                            className="focus:border-primary-400 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pr-9 pl-9 text-sm focus:bg-white focus:ring-2 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {searchOpen && (
                        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-neutral-100 bg-white shadow-xl">
                            {searching ? (
                                <p className="py-4 text-center text-sm text-neutral-400">
                                    Mencari…
                                </p>
                            ) : searchResults.length === 0 ? (
                                <p className="py-4 text-center text-sm text-neutral-400">
                                    Siswa tidak ditemukan.
                                </p>
                            ) : (
                                searchResults.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => openProfile(r.id)}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
                                    >
                                        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                                            {r.photo_url ? (
                                                <img
                                                    src={r.photo_url}
                                                    alt={r.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                                                    {r.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-neutral-900">
                                                {r.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {r.nis}
                                                {r.class_name ? ` · ${r.class_name}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant={r.gender === 'L' ? 'info' : 'default'}>
                                                {r.gender === 'L' ? 'L' : 'P'}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    r.status === 'aktif' ? 'success' : 'neutral'
                                                }
                                            >
                                                {r.status.charAt(0).toUpperCase() +
                                                    r.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
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
            {/* ── Modal Profil Siswa ── */}
            <Dialog
                open={profileOpen}
                onOpenChange={(open) => {
                    setProfileOpen(open);
                    if (!open) setProfile(null);
                }}
                title={profile?.name ?? 'Profil Siswa'}
                description={
                    profile
                        ? `NIS ${profile.nis}${profile.class_name ? ' · ' + profile.class_name : ''}`
                        : undefined
                }
                className="max-w-2xl"
            >
                {profileLoading ? (
                    <div className="py-14 text-center text-sm text-neutral-400">
                        Memuat data siswa…
                    </div>
                ) : profile ? (
                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        {/* ── Foto + data utama ── */}
                        <div className="flex gap-5">
                            <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                                {profile.photo_url ? (
                                    <img
                                        src={profile.photo_url}
                                        alt={profile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-300">
                                        {profile.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                                <ProfileDetail label="NIS" value={profile.nis} />
                                <ProfileDetail label="NISN" value={profile.nisn ?? '—'} />
                                <ProfileDetail label="Kelas" value={profile.class_name ?? '—'} />
                                <ProfileDetail
                                    label="Jenis Kelamin"
                                    value={profile.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                />
                                <ProfileDetail
                                    label="Tempat Lahir"
                                    value={profile.birth_place ?? '—'}
                                />
                                <ProfileDetail
                                    label="Tanggal Lahir"
                                    value={
                                        profile.birth_date
                                            ? format(new Date(profile.birth_date), 'd MMMM yyyy', {
                                                  locale: idLocale,
                                              })
                                            : '—'
                                    }
                                />
                                <ProfileDetail label="Agama" value={profile.religion ?? '—'} />
                                <ProfileDetail label="Telepon" value={profile.phone ?? '—'} />
                                <div className="col-span-2">
                                    <ProfileDetail
                                        label="Status"
                                        value={
                                            profile.status.charAt(0).toUpperCase() +
                                            profile.status.slice(1)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {profile.address && (
                            <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
                                <p className="mb-0.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                                    Alamat
                                </p>
                                <p className="text-neutral-700">{profile.address}</p>
                            </div>
                        )}

                        {/* ── Orang Tua / Wali ── */}
                        {profile.guardians.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-3 text-sm font-semibold text-neutral-700">
                                    Orang Tua / Wali
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {profile.guardians.map((g) => (
                                        <div
                                            key={g.id}
                                            className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                                        >
                                            <div
                                                className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200 transition ${g.photo_url ? 'hover:ring-primary-400 cursor-zoom-in hover:ring-2 hover:ring-offset-1' : ''}`}
                                                onClick={() =>
                                                    g.photo_url && setEnlargedPhoto(g.photo_url)
                                                }
                                            >
                                                {g.photo_url ? (
                                                    <img
                                                        src={g.photo_url}
                                                        alt={g.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-400">
                                                        {g.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="text-sm font-medium text-neutral-900">
                                                        {g.name}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            g.relation === 'ayah'
                                                                ? 'default'
                                                                : g.relation === 'ibu'
                                                                  ? 'info'
                                                                  : 'neutral'
                                                        }
                                                    >
                                                        {g.relation.charAt(0).toUpperCase() +
                                                            g.relation.slice(1)}
                                                    </Badge>
                                                </div>
                                                {g.occupation && (
                                                    <p className="mt-0.5 text-xs text-neutral-500">
                                                        {g.occupation}
                                                    </p>
                                                )}
                                                {g.phone && (
                                                    <p className="text-xs text-neutral-500">
                                                        {g.phone}
                                                    </p>
                                                )}
                                                {g.email && (
                                                    <p className="truncate text-xs text-neutral-500">
                                                        {g.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {profile.guardians.some((g) => g.address) && (
                                    <div className="mt-3 space-y-2">
                                        {profile.guardians
                                            .filter((g) => g.address)
                                            .map((g) => (
                                                <div
                                                    key={g.id}
                                                    className="rounded-xl bg-neutral-50 px-4 py-2.5 text-sm"
                                                >
                                                    <p className="mb-0.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                                                        Alamat{' '}
                                                        {g.relation.charAt(0).toUpperCase() +
                                                            g.relation.slice(1)}
                                                    </p>
                                                    <p className="text-neutral-700">{g.address}</p>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}
            </Dialog>
            <Lightbox src={enlargedPhoto} onClose={() => setEnlargedPhoto(null)} />
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

function ProfileDetail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="font-medium text-neutral-800">{value}</p>
        </div>
    );
}
