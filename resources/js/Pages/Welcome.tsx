import { Head, Link, usePage } from '@inertiajs/react';
import {
    Heart,
    Users,
    Shield,
    BookOpen,
    Network,
    FileQuestion,
    ArrowRight,
    GraduationCap,
} from 'lucide-react';
import { ApplicationLogo } from '@/Components/ApplicationLogo';
import { Button } from '@/Components/ui/Button';
import { PageProps } from '@/types';

export default function Welcome() {
    const { auth, branding } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Selamat Datang" />

            <div className="min-h-screen bg-neutral-50">
                {/* Header */}
                <header className="border-b border-neutral-100 bg-white">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo />
                            <div>
                                <h1 className="text-primary-900 leading-tight font-semibold">
                                    {branding.site_short_name}
                                </h1>
                                <p className="text-xs leading-tight text-neutral-500">
                                    SMAN 1 Kabanjahe
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href="/dashboard">
                                        Dashboard <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href="/login">
                                        Masuk <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="from-primary-50 to-accent-50 absolute inset-0 bg-gradient-to-br via-neutral-50" />
                    <div className="bg-primary-200/40 absolute top-20 right-10 h-96 w-96 rounded-full blur-3xl" />
                    <div className="bg-accent-200/40 absolute bottom-10 left-20 h-80 w-80 rounded-full blur-3xl" />

                    <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
                        <div className="bg-primary-100 text-primary-700 mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
                            <GraduationCap className="h-3.5 w-3.5" /> Khusus untuk Guru BK SMANSAKA
                        </div>

                        <h1 className="text-primary-900 mb-6 text-4xl leading-tight font-bold tracking-tight md:text-6xl">
                            Bimbingan &amp; Konseling
                            <br />
                            yang <span className="text-primary-600">Modern</span> dan{' '}
                            <span className="text-accent-600">Terjaga</span>
                        </h1>

                        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-neutral-600">
                            Satu tempat untuk mengelola siswa asuh, kasus, layanan konseling, home
                            visit, instrumen, dan program BK. Sesuai POP BK. Kerahasiaan klien
                            dijaga.
                        </p>

                        <div className="flex justify-center gap-3">
                            <Button size="lg" asChild>
                                <Link href={auth.user ? '/dashboard' : '/login'}>
                                    {auth.user ? 'Ke Dashboard' : 'Masuk'}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="mx-auto max-w-6xl px-6 py-16">
                    <h2 className="text-primary-900 mb-12 text-center text-3xl font-bold">
                        Enam Kelompok Modul Utama
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={<Users className="h-6 w-6" />}
                            title="Master Siswa Asuh"
                            text="Data siswa, orang tua, kelas, tahun ajaran. Import Excel atau pull dari sismansaka."
                        />
                        <FeatureCard
                            icon={<Heart className="h-6 w-6" />}
                            title="Layanan BK"
                            text="Konseling individual/kelompok, bimbingan klasikal, home visit dengan tanda tangan digital."
                        />
                        <FeatureCard
                            icon={<Shield className="h-6 w-6" />}
                            title="Kasus & Pelanggaran"
                            text="Buku kasus, poin pelanggaran, konferensi kasus, referral — dengan kerahasiaan klien."
                        />
                        <FeatureCard
                            icon={<FileQuestion className="h-6 w-6" />}
                            title="Instrumen BK"
                            text="AKPD, DCM, Sosiometri, Minat Bakat — dengan rekomendasi program otomatis."
                        />
                        <FeatureCard
                            icon={<BookOpen className="h-6 w-6" />}
                            title="Program BK"
                            text="RPL BK, Program Tahunan &amp; Semesteran dihasilkan dari hasil AKPD/DCM."
                        />
                        <FeatureCard
                            icon={<Network className="h-6 w-6" />}
                            title="Laporan Analitik"
                            text="Dashboard tren, laporan bulanan/semester/tahunan — export PDF &amp; Excel."
                        />
                    </div>
                </section>

                <footer className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-500">
                    © {new Date().getFullYear()} SMA Negeri 1 Kabanjahe · Sistem Informasi BK
                </footer>
            </div>
        </>
    );
}

function FeatureCard({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="hover:ring-primary-200 rounded-2xl bg-white p-6 ring-1 ring-neutral-100 transition hover:shadow-md">
            <div className="bg-primary-50 text-primary-600 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                {icon}
            </div>
            <h3 className="mb-2 font-semibold text-neutral-900">{title}</h3>
            <p className="text-sm leading-relaxed text-neutral-600">{text}</p>
        </div>
    );
}
