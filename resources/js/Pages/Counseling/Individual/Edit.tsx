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
import { PageProps, CounselingSession } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface MediaItem {
    id: number;
    url: string;
    name: string;
}

const schema = z.object({
    date: z.string().min(1),
    start_time: z.string().optional(),
    duration_minutes: z.coerce.number().int().min(1).max(480).optional().or(z.literal('')),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    description: z.string().optional(),
    outcome: z.string().optional(),
    next_plan: z.string().optional(),
    status: z.enum(['dijadwalkan', 'berlangsung', 'selesai', 'dibatalkan']),
    is_confidential: z.boolean(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    session: CounselingSession;
    documentation: MediaItem[];
    agreement: MediaItem | null;
}

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

export default function IndividualCounselingEdit({
    session: sesi,
    documentation,
    agreement,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);
    const [existingDocs, setExistingDocs] = useState<MediaItem[]>(documentation);
    const [deleteIds, setDeleteIds] = useState<number[]>([]);
    const [newPhotos, setNewPhotos] = useState<(File | null)[]>([null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
    const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const [existingAgreement, setExistingAgreement] = useState<MediaItem | null>(agreement);
    const [deleteAgreement, setDeleteAgreement] = useState(false);
    const [agreementFile, setAgreementFile] = useState<File | null>(null);
    const agreementRef = useRef<HTMLInputElement>(null);

    const maxNew = Math.max(0, 2 - existingDocs.length);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            date: sesi.date?.slice(0, 10) ?? '',
            start_time: sesi.start_time?.slice(0, 5) ?? '',
            duration_minutes: sesi.duration_minutes ?? '',
            topic: sesi.topic,
            description: sesi.description ?? '',
            outcome: sesi.outcome ?? '',
            next_plan: sesi.next_plan ?? '',
            status: sesi.status,
            is_confidential: sesi.is_confidential,
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

        fd.append('_method', 'PUT');
        fd.append('date', data.date);
        if (data.start_time) fd.append('start_time', data.start_time);
        if (data.duration_minutes !== '' && data.duration_minutes !== undefined)
            fd.append('duration_minutes', String(data.duration_minutes));
        fd.append('topic', data.topic);
        if (data.description) fd.append('description', data.description);
        if (data.outcome) fd.append('outcome', data.outcome);
        if (data.next_plan) fd.append('next_plan', data.next_plan);
        fd.append('status', data.status);
        fd.append('is_confidential', data.is_confidential ? '1' : '0');

        deleteIds.forEach((id) => fd.append('delete_media_ids[]', String(id)));

        newPhotos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));

        if (deleteAgreement) fd.append('delete_agreement', '1');
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('counseling.individual.update', sesi.id), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Sesi konseling diperbarui.'),
            onError: (errs) => {
                handleError(errs);
                setProcessing(false);
            },
        });
    };

    const student = sesi.students?.[0];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Konseling Individual', href: route('counseling.individual.index') },
                {
                    label: sesi?.topic ?? '…',
                    href: sesi?.id ? route('counseling.individual.show', sesi.id) : '#',
                },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit — ${sesi.topic}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link
                        href={
                            sesi?.id
                                ? route('counseling.individual.show', sesi.id)
                                : route('counseling.individual.index')
                        }
                    >
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Edit Sesi Konseling
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            {student?.name ?? '—'} — {student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Sesi
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ei-date">Tanggal</Label>
                                <Input id="ei-date" type="date" {...register('date')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ei-time">Jam Mulai</Label>
                                <Input id="ei-time" type="time" {...register('start_time')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ei-dur">Durasi (menit)</Label>
                                <Input
                                    id="ei-dur"
                                    type="number"
                                    min={1}
                                    max={480}
                                    {...register('duration_minutes')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status') ?? 'selesai'}
                                    onValueChange={(v) =>
                                        setValue(
                                            'status',
                                            v as
                                                | 'dijadwalkan'
                                                | 'berlangsung'
                                                | 'selesai'
                                                | 'dibatalkan',
                                        )
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-topic">Topik / Masalah</Label>
                            <Input id="ei-topic" {...register('topic')} />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Catatan Sesi
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-desc">Latar Belakang / Uraian Masalah</Label>
                            <Textarea id="ei-desc" rows={3} {...register('description')} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-outcome">Hasil / Kesimpulan</Label>
                            <Textarea id="ei-outcome" rows={3} {...register('outcome')} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-plan">Rencana Tindak Lanjut</Label>
                            <Textarea id="ei-plan" rows={2} {...register('next_plan')} />
                        </div>
                    </div>

                    {/* Dokumentasi */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Foto Dokumentasi
                        </h2>
                        <p className="text-xs text-neutral-400">
                            Maks. 2 foto (jpg/png/webp, maks 2 MB/foto)
                        </p>

                        {/* Foto existing */}
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
                                            title="Hapus foto"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <p className="truncate px-2 py-1 text-xs text-neutral-500">
                                            {item.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload foto baru */}
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

                        {existingDocs.length === 0 && maxNew === 0 && (
                            <p className="text-xs text-neutral-400">
                                Sudah 2 foto. Hapus salah satu untuk mengganti.
                            </p>
                        )}
                    </div>

                    {/* Dokumen Kesepakatan */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Dokumen Kesepakatan
                            </h2>
                            <span className="text-xs text-neutral-400">PDF · maks. 5 MB</span>
                        </div>
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

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <label className="flex items-start gap-3 text-sm text-neutral-700">
                            <input
                                type="checkbox"
                                {...register('is_confidential')}
                                className="mt-0.5 rounded"
                            />
                            <span>
                                <span className="font-medium">Rahasia</span>
                                <span className="mt-0.5 block text-xs text-neutral-500">
                                    Hanya terlihat oleh guru BK penangani dan Koordinator BK.
                                </span>
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link
                            href={
                                sesi?.id
                                    ? route('counseling.individual.show', sesi.id)
                                    : route('counseling.individual.index')
                            }
                        >
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
