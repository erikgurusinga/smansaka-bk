import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Lock, Unlock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, CounselingSession } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    session: CounselingSession;
}

const statusBadge = (s: string): 'info' | 'warning' | 'success' | 'neutral' => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
        dijadwalkan: 'info',
        berlangsung: 'warning',
        selesai: 'success',
        dibatalkan: 'neutral',
    };
    return map[s] ?? 'info';
};

const statusLabel = (s: string) =>
    ({
        dijadwalkan: 'Dijadwalkan',
        berlangsung: 'Berlangsung',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
    })[s] ?? s;

const fmt = (d: string) => format(new Date(d), 'd MMMM yyyy', { locale: idLocale });

export default function IndividualCounselingShow({ session: sesi, permissions }: Props) {
    const canWrite = permissions['counseling_individual']?.write;
    const student = sesi.students?.[0];

    const markSelesai = () => {
        router.put(
            route('counseling.individual.update', sesi.id),
            { ...sesi, status: 'selesai' },
            {
                onSuccess: () => toast.success('Status diperbarui.'),
                onError: () => toast.error('Terjadi kesalahan.'),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Konseling Individual', href: route('counseling.individual.index') },
                { label: sesi.topic },
            ]}
        >
            <Head title={sesi.topic} />

            <div className="mx-auto max-w-3xl space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('counseling.individual.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">{sesi.topic}</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={statusBadge(sesi.status)}>
                                    {statusLabel(sesi.status)}
                                </Badge>
                                {sesi.is_confidential ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                        <Lock className="h-3 w-3" /> Rahasia
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                                        <Unlock className="h-3 w-3" /> Umum
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {canWrite && (
                        <div className="flex gap-2">
                            {sesi.status !== 'selesai' && (
                                <Button
                                    variant="secondary"
                                    onClick={markSelesai}
                                    className="gap-1.5 text-green-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Tandai Selesai
                                </Button>
                            )}
                            <Link href={route('counseling.individual.edit', sesi.id)}>
                                <Button>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Siswa & Meta */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Siswa
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                            {student?.name ?? '—'}
                        </p>
                        <p className="text-sm text-neutral-500">
                            {student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Detail Sesi
                        </p>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Tanggal</span>
                                <span className="font-medium">{fmt(sesi.date)}</span>
                            </div>
                            {sesi.start_time && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Jam</span>
                                    <span className="font-medium">
                                        {sesi.start_time.slice(0, 5)}
                                    </span>
                                </div>
                            )}
                            {sesi.duration_minutes && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Durasi</span>
                                    <span className="font-medium">
                                        {sesi.duration_minutes} menit
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Konselor</span>
                                <span className="font-medium">{sesi.counselor?.name ?? '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Catatan */}
                {sesi.description && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Latar Belakang / Uraian Masalah
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                            {sesi.description}
                        </p>
                    </div>
                )}

                {sesi.outcome && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Hasil / Kesimpulan
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                            {sesi.outcome}
                        </p>
                    </div>
                )}

                {sesi.next_plan && (
                    <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Rencana Tindak Lanjut
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
                            {sesi.next_plan}
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
