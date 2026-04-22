import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, FileText, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Label } from '@/Components/ui/Label';
import { PageProps, HomeVisit } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    visit: HomeVisit;
}

const fmt = (d: string) => format(new Date(d), 'd MMMM yyyy', { locale: idLocale });

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

export default function HomeVisitShow({ visit, permissions }: Props) {
    const canWrite = permissions['home_visit']?.write;

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
                onError: () => toast.error('Terjadi kesalahan.'),
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
                onError: () => toast.error('Terjadi kesalahan.'),
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
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Siswa
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                            {visit.student?.name ?? '—'}
                        </p>
                        <p className="text-sm text-neutral-500">
                            {visit.student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
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
                        </div>
                    </div>
                </div>

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
            </div>
        </AuthenticatedLayout>
    );
}
