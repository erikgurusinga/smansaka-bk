import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, Heart, Shield, Users } from 'lucide-react';
import { ApplicationLogo } from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';

export default function GuestLayout({ children }: PropsWithChildren) {
    const { branding } = usePage<PageProps>().props;

    return (
        <div className="min-h-screen grid md:grid-cols-2 bg-neutral-50">
            {/* Panel kiri — brand */}
            <aside className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-10 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary-500/30 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl" />

                <div className="relative">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <ApplicationLogo size={56} className="bg-white text-primary-700" />
                        <div>
                            <h1 className="font-semibold text-xl leading-tight">{branding.site_short_name}</h1>
                            <p className="text-primary-100 text-sm">SMA Negeri 1 Kabanjahe</p>
                        </div>
                    </Link>
                </div>

                <div className="relative space-y-6">
                    <h2 className="text-3xl font-bold leading-tight">
                        Sistem Informasi<br />
                        <span className="text-accent-300">Bimbingan &amp; Konseling</span>
                    </h2>
                    <p className="text-primary-100 leading-relaxed max-w-md">
                        Satu tempat untuk mengelola data siswa asuh, kasus, layanan konseling,
                        instrumen, dan program BK. Aman, rahasia, dan modern.
                    </p>

                    <ul className="space-y-3 text-sm">
                        <Feature icon={<Users className="w-4 h-4" />} text="Manajemen siswa asuh & kasus" />
                        <Feature icon={<Heart className="w-4 h-4" />} text="Layanan konseling & home visit" />
                        <Feature icon={<GraduationCap className="w-4 h-4" />} text="Instrumen BK (AKPD, DCM, Sosiometri)" />
                        <Feature icon={<Shield className="w-4 h-4" />} text="Kerahasiaan klien dijaga" />
                    </ul>
                </div>

                <p className="relative text-xs text-primary-200">
                    © {new Date().getFullYear()} SMAN 1 Kabanjahe
                </p>
            </aside>

            {/* Panel kanan — form */}
            <main className="flex flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-md">
                    <div className="md:hidden mb-6 flex items-center gap-3">
                        <ApplicationLogo />
                        <div>
                            <h1 className="font-semibold text-primary-900">{branding.site_short_name}</h1>
                            <p className="text-sm text-neutral-500">SMA Negeri 1 Kabanjahe</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl ring-1 ring-neutral-100 p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <li className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                {icon}
            </span>
            <span>{text}</span>
        </li>
    );
}
