import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { ArrowLeft, X, Upload, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, Referral, CaseRecord } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface MediaItem {
    id: number;
    url: string;
    name: string;
}

const schema = z.object({
    referred_to: z.string().min(1, 'Tujuan rujukan wajib diisi').max(255),
    reason: z.string().min(1, 'Alasan wajib diisi'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    notes: z.string().optional(),
    status: z.enum(['aktif', 'diterima', 'ditolak', 'selesai']),
});
type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'diterima', label: 'Diterima' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'selesai', label: 'Selesai' },
];

interface Props extends PageProps {
    referral: Referral;
    cases: (CaseRecord & { student?: { name: string } })[];
    documentation: MediaItem[];
    agreement: MediaItem | null;
}

export default function ReferralsEdit({ referral, documentation, agreement }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);
    const [existingDocs, setExistingDocs] = useState<MediaItem[]>(documentation);
    const [deleteIds, setDeleteIds] = useState<number[]>([]);
    const [existingAgreement, setExistingAgreement] = useState<MediaItem | null>(agreement);
    const [deleteAgreement, setDeleteAgreement] = useState(false);
    const maxNew = Math.max(0, 2 - existingDocs.length);
    const [newPhotos, setNewPhotos] = useState<(File | null)[]>([null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
    const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const [agreementFile, setAgreementFile] = useState<File | null>(null);
    const agreementRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            referred_to: referral.referred_to ?? '',
            reason: referral.reason ?? '',
            date: referral.date?.slice(0, 10) ?? '',
            notes: referral.notes ?? '',
            status: referral.status ?? 'aktif',
        },
    });

    const handleRemoveExisting = (id: number) => {
        setExistingDocs((prev) => prev.filter((d) => d.id !== id));
        setDeleteIds((prev) => [...prev, id]);
    };

    const handlePhotoChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        const updated = [...newPhotos];
        updated[idx] = file;
        setNewPhotos(updated);
        const prev = [...previews];
        prev[idx] = URL.createObjectURL(file);
        setPreviews(prev);
    };

    const removeNewPhoto = (idx: number) => {
        const updated = [...newPhotos];
        updated[idx] = null;
        setNewPhotos(updated);
        const prev = [...previews];
        if (prev[idx]) URL.revokeObjectURL(prev[idx]!);
        prev[idx] = null;
        setPreviews(prev);
        if (fileRefs[idx].current) fileRefs[idx].current!.value = '';
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
        });
        fd.append('_method', 'PUT');
        deleteIds.forEach((id) => fd.append('delete_media_ids[]', String(id)));
        newPhotos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (deleteAgreement) fd.append('delete_agreement', '1');
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('referrals.update', referral.id), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Referral diperbarui.'),
            onError: (errs) => {
                handleError(errs);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Referral', href: route('referrals.index') },
                {
                    label: referral.student?.name ?? 'Detail',
                    href: route('referrals.show', referral.id),
                },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit Referral — ${referral.student?.name ?? ''}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('referrals.show', referral.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Edit Referral</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            {referral.student?.name ?? '—'} —{' '}
                            {referral.student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Rujukan
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="re-date">Tanggal</Label>
                                <Input id="re-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status')}
                                    onValueChange={(v) =>
                                        setValue('status', v as FormData['status'])
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="re-referred-to">Dirujuk Ke</Label>
                            <Input
                                id="re-referred-to"
                                placeholder="Nama lembaga / psikolog / puskesmas"
                                {...register('referred_to')}
                            />
                            <InputError message={errors.referred_to?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="re-reason">Alasan / Dasar Rujukan</Label>
                            <Textarea id="re-reason" rows={4} {...register('reason')} />
                            <InputError message={errors.reason?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="re-notes">Catatan Tambahan</Label>
                            <Textarea id="re-notes" rows={2} {...register('notes')} />
                        </div>
                    </div>

                    {/* Foto Dokumentasi */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Foto Dokumentasi
                        </h2>
                        <p className="text-xs text-neutral-400">
                            Maks. 2 foto (jpg/png/webp, maks 2 MB/foto)
                        </p>
                        {existingDocs.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {existingDocs.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative overflow-hidden rounded-xl ring-1 ring-neutral-200"
                                    >
                                        <img
                                            src={item.url}
                                            alt={item.name}
                                            className="h-36 w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExisting(item.id)}
                                            className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {maxNew > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: maxNew }).map((_, idx) => (
                                    <div key={idx}>
                                        {previews[idx] ? (
                                            <div className="relative overflow-hidden rounded-xl ring-1 ring-neutral-200">
                                                <img
                                                    src={previews[idx]!}
                                                    className="h-36 w-full object-cover"
                                                    alt=""
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewPhoto(idx)}
                                                    className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileRefs[idx].current?.click()}
                                                className="hover:border-primary-400 hover:text-primary-500 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400"
                                            >
                                                <Upload className="h-5 w-5" />
                                                <span className="text-xs">
                                                    Foto {existingDocs.length + idx + 1}
                                                </span>
                                            </button>
                                        )}
                                        <input
                                            ref={fileRefs[idx]}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handlePhotoChange(idx)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dokumen Kesepakatan */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Dokumen Kesepakatan
                        </h2>
                        <p className="text-xs text-neutral-400">PDF, maks. 5 MB</p>
                        {existingAgreement && !deleteAgreement ? (
                            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                                    <span className="max-w-xs truncate text-sm font-medium text-blue-800">
                                        {existingAgreement.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={existingAgreement.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="gap-1.5 text-xs"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Buka
                                        </Button>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteAgreement(true)}
                                        className="rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {agreementFile ? (
                                    <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                                            <span className="max-w-xs truncate text-sm font-medium text-blue-800">
                                                {agreementFile.name}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAgreementFile(null);
                                                setDeleteAgreement(false);
                                                if (agreementRef.current)
                                                    agreementRef.current.value = '';
                                            }}
                                            className="rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => agreementRef.current?.click()}
                                        className="hover:border-primary-400 hover:text-primary-500 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-6 text-neutral-400"
                                    >
                                        <Upload className="h-5 w-5" />
                                        <span className="text-xs">
                                            {deleteAgreement
                                                ? 'Upload pengganti (opsional)'
                                                : 'Klik untuk upload PDF kesepakatan'}
                                        </span>
                                    </button>
                                )}
                            </>
                        )}
                        <input
                            ref={agreementRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => setAgreementFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={route('referrals.show', referral.id)}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
