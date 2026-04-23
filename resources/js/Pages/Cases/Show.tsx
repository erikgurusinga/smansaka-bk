import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Lock, Unlock, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, CaseRecord } from '@/types';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface Props extends PageProps {
    case: CaseRecord;
    student_photo: string | null;
}

const statusBadge = (s: string): 'info' | 'warning' | 'success' | 'danger' => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
        baru: 'info',
        penanganan: 'warning',
        selesai: 'success',
        rujukan: 'danger',
    };
    return map[s] ?? 'info';
};

const categoryLabel = (c: string) =>
    ({
        akademik: 'Akademik',
        pribadi: 'Pribadi',
        sosial: 'Sosial',
        karier: 'Karier',
        pelanggaran: 'Pelanggaran',
    })[c] ?? c;

const statusLabel = (s: string) =>
    ({ baru: 'Baru', penanganan: 'Penanganan', selesai: 'Selesai', rujukan: 'Rujukan' })[s] ?? s;

const formatDate = (d: string | null, withTime = false) => {
    if (!d) return '—';
    return format(parseISO(d.slice(0, 10)), withTime ? 'd MMM yyyy HH:mm' : 'd MMM yyyy', {
        locale: idLocale,
    });
};

export default function CasesShow({ case: caseRecord, student_photo, permissions }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const canWrite = permissions['cases']?.write;

    const quickStatus = (newStatus: string) => {
        router.put(
            route('cases.update', caseRecord.id),
            {
                category: caseRecord.category,
                title: caseRecord.title,
                description: caseRecord.description,
                status: newStatus,
                is_confidential: caseRecord.is_confidential,
            },
            {
                onSuccess: () => toast.success('Status kasus diperbarui.'),
                onError: handleError,
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Kasus & Pelanggaran' },
                { label: 'Buku Kasus', href: route('cases.index') },
                { label: caseRecord.title },
            ]}
        >
            <Head title={caseRecord.title} />

            <div className="mx-auto max-w-3xl space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('cases.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                {caseRecord.title}
                            </h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={statusBadge(caseRecord.status)}>
                                    {statusLabel(caseRecord.status)}
                                </Badge>
                                {caseRecord.is_confidential ? (
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
                            {caseRecord.status !== 'selesai' && (
                                <Button
                                    variant="secondary"
                                    onClick={() => quickStatus('selesai')}
                                    className="gap-1.5 text-green-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Tandai Selesai
                                </Button>
                            )}
                            {caseRecord.status === 'baru' && (
                                <Button
                                    variant="secondary"
                                    onClick={() => quickStatus('penanganan')}
                                    className="gap-1.5"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Proses
                                </Button>
                            )}
                            <Link href={route('cases.edit', caseRecord.id)}>
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
                        <div className="flex items-center gap-3">
                            {student_photo ? (
                                <img
                                    src={student_photo}
                                    alt={caseRecord.student?.name}
                                    className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
                                />
                            ) : (
                                <div className="bg-primary-100 text-primary-700 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                                    {caseRecord.student?.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">
                                    {caseRecord.student?.name ?? '—'}
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {caseRecord.student?.school_class?.name ?? 'Tanpa Kelas'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Detail Kasus
                        </p>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Kategori</span>
                                <span className="font-medium">
                                    {categoryLabel(caseRecord.category)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Dicatat oleh</span>
                                <span className="font-medium">
                                    {caseRecord.reporter?.name ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Tanggal</span>
                                <span className="font-medium">
                                    {formatDate(caseRecord.created_at)}
                                </span>
                            </div>
                            {caseRecord.resolved_at && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Diselesaikan</span>
                                    <span className="font-medium text-green-700">
                                        {formatDate(caseRecord.resolved_at)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Uraian */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                        Uraian Kasus
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                        {caseRecord.description}
                    </p>
                </div>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
