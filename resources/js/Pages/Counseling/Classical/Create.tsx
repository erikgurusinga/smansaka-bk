import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { ArrowLeft, X, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, SchoolClass, AcademicYear } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    class_id: z.string().min(1, 'Kelas wajib dipilih'),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    method: z.string().max(100).optional(),
    duration_minutes: z.coerce.number().int().min(1).max(480).optional().or(z.literal('')),
    description: z.string().optional(),
    evaluation: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: SchoolClass[];
    academic_year: AcademicYear | null;
}

export default function ClassicalGuidanceCreate({ classes, academic_year, permissions }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);
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
            class_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: '',
            topic: '',
            method: '',
            duration_minutes: '',
            description: '',
            evaluation: '',
        },
    });

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

    const removePhoto = (idx: number) => {
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
        newPhotos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('counseling.classical.store'), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Bimbingan klasikal dicatat.'),
            onError: (errs) => {
                handleError(errs);
                setProcessing(false);
            },
        });
    };

    const classOptions = classes.map((c) => ({ value: String(c.id), label: `${c.name}` }));

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Bimbingan Klasikal', href: route('counseling.classical.index') },
                { label: 'Tambah' },
            ]}
        >
            <Head title="Tambah Bimbingan Klasikal" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('counseling.classical.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        Tambah Bimbingan Klasikal
                    </h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Bimbingan
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Kelas</Label>
                                <Select
                                    value={watch('class_id')}
                                    onValueChange={(v) => setValue('class_id', v)}
                                    options={classOptions}
                                    placeholder="Pilih kelas"
                                />
                                <InputError message={errors.class_id?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-date">Tanggal</Label>
                                <Input id="cg-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-dur">Durasi (menit)</Label>
                                <Input
                                    id="cg-dur"
                                    type="number"
                                    min={1}
                                    max={480}
                                    {...register('duration_minutes')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-method">Metode</Label>
                                <Input
                                    id="cg-method"
                                    placeholder="Ceramah, diskusi, dll."
                                    {...register('method')}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cg-topic">Topik / Tema</Label>
                            <Input id="cg-topic" {...register('topic')} />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Catatan
                        </h2>
                        <div className="space-y-1.5">
                            <Label htmlFor="cg-desc">Uraian / Materi</Label>
                            <Textarea id="cg-desc" rows={3} {...register('description')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cg-eval">Evaluasi</Label>
                            <Textarea id="cg-eval" rows={2} {...register('evaluation')} />
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

                    <div className="flex justify-end gap-3">
                        <Link href={route('counseling.classical.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
