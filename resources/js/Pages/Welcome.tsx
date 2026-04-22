import { Head, Link, usePage } from '@inertiajs/react';
import {
    Heart, Users, Shield, BookOpen, Network,
    FileQuestion, ArrowRight, GraduationCap,
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
                <header className="bg-white border-b border-neutral-100">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo />
                            <div>
                                <h1 className="font-semibold text-primary-900 leading-tight">
                                    {branding.site_short_name}
                                </h1>
                                <p className="text-xs text-neutral-500 leading-tight">
                                    SMAN 1 Kabanjahe
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href="/dashboard">
                                        Dashboard <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href="/login">
                                        Masuk <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-neutral-50 to-accent-50" />
                    <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-primary-200/40 blur-3xl" />
                    <div className="absolute bottom-10 left-20 w-80 h-80 rounded-full bg-accent-200/40 blur-3xl" />

                    <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-6">
                            <GraduationCap className="w-3.5 h-3.5" /> Khusus untuk Guru BK SMANSAKA
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-primary-900 tracking-tight leading-tight mb-6">
                            Bimbingan &amp; Konseling<br />
                            yang <span className="text-primary-600">Modern</span> dan <span className="text-accent-600">Terjaga</span>
                        </h1>

                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                            Satu tempat untuk mengelola siswa asuh, kasus, layanan konseling, home visit,
                            instrumen, dan program BK. Sesuai POP BK. Kerahasiaan klien dijaga.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <Button size="lg" asChild>
                                <Link href={auth.user ? '/dashboard' : '/login'}>
                                    {auth.user ? 'Ke Dashboard' : 'Masuk'}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 py-16">
                    <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
                        Enam Kelompok Modul Utama
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<Users className="w-6 h-6" />}
                            title="Master Siswa Asuh"
                            text="Data siswa, orang tua, kelas, tahun ajaran. Import Excel atau pull dari sismansaka."
                        />
                        <FeatureCard
                            icon={<Heart className="w-6 h-6" />}
                            title="Layanan BK"
                            text="Konseling individual/kelompok, bimbingan klasikal, home visit dengan tanda tangan digital."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6" />}
                            title="Kasus & Pelanggaran"
                            text="Buku kasus, poin pelanggaran, konferensi kasus, referral — dengan kerahasiaan klien."
                        />
                        <FeatureCard
                            icon={<FileQuestion className="w-6 h-6" />}
                            title="Instrumen BK"
                            text="AKPD, DCM, Sosiometri, Minat Bakat — dengan rekomendasi program otomatis."
                        />
                        <FeatureCard
                            icon={<BookOpen className="w-6 h-6" />}
                            title="Program BK"
                            text="RPL BK, Program Tahunan &amp; Semesteran dihasilkan dari hasil AKPD/DCM."
                        />
                        <FeatureCard
                            icon={<Network className="w-6 h-6" />}
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

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
    return (
        <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-100 hover:shadow-md hover:ring-primary-200 transition">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{text}</p>
        </div>
    );
}
