import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { ArrowLeft, X, Upload, FileText, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, CaseConference, CaseRecord } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface MediaItem {
    id: number;
    url: string;
    name: string;
}

const schema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    notes: z.string().optional(),
    outcome: z.string().optional(),
    status: z.enum(['dijadwalkan', 'selesai']),
});
type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'selesai', label: 'Selesai' },
];

interface Props extends PageProps {
    conference: CaseConference;
    cases: (CaseRecord & { student?: { name: string } })[];
    documentation: MediaItem[];
    agreement: MediaItem | null;
}

export default function CaseConferencesEdit({ conference, documentation, agreement }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);
    const [participants, setParticipants] = useState<{ name: string; role: string }[]>(
        conference.participants && conference.participants.length > 0
            ? conference.participants
            : [{ name: '', role: '' }],
    );
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
            date: conference.date?.slice(0, 10) ?? '',
            topic: conference.topic ?? '',
            notes: conference.notes ?? '',
            outcome: conference.outcome ?? '',
            status: conference.status ?? 'dijadwalkan',
        },
    });

    const addParticipant = () => setParticipants((prev) => [...prev, { name: '', role: '' }]);
    const removeParticipant = (i: number) =>
        setParticipants((prev) => prev.filter((_, idx) => idx !== i));
    const updateParticipant = (i: number, field: 'name' | 'role', value: string) =>
        setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

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
        participants
            .filter((p) => p.name.trim())
            .forEach((p, i) => {
                fd.append(`participants[${i}][name]`, p.name);
                fd.append(`participants[${i}][role]`, p.role);
            });
        deleteIds.forEach((id) => fd.append('delete_media_ids[]', String(id)));
        newPhotos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (deleteAgreement) fd.append('delete_agreement', '1');
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('case-conferences.update', conference.id), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Konferensi kasus diperbarui.'),
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
                { label: 'Konferensi Kasus', href: route('case-conferences.index') },
                { label: conference.topic, href: route('case-conferences.show', conference.id) },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit — ${conference.topic}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('case-conferences.show', conference.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        Edit Konferensi Kasus
                    </h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Konferensi
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cce-date">Tanggal</Label>
                                <Input id="cce-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status')}
                                    onValueChange={(v) =>
                                        setValue('status', v as 'dijadwalkan' | 'selesai')
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cce-topic">Topik</Label>
                            <Input id="cce-topic" {...register('topic')} />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Peserta
                            </h2>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addParticipant}
                                className="gap-1.5 text-xs"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {participants.map((p, i) => (
                                <div key={i} className="flex gap-3">
                                    <Input
                                        placeholder="Nama"
                                        value={p.name}
                                        onChange={(e) =>
                                            updateParticipant(i, 'name', e.target.value)
                                        }
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Jabatan / Peran"
                                        value={p.role}
                                        onChange={(e) =>
                                            updateParticipant(i, 'role', e.target.value)
                                        }
                                        className="flex-1"
                                    />
                                    {participants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(i)}
                                            className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Notulen
                        </h2>
                        <div className="space-y-1.5">
                            <Label htmlFor="cce-notes">Catatan Rapat</Label>
                            <Textarea id="cce-notes" rows={4} {...register('notes')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cce-outcome">Hasil / Keputusan</Label>
                            <Textarea id="cce-outcome" rows={3} {...register('outcome')} />
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
                        <Link href={route('case-conferences.show', conference.id)}>
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
