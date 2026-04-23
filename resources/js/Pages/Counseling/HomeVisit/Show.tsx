import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, FileText, RotateCcw, Pencil, Images, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Label } from '@/Components/ui/Label';
import { Lightbox } from '@/Components/ui/Lightbox';
import { PdfViewer } from '@/Components/ui/PdfViewer';
import { PageProps, HomeVisit } from '@/types';
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
    visit: HomeVisit;
    documentation: MediaItem[];
    agreement: MediaItem | null;
    student_photo: string | null;
}

const fmt = (d: string) => format(parseISO(d.slice(0, 10)), 'd MMMM yyyy', { locale: idLocale });

function SignatureDisplay({
    label,
    value,
    onUpdate,
    canWrite,
}: {
    label: string;
    value: string | null;
    onUpdate: (data: string | undefined) => void;
    canWrite: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (editing && canvasRef.current) {
            padRef.current = new SignaturePad(canvasRef.current, { penColor: '#1e293b' });
            padRef.current.addEventListener('endStroke', () => {
                onUpdate(padRef.current?.toDataURL());
            });
        }
    }, [editing]);

    if (!editing && value) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label>{label}</Label>
                    {canWrite && (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="text-primary-600 text-xs hover:underline"
                        >
                            Ubah
                        </button>
                    )}
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                    <img src={value} alt={label} className="h-24 w-full object-contain" />
                </div>
            </div>
        );
    }

    if (canWrite) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <button
                        type="button"
                        onClick={() => {
                            padRef.current?.clear();
                            onUpdate(undefined);
                        }}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Hapus
                    </button>
                </div>
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    className="w-full touch-none rounded-xl border border-neutral-200 bg-white"
                />
                <p className="text-xs text-neutral-400">Tanda tangan di atas</p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-center text-sm text-neutral-400">
                Belum ditandatangani
            </div>
        </div>
    );
}

export default function HomeVisitShow({
    visit,
    documentation,
    agreement,
    student_photo,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const canWrite = permissions['home_visit']?.write;
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [pdfOpen, setPdfOpen] = useState(false);

    const deleteAgreement = () => {
        if (!confirm('Hapus dokumen kesepakatan ini?')) return;
        router.post(
            route('home-visits.update', visit.id),
            {
                _method: 'PUT',
                date: visit.date,
                purpose: visit.purpose,
                status: visit.status,
                delete_agreement: '1',
            },
            {
                forceFormData: true,
                onSuccess: () => toast.success('Dokumen dihapus.'),
                onError: handleError,
            },
        );
    };

    const [signatures, setSignatures] = useState({
        signature_student: visit.signature_student,
        signature_parent: visit.signature_parent,
        signature_counselor: visit.signature_counselor,
    });

    const saveSignatures = () => {
        router.put(
            route('home-visits.update', visit.id),
            {
                date: visit.date,
                purpose: visit.purpose,
                findings: visit.findings,
                action_plan: visit.action_plan,
                status: visit.status,
                ...signatures,
            },
            {
                onSuccess: () => toast.success('Tanda tangan disimpan.'),
                onError: handleError,
            },
        );
    };

    const markSelesai = () => {
        router.put(
            route('home-visits.update', visit.id),
            {
                date: visit.date,
                purpose: visit.purpose,
                findings: visit.findings,
                action_plan: visit.action_plan,
                status: 'selesai',
                ...signatures,
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
                { label: 'Home Visit', href: route('home-visits.index') },
                { label: visit.student?.name ?? 'Detail' },
            ]}
        >
            <Head title={`Home Visit — ${visit.student?.name ?? ''}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('home-visits.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                Home Visit — {visit.student?.name ?? '—'}
                            </h1>
                            <div className="mt-1">
                                <Badge variant={visit.status === 'selesai' ? 'success' : 'info'}>
                                    {visit.status === 'selesai' ? 'Selesai' : 'Dijadwalkan'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canWrite && visit.status !== 'selesai' && (
                            <Button
                                variant="secondary"
                                onClick={markSelesai}
                                className="gap-1.5 text-green-700"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Tandai Selesai
                            </Button>
                        )}
                        <a
                            href={route('home-visits.pdf', visit.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="secondary" className="gap-1.5">
                                <FileText className="h-4 w-4" />
                                Cetak Berita Acara
                            </Button>
                        </a>
                        {canWrite && (
                            <Link href={route('home-visits.edit', visit.id)}>
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
                                    alt={visit.student?.name}
                                    className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
                                />
                            ) : (
                                <div className="bg-primary-100 text-primary-700 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                                    {visit.student?.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">
                                    {visit.student?.name ?? '—'}
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {visit.student?.school_class?.name ?? 'Tanpa Kelas'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Detail Kunjungan
                        </p>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Tanggal</span>
                                <span className="font-medium">{fmt(visit.date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Konselor</span>
                                <span className="font-medium">{visit.counselor?.name ?? '—'}</span>
                            </div>
                            {visit.location && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Tempat</span>
                                    <span className="max-w-[160px] truncate text-right font-medium">
                                        {visit.location}
                                    </span>
                                </div>
                            )}
                            {visit.address && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Alamat</span>
                                    <span className="max-w-[160px] truncate text-right font-medium">
                                        {visit.address}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {visit.companions && visit.companions.length > 0 && (
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Pendamping
                        </p>
                        <div className="space-y-1.5">
                            {visit.companions.map((c, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-neutral-800">{c.name}</span>
                                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                                        {c.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                        Tujuan Kunjungan
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                        {visit.purpose}
                    </p>
                </div>

                {visit.findings && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Temuan / Hasil Kunjungan
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                            {visit.findings}
                        </p>
                    </div>
                )}

                {visit.action_plan && (
                    <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Rencana Tindak Lanjut
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
                            {visit.action_plan}
                        </p>
                    </div>
                )}

                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Tanda Tangan
                        </h2>
                        {canWrite && (
                            <Button type="button" variant="secondary" onClick={saveSignatures}>
                                Simpan Tanda Tangan
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <SignatureDisplay
                            label="Siswa"
                            value={signatures.signature_student}
                            onUpdate={(v) =>
                                setSignatures((s) => ({ ...s, signature_student: v ?? null }))
                            }
                            canWrite={!!canWrite}
                        />
                        <SignatureDisplay
                            label="Orang Tua / Wali"
                            value={signatures.signature_parent}
                            onUpdate={(v) =>
                                setSignatures((s) => ({ ...s, signature_parent: v ?? null }))
                            }
                            canWrite={!!canWrite}
                        />
                        <SignatureDisplay
                            label="Guru BK"
                            value={signatures.signature_counselor}
                            onUpdate={(v) =>
                                setSignatures((s) => ({ ...s, signature_counselor: v ?? null }))
                            }
                            canWrite={!!canWrite}
                        />
                    </div>
                </div>
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
