import { Head, Link, router } from '@inertiajs/react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { PageProps, HomeVisit } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface MediaItem {
    id: number;
    url: string;
    name: string;
}

interface TeacherOption {
    id: number;
    name: string;
    is_bk: boolean;
}

const schema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    location: z.string().optional(),
    address: z.string().optional(),
    companions: z.array(z.object({ name: z.string().min(1), role: z.string().min(1) })).optional(),
    purpose: z.string().min(1, 'Tujuan kunjungan wajib diisi'),
    findings: z.string().optional(),
    action_plan: z.string().optional(),
    status: z.enum(['dijadwalkan', 'selesai']),
});
type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'selesai', label: 'Selesai' },
];

interface Props extends PageProps {
    visit: HomeVisit;
    documentation: MediaItem[];
    agreement: MediaItem | null;
    teachers: TeacherOption[];
}

export default function HomeVisitEdit({ visit, documentation, agreement, teachers }: Props) {
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
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            date: visit.date?.slice(0, 10) ?? '',
            location: visit.location ?? '',
            address: visit.address ?? '',
            companions: visit.companions ?? [],
            purpose: visit.purpose ?? '',
            findings: visit.findings ?? '',
            action_plan: visit.action_plan ?? '',
            status: visit.status ?? 'dijadwalkan',
        },
    });

    const {
        fields: companionFields,
        append: appendCompanion,
        remove: removeCompanion,
    } = useFieldArray({
        control,
        name: 'companions',
    });
    const [companionModes, setCompanionModes] = useState<('guru' | 'manual')[]>(
        () => visit.companions?.map(() => 'manual' as const) ?? [],
    );
    const setMode = (idx: number, mode: 'guru' | 'manual') =>
        setCompanionModes((prev) => {
            const n = [...prev];
            n[idx] = mode;
            return n;
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
        const fd = new window.FormData();
        const { companions, ...rest } = data;
        Object.entries(rest).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
        });
        fd.append('_method', 'PUT');
        (companions ?? []).forEach((c, i) => {
            fd.append(`companions[${i}][name]`, c.name);
            fd.append(`companions[${i}][role]`, c.role);
        });
        deleteIds.forEach((id) => fd.append('delete_media_ids[]', String(id)));
        newPhotos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (deleteAgreement) fd.append('delete_agreement', '1');
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('home-visits.update', visit.id), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Home visit diperbarui.'),
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
                { label: 'Home Visit', href: route('home-visits.index') },
                {
                    label: visit.student?.name ?? 'Detail',
                    href: route('home-visits.show', visit.id),
                },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit Home Visit — ${visit.student?.name ?? ''}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('home-visits.show', visit.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Edit Home Visit</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            {visit.student?.name ?? '—'} —{' '}
                            {visit.student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Kunjungan
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="hve-date">Tanggal</Label>
                                <Input id="hve-date" type="date" {...register('date')} />
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="hve-location">Tempat Dikunjungi</Label>
                                <Input
                                    id="hve-location"
                                    placeholder="Rumah siswa, kos, dll."
                                    {...register('location')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="hve-address">Alamat</Label>
                                <Input
                                    id="hve-address"
                                    placeholder="Jl. contoh No. 1, Desa, Kec."
                                    {...register('address')}
                                />
                            </div>
                        </div>
                        {/* Pendamping */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Pendamping</Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        appendCompanion({ name: '', role: 'Wali Kelas' });
                                        setCompanionModes((prev) => [...prev, 'guru']);
                                    }}
                                    className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah Pendamping
                                </button>
                            </div>
                            {companionFields.length === 0 && (
                                <p className="text-xs text-neutral-400">
                                    Belum ada pendamping. Klik &quot;+ Tambah&quot; untuk
                                    menambahkan.
                                </p>
                            )}
                            <div className="space-y-2">
                                {companionFields.map((field, idx) => {
                                    const mode = companionModes[idx] ?? 'manual';
                                    return (
                                        <div
                                            key={field.id}
                                            className="space-y-1.5 rounded-xl border border-neutral-100 bg-neutral-50 p-3"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMode(idx, 'guru');
                                                        setValue(`companions.${idx}.name`, '');
                                                    }}
                                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${mode === 'guru' ? 'bg-primary-600 border-primary-600 text-white' : 'hover:border-primary-300 border-neutral-200 bg-white text-neutral-500'}`}
                                                >
                                                    Pilih Guru
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMode(idx, 'manual');
                                                        setValue(`companions.${idx}.name`, '');
                                                    }}
                                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${mode === 'manual' ? 'bg-primary-600 border-primary-600 text-white' : 'hover:border-primary-300 border-neutral-200 bg-white text-neutral-500'}`}
                                                >
                                                    Input Manual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        removeCompanion(idx);
                                                        setCompanionModes((prev) =>
                                                            prev.filter((_, i) => i !== idx),
                                                        );
                                                    }}
                                                    className="ml-auto rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                {mode === 'guru' ? (
                                                    <select
                                                        value={
                                                            watch(`companions.${idx}.name`) ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            setValue(
                                                                `companions.${idx}.name`,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="focus:border-primary-400 focus:ring-primary-100 h-10 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:ring-2 focus:outline-none"
                                                    >
                                                        <option value="">— Pilih Guru —</option>
                                                        {teachers.map((t) => (
                                                            <option key={t.id} value={t.name}>
                                                                {t.name}
                                                                {t.is_bk ? ' (BK)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <Input
                                                        placeholder="Nama pendamping"
                                                        {...register(`companions.${idx}.name`)}
                                                        className="flex-1"
                                                    />
                                                )}
                                                <select
                                                    {...register(`companions.${idx}.role`)}
                                                    className="focus:border-primary-400 focus:ring-primary-100 h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:ring-2 focus:outline-none"
                                                >
                                                    <option value="Wali Kelas">Wali Kelas</option>
                                                    <option value="Guru Mata Pelajaran">
                                                        Guru Mata Pelajaran
                                                    </option>
                                                    <option value="Guru BK">Guru BK</option>
                                                    <option value="Lainnya">Lainnya</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="hve-purpose">Tujuan Kunjungan</Label>
                            <Textarea id="hve-purpose" rows={3} {...register('purpose')} />
                            <InputError message={errors.purpose?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="hve-findings">Temuan / Hasil Kunjungan</Label>
                            <Textarea id="hve-findings" rows={3} {...register('findings')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="hve-plan">Rencana Tindak Lanjut</Label>
                            <Textarea id="hve-plan" rows={2} {...register('action_plan')} />
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
                        <Link href={route('home-visits.show', visit.id)}>
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
