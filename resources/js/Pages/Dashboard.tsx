import { Head, usePage } from '@inertiajs/react';
import { Users, BookOpen, MessageCircle, Home, TrendingUp } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Stats {
    total_students: number;
    active_cases: number;
    counseling_this_week: number;
    home_visits_this_month: number;
}

interface Props extends PageProps {
    stats: Stats;
}

export default function Dashboard() {
    const { auth, stats } = usePage<Props>().props;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-primary-900 text-2xl font-bold">
                        Selamat datang, {auth.user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Ringkasan aktivitas BK Anda hari ini.
                    </p>
                </div>
            }
            breadcrumbs={[{ label: 'Dashboard' }]}
        >
            <Head title="Dashboard" />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={<Users className="h-5 w-5" />}
                    label="Siswa Asuh"
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
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-100 lg:col-span-2">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp className="text-primary-600 h-5 w-5" />
                        <h2 className="font-semibold text-neutral-900">Aktivitas Terbaru</h2>
                    </div>
                    <div className="py-20 text-center text-sm text-neutral-400">
                        Belum ada aktivitas. Mulai dengan input data siswa asuh di menu Master Data.
                    </div>
                </div>

                <div className="from-primary-600 to-primary-800 rounded-2xl bg-gradient-to-br p-6 text-white shadow-md">
                    <h2 className="mb-2 font-semibold">Fase 1: Fondasi ✅</h2>
                    <p className="text-primary-100 mb-4 text-sm leading-relaxed">
                        Aplikasi BK SMANSAKA berhasil di-setup. Tahap berikutnya: mengisi data
                        master (siswa, kelas, orang tua).
                    </p>
                    <ul className="text-primary-100 space-y-1 text-xs">
                        <li>• Auth &amp; RBAC ✓</li>
                        <li>• Layout modern ✓</li>
                        <li>• Tema teal SMANSAKA ✓</li>
                        <li>• Database terinisialisasi ✓</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

const colorMap = {
    primary: 'bg-primary-50 text-primary-700',
    warning: 'bg-warning-50 text-warning-700',
    accent: 'bg-accent-50 text-accent-700',
    success: 'bg-success-50 text-success-700',
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
        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-100">
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}
            >
                {icon}
            </div>
            <p className="mt-3 text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
                {value} <span className="text-xs font-normal text-neutral-500">{suffix}</span>
            </p>
        </div>
    );
}
