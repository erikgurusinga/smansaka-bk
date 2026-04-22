import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, SemesterProgram, RplBk, AnnualProgram } from '@/types';

interface SemesterDetail extends SemesterProgram {
    annual_program: AnnualProgram;
}

interface Props extends PageProps {
    program: SemesterDetail;
    rpls: RplBk[];
}

const MONTHS: Record<number, string> = {
    1: 'Januari',
    2: 'Februari',
    3: 'Maret',
    4: 'April',
    5: 'Mei',
    6: 'Juni',
    7: 'Juli',
    8: 'Agustus',
    9: 'September',
    10: 'Oktober',
    11: 'November',
    12: 'Desember',
};

export default function SemesterShow({ program, rpls, permissions }: Props) {
    const canWrite = permissions['program_semester']?.write;

    const rplMap = new Map(rpls.map((r) => [r.id, r]));

    // Group by month
    const schedule = program.schedule ?? [];
    const byMonth = new Map<number, typeof schedule>();
    schedule
        .slice()
        .sort((a, b) => a.month - b.month || a.week - b.week)
        .forEach((s) => {
            if (!byMonth.has(s.month)) byMonth.set(s.month, []);
            byMonth.get(s.month)!.push(s);
        });

    const handleDelete = () => {
        if (!confirm(`Hapus program semester "${program.title}"?`)) return;
        router.delete(route('semester.destroy', program.id), {
            onSuccess: () => toast.success('Program semester dihapus.'),
            onError: () => toast.error('Terjadi kesalahan.'),
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Program BK' },
                { label: 'Program Tahunan', href: route('annual.index') },
                {
                    label: program.annual_program.title,
                    href: route('annual.show', program.annual_program.id),
                },
                { label: program.title },
            ]}
        >
            <Head title={`Semester — ${program.title}`} />

            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('annual.show', program.annual_program.id)}>
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
                                <Badge variant={program.semester === 'ganjil' ? 'info' : 'warning'}>
                                    Semester {program.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                </Badge>
                                <span className="text-sm text-neutral-500">
                                    {schedule.length} layanan terjadwal
                                </span>
                            </div>
                        </div>
                    </div>
                    {canWrite && (
                        <Button
                            variant="secondary"
                            onClick={handleDelete}
                            className="gap-1.5 text-rose-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </Button>
                    )}
                </div>

                {program.notes && (
                    <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Catatan
                        </p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900">
                            {program.notes}
                        </p>
                    </div>
                )}

                {schedule.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-neutral-100">
                        <p className="text-sm text-neutral-400">Belum ada jadwal terdefinisi.</p>
                    </div>
                ) : (
                    Array.from(byMonth.entries()).map(([month, rows]) => (
                        <div
                            key={month}
                            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
                        >
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                                <span className="bg-primary-100 text-primary-700 rounded-lg px-2 py-0.5">
                                    {MONTHS[month]}
                                </span>
                                <span className="text-xs text-neutral-400">
                                    · {rows.length} layanan
                                </span>
                            </h2>
                            <div className="space-y-2">
                                {rows.map((r, idx) => {
                                    const rpl = rplMap.get(r.rpl_id);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
                                        >
                                            <Badge variant="neutral">Minggu {r.week}</Badge>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-neutral-900">
                                                    {rpl?.title ?? '— RPL dihapus —'}
                                                </p>
                                                {rpl && (
                                                    <p className="text-xs text-neutral-500">
                                                        {rpl.service_type} · Bidang {rpl.bidang} ·{' '}
                                                        {rpl.duration_minutes ?? '—'} mnt
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="info">
                                                {r.class_level === 'semua'
                                                    ? 'Semua Kelas'
                                                    : `Kelas ${r.class_level}`}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}
