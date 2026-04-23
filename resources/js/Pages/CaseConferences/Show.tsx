import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Pencil, Images, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Lightbox } from '@/Components/ui/Lightbox';
import { PdfViewer } from '@/Components/ui/PdfViewer';
import { PageProps, CaseConference } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface MediaItem {
    id: number;
    url: string;
    name: string;
}

interface Props extends PageProps {
    conference: CaseConference;
    documentation: MediaItem[];
    agreement: MediaItem | null;
}

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMMM yyyy', { locale: idLocale });

export default function CaseConferencesShow({
    conference,
    documentation,
    agreement,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const canWrite = permissions['case_conferences']?.write;
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [pdfOpen, setPdfOpen] = useState(false);

    const deleteAgreement = () => {
        if (!confirm('Hapus dokumen kesepakatan ini?')) return;
        router.post(
            route('case-conferences.update', conference.id),
            {
                _method: 'PUT',
                date: conference.date,
                topic: conference.topic,
                status: conference.status,
                delete_agreement: '1',
            },
            {
                forceFormData: true,
                onSuccess: () => toast.success('Dokumen dihapus.'),
                onError: handleError,
            },
        );
    };

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
                onError: handleError,
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
                    {canWrite && (
                        <div className="flex gap-2">
                            {conference.status !== 'selesai' && (
                                <Button
                                    variant="secondary"
                                    onClick={markSelesai}
                                    className="gap-1.5 text-green-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Tandai Selesai
                                </Button>
                            )}
                            <Link href={route('case-conferences.edit', conference.id)}>
                                <Button>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
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
                {documentation.length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            <Images className="h-4 w-4" />
                            Foto Dokumentasi
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {documentation.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setLightboxUrl(item.url)}
                                    className="group hover:ring-primary-400 overflow-hidden rounded-xl ring-1 ring-neutral-200 transition"
                                >
                                    <img
                                        src={item.url}
                                        alt={item.name}
                                        className="h-48 w-full object-cover transition group-hover:scale-105"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {agreement && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            <FileText className="h-4 w-4" />
                            Dokumen Kesepakatan
                        </p>
                        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                                <span className="max-w-xs truncate text-sm font-medium text-blue-800">
                                    {agreement.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setPdfOpen(true)}
                                    className="gap-1.5 text-xs"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    Lihat
                                </Button>
                                {canWrite && (
                                    <Button
                                        variant="secondary"
                                        onClick={deleteAgreement}
                                        className="gap-1.5 text-xs text-red-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Hapus
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {lightboxUrl && <Lightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
            {agreement && (
                <PdfViewer
                    src={agreement.url}
                    name={agreement.name}
                    open={pdfOpen}
                    onClose={() => setPdfOpen(false)}
                    canDownload={!!canWrite}
                />
            )}
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
