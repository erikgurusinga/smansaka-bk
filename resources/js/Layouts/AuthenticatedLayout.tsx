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
    iconBg?: string;
    childIconColor?: string;
    permission?: string;
    children?: NavItem[];
}

const navigation: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        iconBg: 'bg-primary-100 text-primary-600',
        permission: 'dashboard',
    },
    {
        label: 'Master Data',
        icon: <Users className="h-4 w-4" />,
        iconBg: 'bg-violet-100 text-violet-600',
        childIconColor: 'text-violet-400',
        children: [
            {
                label: 'Siswa Asuh',
                href: '/students',
                icon: <Users className="h-4 w-4" />,
                permission: 'students',
            },
            {
                label: 'Penugasan Siswa',
                href: '/student-guidance',
                icon: <UserCog className="h-4 w-4" />,
                permission: 'students',
            },
            {
                label: 'Kelas & Wali',
                href: '/classes',
                icon: <UserCog className="h-4 w-4" />,
                permission: 'classes',
            },
            {
                label: 'Guru',
                href: '/teachers',
                icon: <Users2 className="h-4 w-4" />,
                permission: 'classes',
            },
            {
                label: 'Orang Tua',
                href: '/parents',
                icon: <Users2 className="h-4 w-4" />,
                permission: 'parents',
            },
            {
                label: 'Tahun Ajaran',
                href: '/academic-years',
                icon: <CalendarDays className="h-4 w-4" />,
                permission: 'academic_years',
            },
        ],
    },
    {
        label: 'Layanan BK',
        icon: <MessageCircle className="h-4 w-4" />,
        iconBg: 'bg-emerald-100 text-emerald-600',
        childIconColor: 'text-emerald-400',
        children: [
            {
                label: 'Konseling Individual',
                href: '/counseling/individual',
                icon: <MessageCircle className="h-4 w-4" />,
                permission: 'counseling_individual',
            },
            {
                label: 'Konseling Kelompok',
                href: '/counseling/group',
                icon: <Users2 className="h-4 w-4" />,
                permission: 'counseling_group',
            },
            {
                label: 'Bimbingan Klasikal',
                href: '/counseling/classical',
                icon: <Presentation className="h-4 w-4" />,
                permission: 'counseling_classical',
            },
            {
                label: 'Home Visit',
                href: '/counseling/home-visit',
                icon: <Home className="h-4 w-4" />,
                permission: 'home_visit',
            },
        ],
    },
    {
        label: 'Kasus & Pelanggaran',
        icon: <AlertTriangle className="h-4 w-4" />,
        iconBg: 'bg-orange-100 text-orange-600',
        childIconColor: 'text-orange-400',
        children: [
            {
                label: 'Buku Kasus',
                href: '/cases',
                icon: <BookOpen className="h-4 w-4" />,
                permission: 'cases',
            },
            {
                label: 'Poin Pelanggaran',
                href: '/student-violations',
                icon: <ShieldAlert className="h-4 w-4" />,
                permission: 'violations',
            },
            {
                label: 'Jenis Pelanggaran',
                href: '/violations',
                icon: <ShieldAlert className="h-4 w-4" />,
                permission: 'violations',
            },
            {
                label: 'Konferensi Kasus',
                href: '/case-conferences',
                icon: <Gavel className="h-4 w-4" />,
                permission: 'case_conferences',
            },
            {
                label: 'Referral',
                href: '/referrals',
                icon: <ClipboardList className="h-4 w-4" />,
                permission: 'referrals',
            },
        ],
    },
    {
        label: 'Instrumen',
        icon: <FileQuestion className="h-4 w-4" />,
        iconBg: 'bg-amber-100 text-amber-700',
        childIconColor: 'text-amber-500',
        children: [
            {
                label: 'AKPD',
                href: '/instruments/akpd/responses',
                icon: <FileQuestion className="h-4 w-4" />,
                permission: 'instrument_akpd',
            },
            {
                label: 'DCM',
                href: '/instruments/dcm/responses',
                icon: <FileQuestion className="h-4 w-4" />,
                permission: 'instrument_dcm',
            },
            {
                label: 'Sosiometri',
                href: '/instruments/sociometry',
                icon: <Network className="h-4 w-4" />,
                permission: 'instrument_sociometry',
            },
            {
                label: 'Minat Bakat',
                href: '/instruments/career',
                icon: <Compass className="h-4 w-4" />,
                permission: 'instrument_career',
            },
        ],
    },
    {
        label: 'Program BK',
        icon: <FileText className="h-4 w-4" />,
        iconBg: 'bg-blue-100 text-blue-600',
        childIconColor: 'text-blue-400',
        children: [
            {
                label: 'RPL BK',
                href: '/programs/rpl',
                icon: <FileText className="h-4 w-4" />,
                permission: 'program_rpl',
            },
            {
                label: 'Program Tahunan',
                href: '/programs/annual',
                icon: <CalendarDays className="h-4 w-4" />,
                permission: 'program_annual',
            },
            {
                label: 'Program Semesteran',
                href: '/programs/semester',
                icon: <CalendarDays className="h-4 w-4" />,
                permission: 'program_semester',
            },
        ],
    },
    {
        label: 'Laporan',
        href: '/reports',
        icon: <BarChart3 className="h-4 w-4" />,
        iconBg: 'bg-rose-100 text-rose-600',
        permission: 'reports',
    },
];

