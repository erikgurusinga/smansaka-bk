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
                    <h1 className="text-2xl font-bold text-primary-900">
                        Selamat datang, {auth.user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Ringkasan aktivitas BK Anda hari ini.
                    </p>
                </div>
            }
            breadcrumbs={[{ label: 'Dashboard' }]}
        >
            <Head title="Dashboard" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Siswa Asuh"
                    value={stats.total_students}
                    suffix="siswa"
                    color="primary"
                />
                <StatCard
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Kasus Aktif"
                    value={stats.active_cases}
                    suffix="kasus"
                    color="warning"
                />
                <StatCard
                    icon={<MessageCircle className="w-5 h-5" />}
                    label="Konseling Minggu Ini"
                    value={stats.counseling_this_week}
                    suffix="sesi"
                    color="accent"
                />
                <StatCard
                    icon={<Home className="w-5 h-5" />}
                    label="Home Visit Bulan Ini"
                    value={stats.home_visits_this_month}
                    suffix="kunjungan"
                    color="success"
                />
            </div>

            <div className="mt-6 grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 ring-1 ring-neutral-100">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                        <h2 className="font-semibold text-neutral-900">Aktivitas Terbaru</h2>
                    </div>
                    <div className="text-center text-sm text-neutral-400 py-20">
                        Belum ada aktivitas. Mulai dengan input data siswa asuh di menu Master Data.
                    </div>
                </div>

                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-md">
                    <h2 className="font-semibold mb-2">Fase 1: Fondasi ✅</h2>
                    <p className="text-sm text-primary-100 leading-relaxed mb-4">
                        Aplikasi BK SMANSAKA berhasil di-setup. Tahap berikutnya:
                        mengisi data master (siswa, kelas, orang tua).
                    </p>
                    <ul className="text-xs text-primary-100 space-y-1">
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
    icon, label, value, suffix, color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    suffix: string;
    color: keyof typeof colorMap;
}) {
    return (
        <div className="bg-white rounded-2xl p-5 ring-1 ring-neutral-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <p className="text-xs text-neutral-500 mt-3">{label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
                {value} <span className="text-xs font-normal text-neutral-500">{suffix}</span>
            </p>
        </div>
    );
}
