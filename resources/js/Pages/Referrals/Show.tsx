import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Pencil, Images, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Select } from '@/Components/ui/Select';
import { Lightbox } from '@/Components/ui/Lightbox';
import { PdfViewer } from '@/Components/ui/PdfViewer';
import { PageProps, Referral } from '@/types';
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
    referral: Referral;
    documentation: MediaItem[];
    agreement: MediaItem | null;
    student_photo: string | null;
}

const statusBadge = (s: string): 'info' | 'warning' | 'success' | 'neutral' => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
        aktif: 'info',
        diterima: 'warning',
        selesai: 'success',
        ditolak: 'neutral',
    };
    return map[s] ?? 'info';
};

const statusLabel = (s: string) =>
    ({ aktif: 'Aktif', diterima: 'Diterima', ditolak: 'Ditolak', selesai: 'Selesai' })[s] ?? s;

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMMM yyyy', { locale: idLocale });

const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'diterima', label: 'Diterima' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'selesai', label: 'Selesai' },
];

export default function ReferralsShow({
    referral,
    documentation,
    agreement,
    student_photo,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const canWrite = permissions['referrals']?.write;
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [pdfOpen, setPdfOpen] = useState(false);

    const deleteAgreement = () => {
        if (!confirm('Hapus dokumen kesepakatan ini?')) return;
        router.post(
            route('referrals.update', referral.id),
            {
                _method: 'PUT',
                referred_to: referral.referred_to,
                reason: referral.reason,
                date: referral.date,
                status: referral.status,
                delete_agreement: '1',
            },
            {
                forceFormData: true,
                onSuccess: () => toast.success('Dokumen dihapus.'),
                onError: handleError,
            },
        );
    };

    const updateStatus = (status: string) => {
        router.put(
            route('referrals.update', referral.id),
            {
                referred_to: referral.referred_to,
                reason: referral.reason,
                date: referral.date,
                notes: referral.notes,
                status,
            },
            {
                onSuccess: () => toast.success('Status referral diperbarui.'),
                onError: handleError,
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Referral', href: route('referrals.index') },
                { label: referral.student?.name ?? 'Detail' },
            ]}
        >
            <Head title={`Referral — ${referral.student?.name ?? ''}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('referrals.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                Referral — {referral.student?.name ?? '—'}
                            </h1>
                            <div className="mt-1">
                                <Badge variant={statusBadge(referral.status)}>
                                    {statusLabel(referral.status)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canWrite && (
                            <div className="w-36">
                                <Select
                                    value={referral.status}
                                    onValueChange={updateStatus}
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        )}
                        <a
                            href={route('referrals.pdf', referral.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="secondary" className="gap-1.5">
                                <FileText className="h-4 w-4" />
                                Cetak Surat Rujukan
                            </Button>
                        </a>
                        {canWrite && (
                            <Link href={route('referrals.edit', referral.id)}>
                                <Button>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Siswa
                        </p>
                        <div className="flex items-center gap-3">
                            {student_photo ? (
                                <img
                                    src={student_photo}
                                    alt={referral.student?.name}
                                    className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
                                />
                            ) : (
                                <div className="bg-primary-100 text-primary-700 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                                    {referral.student?.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">
                                    {referral.student?.name ?? '—'}
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {referral.student?.school_class?.name ?? 'Tanpa Kelas'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Detail Rujukan
                        </p>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Tanggal</span>
                                <span className="font-medium">{fmt(referral.date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Konselor</span>
                                <span className="font-medium">
                                    {referral.counselor?.name ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Dirujuk Ke</span>
                                <span className="max-w-[160px] truncate text-right font-medium">
                                    {referral.referred_to}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {referral.case_record && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Terkait Kasus
                        </p>
                        <p className="text-sm font-medium text-neutral-800">
                            {referral.case_record.title}
                        </p>
                    </div>
                )}

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                        Alasan / Dasar Rujukan
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                        {referral.reason}
                    </p>
                </div>

                {referral.notes && (
                    <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Catatan Tambahan
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
                            {referral.notes}
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
