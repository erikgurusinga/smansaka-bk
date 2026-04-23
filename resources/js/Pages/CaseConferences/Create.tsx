import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, CaseRecord, AcademicYear } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const participantSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    role: z.string().min(1, 'Jabatan/peran wajib diisi'),
});

const schema = z.object({
    case_id: z.string().optional(),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    participants: z.array(participantSchema).optional(),
    notes: z.string().optional(),
    outcome: z.string().optional(),
    status: z.enum(['dijadwalkan', 'selesai']),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    cases: (CaseRecord & { student?: { name: string } })[];
    academic_year: AcademicYear | null;
}

export default function CaseConferencesCreate({ cases, academic_year }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);
    const [participants, setParticipants] = useState<{ name: string; role: string }[]>([
        { name: '', role: '' },
    ]);

    // Photo upload
    const [photos, setPhotos] = useState<(File | null)[]>([null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
    const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    // Agreement PDF
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
            case_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            topic: '',
            notes: '',
            outcome: '',
            status: 'dijadwalkan',
        },
    });

    const caseOptions = [
        { value: '', label: '— Tidak terkait kasus —' },
        ...cases.map((c) => ({
            value: String(c.id),
            label: `${c.title} (${c.student?.name ?? '—'})`,
        })),
    ];

    const addParticipant = () => {
        setParticipants((p) => [...p, { name: '', role: '' }]);
    };

    const removeParticipant = (i: number) => {
        setParticipants((p) => p.filter((_, idx) => idx !== i));
    };

    const updateParticipant = (i: number, field: 'name' | 'role', value: string) => {
        setParticipants((p) =>
            p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
        );
    };

    const handlePhotoChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        const up = [...photos];
        up[idx] = file;
        setPhotos(up);
        const pp = [...previews];
        pp[idx] = URL.createObjectURL(file);
        setPreviews(pp);
    };

    const removePhoto = (idx: number) => {
        const up = [...photos];
        up[idx] = null;
        setPhotos(up);
        const pp = [...previews];
        if (pp[idx]) URL.revokeObjectURL(pp[idx]!);
        pp[idx] = null;
        setPreviews(pp);
        if (fileRefs[idx].current) fileRefs[idx].current!.value = '';
    };

    const onSubmit = (data: FormData) => {
        const validParticipants = participants.filter((p) => p.name && p.role);
        setProcessing(true);
        const fd = new window.FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
        });
        validParticipants.forEach((p, i) => {
            fd.append(`participants[${i}][name]`, p.name);
            fd.append(`participants[${i}][role]`, p.role);
        });
        photos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('case-conferences.store'), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Konferensi kasus dicatat.'),
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
                { label: 'Buat Konferensi' },
            ]}
        >
            <Head title="Buat Konferensi Kasus" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('case-conferences.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Buat Konferensi Kasus
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Rapat multi-pihak dengan notulen
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Konferensi
                        </h2>

                        <div className="space-y-1.5">
                            <Label>Terkait Kasus (opsional)</Label>
                            <Select
                                value={watch('case_id') ?? ''}
                                onValueChange={(v) => setValue('case_id', v)}
                                options={caseOptions}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cc-date">Tanggal</Label>
                                <Input id="cc-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status') ?? 'dijadwalkan'}
                                    onValueChange={(v) =>
                                        setValue('status', v as 'dijadwalkan' | 'selesai')
                                    }
                                    options={[
                                        { value: 'dijadwalkan', label: 'Dijadwalkan' },
                                        { value: 'selesai', label: 'Selesai' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cc-topic">Topik / Agenda</Label>
                            <Input
                                id="cc-topic"
                                placeholder="Contoh: Penanganan kasus bullying XI-A"
                                {...register('topic')}
                            />
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
                                className="h-7 gap-1 text-xs"
                            >
                                <Plus className="h-3 w-3" />
                                Tambah
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {participants.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
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
                                    <button
                                        type="button"
                                        onClick={() => removeParticipant(i)}
                                        disabled={participants.length === 1}
                                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Notulen
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="cc-notes">Catatan Rapat</Label>
                            <Textarea
                                id="cc-notes"
                                rows={4}
                                placeholder="Isi pembahasan, pendapat pihak-pihak yang hadir..."
                                {...register('notes')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cc-outcome">Hasil / Keputusan</Label>
                            <Textarea
                                id="cc-outcome"
                                rows={3}
                                placeholder="Keputusan yang disepakati bersama..."
                                {...register('outcome')}
                            />
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
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1].map((idx) => (
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
                                                onClick={() => removePhoto(idx)}
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
                                            <span className="text-xs">Foto {idx + 1}</span>
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
                    </div>

                    {/* Dokumen Kesepakatan */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Dokumen Kesepakatan
                        </h2>
                        <p className="text-xs text-neutral-400">PDF, maks. 5 MB</p>
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
                                        if (agreementRef.current) agreementRef.current.value = '';
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
                                <span className="text-xs">Klik untuk upload PDF kesepakatan</span>
                            </button>
                        )}
                        <input
                            ref={agreementRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => setAgreementFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <input type="hidden" {...register('academic_year_id')} />

                    <div className="flex justify-end gap-3">
                        <Link href={route('case-conferences.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Konferensi'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
