import { PropsWithChildren, ReactNode, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserCog,
    BookOpen,
    MessageCircle,
    Users2,
    Presentation,
    Home,
    AlertTriangle,
    ShieldAlert,
    Gavel,
    ClipboardList,
    FileQuestion,
    Network,
    Compass,
    FileText,
    CalendarDays,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    ChevronDown,
    User as UserIcon,
} from 'lucide-react';
import { ApplicationLogo } from '@/Components/ApplicationLogo';
import { cn, initials } from '@/lib/utils';
import { PageProps } from '@/types';

interface NavItem {
    label: string;
    href?: string;
    icon: ReactNode;
    permission?: string;
    children?: NavItem[];
}

const navigation: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, permission: 'dashboard' },
    {
        label: 'Master Data',
        icon: <Users className="w-4 h-4" />,
        children: [
            { label: 'Siswa Asuh', href: '/students', icon: <Users className="w-4 h-4" />, permission: 'students' },
            { label: 'Kelas & Wali', href: '/classes', icon: <UserCog className="w-4 h-4" />, permission: 'classes' },
            { label: 'Orang Tua', href: '/parents', icon: <Users2 className="w-4 h-4" />, permission: 'parents' },
            { label: 'Tahun Ajaran', href: '/academic-years', icon: <CalendarDays className="w-4 h-4" />, permission: 'academic_years' },
        ],
    },
    {
        label: 'Layanan BK',
        icon: <MessageCircle className="w-4 h-4" />,
        children: [
            { label: 'Konseling Individual', href: '/counseling/individual', icon: <MessageCircle className="w-4 h-4" />, permission: 'counseling_individual' },
            { label: 'Konseling Kelompok', href: '/counseling/group', icon: <Users2 className="w-4 h-4" />, permission: 'counseling_group' },
            { label: 'Bimbingan Klasikal', href: '/counseling/classical', icon: <Presentation className="w-4 h-4" />, permission: 'counseling_classical' },
            { label: 'Home Visit', href: '/counseling/home-visit', icon: <Home className="w-4 h-4" />, permission: 'home_visit' },
        ],
    },
    {
        label: 'Kasus & Pelanggaran',
        icon: <AlertTriangle className="w-4 h-4" />,
        children: [
            { label: 'Buku Kasus', href: '/cases', icon: <BookOpen className="w-4 h-4" />, permission: 'cases' },
            { label: 'Poin Pelanggaran', href: '/violations', icon: <ShieldAlert className="w-4 h-4" />, permission: 'violations' },
            { label: 'Konferensi Kasus', href: '/case-conferences', icon: <Gavel className="w-4 h-4" />, permission: 'case_conferences' },
            { label: 'Referral', href: '/referrals', icon: <ClipboardList className="w-4 h-4" />, permission: 'referrals' },
        ],
    },
    {
        label: 'Instrumen',
        icon: <FileQuestion className="w-4 h-4" />,
        children: [
            { label: 'AKPD', href: '/instruments/akpd', icon: <FileQuestion className="w-4 h-4" />, permission: 'instrument_akpd' },
            { label: 'DCM', href: '/instruments/dcm', icon: <FileQuestion className="w-4 h-4" />, permission: 'instrument_dcm' },
            { label: 'Sosiometri', href: '/instruments/sociometry', icon: <Network className="w-4 h-4" />, permission: 'instrument_sociometry' },
            { label: 'Minat Bakat', href: '/instruments/career', icon: <Compass className="w-4 h-4" />, permission: 'instrument_career' },
        ],
    },
    {
        label: 'Program BK',
        icon: <FileText className="w-4 h-4" />,
        children: [
            { label: 'RPL BK', href: '/programs/rpl', icon: <FileText className="w-4 h-4" />, permission: 'program_rpl' },
            { label: 'Program Tahunan', href: '/programs/annual', icon: <CalendarDays className="w-4 h-4" />, permission: 'program_annual' },
            { label: 'Program Semesteran', href: '/programs/semester', icon: <CalendarDays className="w-4 h-4" />, permission: 'program_semester' },
        ],
    },
    { label: 'Laporan', href: '/reports', icon: <BarChart3 className="w-4 h-4" />, permission: 'reports' },
];

