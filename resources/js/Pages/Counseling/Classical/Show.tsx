import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Images, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Lightbox } from '@/Components/ui/Lightbox';
import { PdfViewer } from '@/Components/ui/PdfViewer';
import { PageProps, ClassicalGuidance } from '@/types';
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
    record: ClassicalGuidance;
    documentation: MediaItem[];
    agreement: MediaItem | null;
}

const fmt = (d: string) =>
    d ? format(parseISO(d.slice(0, 10)), 'd MMMM yyyy', { locale: idLocale }) : '—';

export default function ClassicalGuidanceShow({
    record,
    documentation,
    agreement,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const canWrite = permissions['counseling_classical']?.write;
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [pdfOpen, setPdfOpen] = useState(false);

    const deleteAgreement = () => {
        if (!confirm('Hapus dokumen kesepakatan ini?')) return;
        router.post(
            route('counseling.classical.update', record.id),
            { _method: 'PUT', date: record.date, topic: record.topic, delete_agreement: '1' },
            {
                forceFormData: true,
                onSuccess: () => toast.success('Dokumen dihapus.'),
                onError: handleError,
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Bimbingan Klasikal', href: route('counseling.classical.index') },
                { label: record.topic },
            ]}
        >
            <Head title={record.topic} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('counseling.classical.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold text-neutral-900">{record.topic}</h1>
                    </div>
                    {canWrite && (
                        <Link href={route('counseling.classical.edit', record.id)}>
                            <Button className="gap-1.5">
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Info Kelas
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                            {record.school_class?.name ?? '—'}
                        </p>
                        <p className="text-sm text-neutral-500">
                            {record.academic_year?.year} — Semester {record.academic_year?.semester}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Detail Bimbingan
                        </p>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Tanggal</span>
                                <span className="font-medium">{fmt(record.date)}</span>
                            </div>
                            {record.duration_minutes && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Durasi</span>
                                    <span className="font-medium">
                                        {record.duration_minutes} menit
                                    </span>
                                </div>
                            )}
                            {record.method && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Metode</span>
                                    <span className="font-medium">{record.method}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Konselor</span>
                                <span className="font-medium">{record.counselor?.name ?? '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {record.description && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Uraian / Materi
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                            {record.description}
                        </p>
                    </div>
                )}

                {record.evaluation && (
                    <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Evaluasi
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
                            {record.evaluation}
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
