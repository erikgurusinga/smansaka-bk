import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, CheckCircle, Users, Images, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Lightbox } from '@/Components/ui/Lightbox';
import { PdfViewer } from '@/Components/ui/PdfViewer';
import { PageProps, CounselingSession } from '@/types';
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
    session: CounselingSession;
    documentation: MediaItem[];
    agreement: MediaItem | null;
    student_photos: Record<number, string | null>;
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

const fmt = (d: string) =>
    d ? format(parseISO(d.slice(0, 10)), 'd MMMM yyyy', { locale: idLocale }) : '—';

export default function GroupCounselingShow({
    session: sesi,
    documentation,
    agreement,
    student_photos,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const canWrite = permissions['counseling_group']?.write;
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [pdfOpen, setPdfOpen] = useState(false);

    const deleteAgreement = () => {
        if (!confirm('Hapus dokumen kesepakatan ini?')) return;
        router.post(
            route('counseling.group.update', sesi.id),
            {
                _method: 'PUT',
                student_ids: sesi.students?.map((s) => s.id) ?? [],
                date: sesi.date,
                topic: sesi.topic,
                status: sesi.status,
                is_confidential: sesi.is_confidential,
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
            route('counseling.group.update', sesi.id),
            {
                student_ids: sesi.students?.map((s) => s.id) ?? [],
                date: sesi.date,
                start_time: sesi.start_time ?? '',
                duration_minutes: sesi.duration_minutes ?? '',
                topic: sesi.topic,
                description: sesi.description ?? '',
                outcome: sesi.outcome ?? '',
                next_plan: sesi.next_plan ?? '',
                status: 'selesai',
                is_confidential: sesi.is_confidential,
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
                { label: 'Konseling Kelompok', href: route('counseling.group.index') },
                { label: sesi?.topic ?? '…' },
            ]}
        >
            <Head title={sesi.topic} />

            <div className="mx-auto max-w-3xl space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('counseling.group.index')}>
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
                                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                    <Users className="h-3 w-3" />
                                    {sesi.students?.length ?? 0} peserta
                                </span>
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
                            <Link href={sesi?.id ? route('counseling.group.edit', sesi.id) : '#'}>
                                <Button>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Detail & Peserta */}
                <div className="grid grid-cols-2 gap-4">
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

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Peserta ({sesi.students?.length ?? 0} Siswa)
                        </p>
                        <div className="max-h-40 space-y-1.5 overflow-y-auto">
                            {sesi.students?.length ? (
                                sesi.students.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {student_photos[s.id] ? (
                                                <img
                                                    src={student_photos[s.id]!}
                                                    alt={s.name}
                                                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="bg-primary-100 text-primary-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                    {s.name?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-neutral-800">
                                                {s.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-neutral-400">
                                            {s.school_class?.name ?? 'Tanpa Kelas'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-neutral-400">Tidak ada peserta.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Catatan */}
                {sesi.description && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Latar Belakang / Uraian
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

                {/* Dokumentasi */}
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
            </div>

            {agreement && (
                <div className="mx-auto max-w-3xl">
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
                </div>
            )}

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
