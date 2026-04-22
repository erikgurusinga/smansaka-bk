import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, AnnualProgram, RplBk, SemesterProgram } from '@/types';

interface AnnualDetail extends AnnualProgram {
    semester_programs: SemesterProgram[];
}

interface Props extends PageProps {
    program: AnnualDetail;
    linked_rpls: RplBk[];
}

const BIDANG_LABELS: Record<string, string> = {
    pribadi: 'Pribadi',
    sosial: 'Sosial',
    belajar: 'Belajar',
    karier: 'Karier',
};

const bidangBadge = (b: string): 'info' | 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
        pribadi: 'info',
        sosial: 'success',
        belajar: 'warning',
        karier: 'danger',
    };
    return map[b] ?? 'info';
};

const statusBadge = (s: string): 'info' | 'success' | 'neutral' => {
    const map: Record<string, 'info' | 'success' | 'neutral'> = {
        draft: 'neutral',
        active: 'info',
        completed: 'success',
    };
    return map[s] ?? 'neutral';
};

export default function AnnualShow({ program, linked_rpls, permissions }: Props) {
    const canWrite = permissions['program_annual']?.write;

    const semestersMade = program.semester_programs.map((s) => s.semester);
    const missingSemesters = ['ganjil', 'genap'].filter(
        (s) => !semestersMade.includes(s as 'ganjil' | 'genap'),
    );

    const setActive = () => {
        router.put(
            route('annual.update', program.id),
            {
                title: program.title,
                description: program.description ?? '',
                status: 'active',
                items: program.items,
            },
            {
                preserveState: false,
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Program BK' },
                { label: 'Program Tahunan', href: route('annual.index') },
                { label: program.title },
            ]}
        >
            <Head title={`Program — ${program.title}`} />

            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('annual.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                {program.title}
                            </h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={statusBadge(program.status)}>
                                    {program.status.charAt(0).toUpperCase() +
                                        program.status.slice(1)}
                                </Badge>
                                <span className="text-sm text-neutral-500">
                                    TA {program.academic_year?.year}
                                </span>
                                <span className="text-sm text-neutral-400">
                                    · Oleh {program.counselor?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canWrite && program.status === 'draft' && (
                            <Button variant="secondary" onClick={setActive}>
                                Aktifkan
                            </Button>
                        )}
                        {canWrite && (
                            <Link href={route('annual.edit', program.id)}>
                                <Button variant="secondary" className="gap-1.5">
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {program.description && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Deskripsi
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                            {program.description}
                        </p>
                    </div>
                )}

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="mb-4 text-sm font-semibold text-neutral-700">
                        Rencana per Bidang ({program.items?.length ?? 0})
                    </h2>
                    <div className="space-y-3">
                        {(program.items ?? []).map((item, idx) => {
                            const itemRpls = linked_rpls.filter((r) =>
                                (item.rpl_ids ?? []).includes(r.id),
                            );
                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={bidangBadge(item.bidang)}>
                                                {BIDANG_LABELS[item.bidang]}
                                            </Badge>
                                            <Badge variant="neutral">
                                                Prioritas {item.priority}/5
                                            </Badge>
                                            <span className="text-xs text-neutral-500">
                                                Target: {item.target_count} RPL
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mb-3 text-sm text-neutral-700">{item.focus}</p>
                                    {itemRpls.length > 0 && (
                                        <div className="space-y-1 border-t border-neutral-200 pt-2">
                                            <p className="text-xs text-neutral-400">
                                                RPL terkait ({itemRpls.length}):
                                            </p>
                                            <ul className="space-y-0.5">
                                                {itemRpls.map((r) => (
                                                    <li
                                                        key={r.id}
                                                        className="text-sm text-neutral-700"
                                                    >
                                                        • {r.title}{' '}
                                                        <span className="text-xs text-neutral-400">
                                                            ({r.service_type} ·{' '}
                                                            {r.semester === 'ganjil'
                                                                ? 'Ganjil'
                                                                : 'Genap'}
                                                            )
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-neutral-700">
                            Program Semester (Turunan)
                        </h2>
                        {canWrite && missingSemesters.length > 0 && (
                            <div className="flex gap-2">
                                {missingSemesters.map((s) => (
                                    <Link
                                        key={s}
                                        href={`${route('semester.create')}?annual_program_id=${program.id}&semester=${s}`}
                                    >
                                        <Button variant="secondary" className="gap-1.5 text-xs">
                                            <Plus className="h-3 w-3" />
                                            {s === 'ganjil' ? 'Semester Ganjil' : 'Semester Genap'}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {program.semester_programs.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-400">
                            Belum ada program semester. Buat turunan ganjil &amp; genap untuk
                            menjadwalkan layanan mingguan.
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {program.semester_programs.map((s) => (
                                <Link
                                    key={s.id}
                                    href={route('semester.show', s.id)}
                                    className="hover:bg-primary-50 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                                >
                                    <Badge variant={s.semester === 'ganjil' ? 'info' : 'warning'}>
                                        Semester {s.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                    </Badge>
                                    <p className="mt-2 text-sm font-medium text-neutral-900">
                                        {s.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-neutral-400">
                                        {(s.schedule ?? []).length} jadwal layanan
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
