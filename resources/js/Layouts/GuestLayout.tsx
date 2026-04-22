import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, Heart, Shield, Users } from 'lucide-react';
import { ApplicationLogo } from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';

export default function GuestLayout({ children }: PropsWithChildren) {
    const { branding } = usePage<PageProps>().props;

    return (
        <div className="grid min-h-screen bg-neutral-50 md:grid-cols-2">
            {/* Panel kiri — brand */}
            <aside className="from-primary-600 via-primary-700 to-primary-900 relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br p-10 text-white md:flex">
                <div className="bg-primary-500/30 absolute -top-20 -right-20 h-96 w-96 rounded-full blur-3xl" />
                <div className="bg-accent-500/20 absolute -bottom-20 -left-20 h-96 w-96 rounded-full blur-3xl" />

                <div className="relative">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <ApplicationLogo size={56} className="text-primary-700 bg-white" />
                        <div>
                            <h1 className="text-xl leading-tight font-semibold">
                                {branding.site_short_name}
                            </h1>
                            <p className="text-primary-100 text-sm">SMA Negeri 1 Kabanjahe</p>
                        </div>
                    </Link>
                </div>

                <div className="relative space-y-6">
                    <h2 className="text-3xl leading-tight font-bold">
                        Sistem Informasi
                        <br />
                        <span className="text-accent-300">Bimbingan &amp; Konseling</span>
                    </h2>
                    <p className="text-primary-100 max-w-md leading-relaxed">
                        Satu tempat untuk mengelola data siswa asuh, kasus, layanan konseling,
                        instrumen, dan program BK. Aman, rahasia, dan modern.
                    </p>

                    <ul className="space-y-3 text-sm">
                        <Feature
                            icon={<Users className="h-4 w-4" />}
                            text="Manajemen siswa asuh & kasus"
                        />
                        <Feature
                            icon={<Heart className="h-4 w-4" />}
                            text="Layanan konseling & home visit"
                        />
                        <Feature
                            icon={<GraduationCap className="h-4 w-4" />}
                            text="Instrumen BK (AKPD, DCM, Sosiometri)"
                        />
                        <Feature
                            icon={<Shield className="h-4 w-4" />}
                            text="Kerahasiaan klien dijaga"
                        />
                    </ul>
                </div>

                <p className="text-primary-200 relative text-xs">
                    © {new Date().getFullYear()} SMAN 1 Kabanjahe
                </p>
            </aside>

            {/* Panel kanan — form */}
            <main className="flex flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-md">
                    <div className="mb-6 flex items-center gap-3 md:hidden">
                        <ApplicationLogo />
                        <div>
                            <h1 className="text-primary-900 font-semibold">
                                {branding.site_short_name}
                            </h1>
                            <p className="text-sm text-neutral-500">SMA Negeri 1 Kabanjahe</p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-neutral-100">
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
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                {icon}
            </span>
            <span>{text}</span>
        </li>
    );
}
