import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, CaseConference } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    conference: CaseConference;
}

const fmt = (d: string) => format(new Date(d), 'd MMMM yyyy', { locale: idLocale });

export default function CaseConferencesShow({ conference, permissions }: Props) {
    const canWrite = permissions['case_conferences']?.write;

    const markSelesai = () => {
        router.put(
            route('case-conferences.update', conference.id),
            {
                date: conference.date,
                topic: conference.topic,
                participants: conference.participants ?? [],
                notes: conference.notes,
                outcome: conference.outcome,
                status: 'selesai',
            },
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
                { label: 'Konferensi Kasus', href: route('case-conferences.index') },
                { label: conference.topic },
            ]}
        >
            <Head title={conference.topic} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('case-conferences.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                {conference.topic}
                            </h1>
                            <div className="mt-1">
                                <Badge
                                    variant={conference.status === 'selesai' ? 'success' : 'info'}
                                >
                                    {conference.status === 'selesai' ? 'Selesai' : 'Dijadwalkan'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {canWrite && conference.status !== 'selesai' && (
                        <Button
                            variant="secondary"
                            onClick={markSelesai}
                            className="gap-1.5 text-green-700"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Tandai Selesai
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Info Konferensi
                        </p>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Tanggal</span>
                                <span className="font-medium">{fmt(conference.date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Fasilitator</span>
                                <span className="font-medium">
                                    {conference.counselor?.name ?? '—'}
                                </span>
                            </div>
                            {conference.case_record && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Kasus</span>
                                    <span className="max-w-[180px] truncate text-right font-medium">
                                        {conference.case_record.title}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Peserta ({conference.participants?.length ?? 0})
                        </p>
                        {conference.participants && conference.participants.length > 0 ? (
                            <div className="space-y-1">
                                {conference.participants.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="font-medium text-neutral-800">
                                            {p.name}
                                        </span>
                                        <span className="text-xs text-neutral-400">{p.role}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400">Belum ada peserta.</p>
                        )}
                    </div>
                </div>

                {conference.notes && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Catatan Rapat
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                            {conference.notes}
                        </p>
                    </div>
                )}

                {conference.outcome && (
                    <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Hasil / Keputusan
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
                            {conference.outcome}
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