const settingsNav: NavItem[] = [
    {
        label: 'Sistem',
        href: '/system',
        icon: <Settings className="h-4 w-4" />,
        iconBg: 'bg-slate-100 text-slate-500',
        permission: 'system',
    },
];

interface Props {
    header?: ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function AuthenticatedLayout({
    header,
    breadcrumbs,
    children,
}: PropsWithChildren<Props>) {
    const { auth, permissions, academic_year, branding } = usePage<PageProps>().props;
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
        <div className="flex min-h-screen bg-neutral-50">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-neutral-100 bg-white transition-transform md:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Brand card */}
                <div className="p-4">
                    <Link
                        href="/dashboard"
                        className="from-primary-600 to-primary-800 block rounded-2xl bg-gradient-to-br p-4 text-white shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <ApplicationLogo size={40} className="text-primary-700 bg-white" />
                            <div>
                                <h1 className="text-sm leading-tight font-semibold">
                                    {branding.site_short_name}
                                </h1>
                                <p className="text-primary-100 text-xs">SMAN 1 Kabanjahe</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                    {navigation.map((item) => (
                        <NavNode key={item.label} item={item} canSee={canSee} isActive={isActive} />
                    ))}

                    <div className="mt-4 space-y-1 border-t border-neutral-100 pt-4">
                        <p className="mb-1 px-3 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                            Pengaturan
                        </p>
                        {settingsNav.map((item) => (
                            <NavNode
                                key={item.label}
                                item={item}
                                canSee={canSee}
                                isActive={isActive}
                            />
                        ))}
                    </div>
                </nav>

                {/* Logout */}
                <div className="border-t border-neutral-100 p-3">
                    <button
                        onClick={handleLogout}
                        className="hover:bg-danger-50 hover:text-danger-700 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 transition"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Overlay mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main */}
            <div className="flex min-h-screen flex-1 flex-col md:ml-72">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-100 bg-white px-4 md:px-6">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-lg p-2 hover:bg-neutral-100 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex-1">
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div className="text-sm text-neutral-500">
                                {breadcrumbs.map((b, i) => (
                                    <span key={i}>
                                        {b.href ? (
                                            <Link href={b.href} className="hover:text-primary-600">
                                                {b.label}
                                            </Link>
                                        ) : (
                                            <span
                                                className={cn(
                                                    i === breadcrumbs.length - 1 &&
                                                        'font-medium text-neutral-900',
                                                )}
                                            >
                                                {b.label}
                                            </span>
                                        )}
                                        {i < breadcrumbs.length - 1 && (
                                            <span className="mx-2">›</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tahun ajaran badge */}
                    {academic_year && (
                        <div className="bg-primary-50 text-primary-700 hidden items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium md:flex">
                            <CalendarDays className="h-3.5 w-3.5" />
                            TA {academic_year.year} ·{' '}
                            {academic_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                        </div>
                    )}

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 rounded-xl p-1.5 pr-3 hover:bg-neutral-50"
                        >
                            <div className="bg-primary-100 text-primary-700 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                                {auth.user ? initials(auth.user.name) : '?'}
                            </div>
                            <div className="hidden text-left md:block">
                                <p className="text-sm leading-tight font-medium">
                                    {auth.user?.name}
                                </p>
                                <p className="text-xs leading-tight text-neutral-500">
                                    {auth.user?.position ?? '—'}
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                        </button>

                        {profileOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setProfileOpen(false)}
                                />
                                <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl bg-white py-1 shadow-lg ring-1 ring-neutral-100">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                                    >
                                        <UserIcon className="h-4 w-4" /> Profil Saya
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-danger-700 hover:bg-danger-50 flex w-full items-center gap-2 px-4 py-2 text-sm"
                                    >
                                        <LogOut className="h-4 w-4" /> Keluar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Header section */}
                {header && (
                    <div className="border-b border-neutral-100 bg-white px-4 py-5 md:px-8">
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
    const hasActiveChild = item.children?.some((c) => isActive(c.href)) ?? false;
    const [open, setOpen] = useState(hasActiveChild);

    if (item.children) {
        const visible = item.children.filter((c) => canSee(c.permission));
        if (visible.length === 0) return null;

        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                    <span className="flex items-center gap-2 font-medium">
                        <span
                            className={cn(
                                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                                item.iconBg ?? 'bg-neutral-100 text-neutral-500',
                            )}
                        >
                            {item.icon}
                        </span>
                        {item.label}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
                </button>
                {open && (
                    <div className="mt-1 ml-3 space-y-0.5 border-l border-neutral-100 pl-3">
                        {visible.map((c) => (
                            <NavLink
                                key={c.label}
                                item={c}
                                active={isActive(c.href)}
                                childIconColor={item.childIconColor}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (!canSee(item.permission)) return null;

    return <NavLink item={item} active={isActive(item.href)} />;
}

function NavLink({
    item,
    active,
    childIconColor,
}: {
    item: NavItem;
    active: boolean;
    childIconColor?: string;
}) {
    return (
        <Link
            href={item.href ?? '#'}
            className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                active
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-50',
            )}
        >
            {item.iconBg ? (
                <span
                    className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                        active ? 'bg-white/20 text-white' : item.iconBg,
                    )}
                >
                    {item.icon}
                </span>
            ) : (
                <span
                    className={cn(active ? 'text-white' : (childIconColor ?? 'text-neutral-400'))}
                >
                    {item.icon}
                </span>
            )}
            <span className="truncate">{item.label}</span>
        </Link>
    );
}
