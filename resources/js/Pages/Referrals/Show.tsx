import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Select } from '@/Components/ui/Select';
import { PageProps, Referral } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    referral: Referral;
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

const fmt = (d: string) => format(new Date(d), 'd MMMM yyyy', { locale: idLocale });

const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'diterima', label: 'Diterima' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'selesai', label: 'Selesai' },
];

export default function ReferralsShow({ referral, permissions }: Props) {
    const canWrite = permissions['referrals']?.write;

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
                onError: () => toast.error('Terjadi kesalahan.'),
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
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Siswa
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                            {referral.student?.name ?? '—'}
                        </p>
                        <p className="text-sm text-neutral-500">
                            {referral.student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
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
            </div>
        </AuthenticatedLayout>
    );
}