const settingsNav: NavItem[] = [
    { label: 'Sistem', href: '/system', icon: <Settings className="w-4 h-4" />, permission: 'system' },
];

interface Props {
    header?: ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function AuthenticatedLayout({ header, breadcrumbs, children }: PropsWithChildren<Props>) {
    const { auth, permissions, academic_year, branding, url } = usePage<PageProps & { url: string }>().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const canSee = (perm?: string) => {
        if (!perm) return true;
        return permissions[perm]?.read === true;
    };

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const isActive = (href?: string) =>
        href && (currentPath === href || currentPath.startsWith(href + '/'));

    const handleLogout = () => router.post(route('logout'));

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 w-72 bg-white border-r border-neutral-100 flex flex-col z-40 transition-transform md:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Brand card */}
                <div className="p-4">
                    <Link
                        href="/dashboard"
                        className="block rounded-2xl p-4 bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <ApplicationLogo size={40} className="bg-white text-primary-700" />
                            <div>
                                <h1 className="font-semibold text-sm leading-tight">
                                    {branding.site_short_name}
                                </h1>
                                <p className="text-primary-100 text-xs">SMAN 1 Kabanjahe</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                    {navigation.map((item) => (
                        <NavNode key={item.label} item={item} canSee={canSee} isActive={isActive} />
                    ))}

                    <div className="pt-4 mt-4 border-t border-neutral-100 space-y-1">
                        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            Pengaturan
                        </p>
                        {settingsNav.map((item) => (
                            <NavNode key={item.label} item={item} canSee={canSee} isActive={isActive} />
                        ))}
                    </div>
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-neutral-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-neutral-700 hover:bg-danger-50 hover:text-danger-700 transition"
                    >
                        <LogOut className="w-4 h-4" />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Overlay mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-20 bg-white border-b border-neutral-100 h-16 flex items-center px-4 md:px-6 gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div className="text-sm text-neutral-500">
                                {breadcrumbs.map((b, i) => (
                                    <span key={i}>
                                        {b.href ? (
                                            <Link href={b.href} className="hover:text-primary-600">{b.label}</Link>
                                        ) : (
                                            <span className={cn(i === breadcrumbs.length - 1 && 'text-neutral-900 font-medium')}>{b.label}</span>
                                        )}
                                        {i < breadcrumbs.length - 1 && <span className="mx-2">›</span>}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tahun ajaran badge */}
                    {academic_year && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                            <CalendarDays className="w-3.5 h-3.5" />
                            TA {academic_year.year} · {academic_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                        </div>
                    )}

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-neutral-50"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                                {auth.user ? initials(auth.user.name) : '?'}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium leading-tight">{auth.user?.name}</p>
                                <p className="text-xs text-neutral-500 leading-tight">{auth.user?.position ?? '—'}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                        </button>

                        {profileOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-neutral-100 py-1 z-50">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                                    >
                                        <UserIcon className="w-4 h-4" /> Profil Saya
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-700 hover:bg-danger-50"
                                    >
                                        <LogOut className="w-4 h-4" /> Keluar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Header section */}
                {header && (
                    <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-5">
                        {header}
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}

function NavNode({
    item,
    canSee,
    isActive,
}: {
    item: NavItem;
    canSee: (p?: string) => boolean;
    isActive: (h?: string) => boolean;
}) {
    const [open, setOpen] = useState(true);

    if (item.children) {
        const visible = item.children.filter((c) => canSee(c.permission));
        if (visible.length === 0) return null;

        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50"
                >
                    <span className="flex items-center gap-2 font-medium">
                        {item.icon}
                        {item.label}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 transition', open && 'rotate-180')} />
                </button>
                {open && (
                    <div className="ml-3 pl-3 border-l border-neutral-100 space-y-0.5 mt-1">
                        {visible.map((c) => (
                            <NavLink key={c.label} item={c} active={isActive(c.href)} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (!canSee(item.permission)) return null;

    return <NavLink item={item} active={isActive(item.href)} />;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <Link
            href={item.href ?? '#'}
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition',
                active
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-50',
            )}
        >
            {item.icon}
            <span className="truncate">{item.label}</span>
        </Link>
    );
}
