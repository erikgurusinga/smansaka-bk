import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X, Upload, Search, FileText } from 'lucide-react';
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

interface LookupStudent {
    id: number;
    name: string;
    nis: string;
    school_class?: { name: string };
}

const schema = z.object({
    student_ids: z.array(z.number()).min(2, 'Minimal 2 siswa untuk konseling kelompok'),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
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
    classes: SchoolClass[];
    academic_year: AcademicYear | null;
}

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

export default function GroupCounselingCreate({ classes, academic_year }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);

    // Multi-student search
    const [query, setQuery] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [results, setResults] = useState<LookupStudent[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<LookupStudent[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            student_ids: [],
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: new Date().toLocaleDateString('sv-SE'),
            start_time: '',
            topic: '',
            description: '',
            outcome: '',
            next_plan: '',
            status: 'selesai',
            is_confidential: false,
        },
    });

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            const params = new URLSearchParams({ q: query });
            if (classFilter) params.set('class_id', classFilter);
            const res = await fetch(`/students/lookup?${params}`);
            const data = await res.json();
            setResults(
                (data as LookupStudent[]).filter(
                    (r) => !selectedStudents.find((s) => s.id === r.id),
                ),
            );
            setShowDropdown(true);
        }, 300);
    }, [query, classFilter]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const addStudent = (student: LookupStudent) => {
        const updated = [...selectedStudents, student];
        setSelectedStudents(updated);
        setValue(
            'student_ids',
            updated.map((s) => s.id),
        );
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    const removeStudent = (id: number) => {
        const updated = selectedStudents.filter((s) => s.id !== id);
        setSelectedStudents(updated);
        setValue(
            'student_ids',
            updated.map((s) => s.id),
        );
    };

    const handlePhotoChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        const updatedPhotos = [...photos];
        updatedPhotos[idx] = file;
        setPhotos(updatedPhotos);
        const updatedPrev = [...previews];
        updatedPrev[idx] = URL.createObjectURL(file);
        setPreviews(updatedPrev);
    };

    const removePhoto = (idx: number) => {
        const updatedPhotos = [...photos];
        updatedPhotos[idx] = null;
        setPhotos(updatedPhotos);
        const updatedPrev = [...previews];
        if (updatedPrev[idx]) URL.revokeObjectURL(updatedPrev[idx]!);
        updatedPrev[idx] = null;
        setPreviews(updatedPrev);
        if (fileRefs[idx].current) fileRefs[idx].current!.value = '';
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const fd = new FormData();
        data.student_ids.forEach((id) => fd.append('student_ids[]', String(id)));
        fd.append('academic_year_id', data.academic_year_id);
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
        photos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('counseling.group.store'), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Sesi konseling kelompok dicatat.'),
            onError: (errs) => {
                handleError(errs);
                setProcessing(false);
            },
        });
    };

    const classOptions = [
        { value: '', label: 'Semua Kelas' },
        ...classes.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Konseling Kelompok', href: route('counseling.group.index') },
                { label: 'Catat Sesi Baru' },
            ]}
        >
            <Head title="Catat Sesi Konseling Kelompok" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('counseling.group.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Catat Sesi Konseling Kelompok
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">Minimal 2 siswa per sesi</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Peserta */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Peserta Kelompok
                        </h2>

                        {selectedStudents.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedStudents.map((s) => (
                                    <span
                                        key={s.id}
                                        className="bg-primary-50 text-primary-700 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                                    >
                                        {s.name}
                                        <span className="text-primary-400 text-xs">
                                            {s.school_class?.name ?? ''}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeStudent(s.id)}
                                            className="text-primary-400 hover:text-primary-700"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            <Select
                                value={classFilter}
                                onValueChange={setClassFilter}
                                options={classOptions}
                                className="col-span-1"
                            />
                            <div className="relative col-span-2" ref={dropdownRef}>
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Cari nama atau NIS..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                                />
                                {showDropdown && results.length > 0 && (
                                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                                        {results.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onMouseDown={() => addStudent(s)}
                                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-800">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-xs text-neutral-400">
                                                        {s.nis} ·{' '}
                                                        {s.school_class?.name ?? 'Tanpa Kelas'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showDropdown && query.length >= 2 && results.length === 0 && (
                                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-400 shadow-lg">
                                        Tidak ada hasil.
                                    </div>
                                )}
                            </div>
                        </div>
                        <InputError message={errors.student_ids?.message} />
                        <p className="text-xs text-neutral-400">
                            {selectedStudents.length} siswa dipilih
                        </p>
                    </div>

                    {/* Detail Sesi */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Sesi
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-date">Tanggal</Label>
                                <Input id="cg-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-time">Jam Mulai</Label>
                                <Input id="cg-time" type="time" {...register('start_time')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-dur">Durasi (menit)</Label>
                                <Input
                                    id="cg-dur"
                                    type="number"
                                    min={1}
                                    max={480}
                                    placeholder="60"
                                    {...register('duration_minutes')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status') ?? 'selesai'}
                                    onValueChange={(v) =>
                                        setValue('status', v as FormData['status'])
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cg-topic">Topik / Tema Kelompok</Label>
                            <Input
                                id="cg-topic"
                                placeholder="Contoh: Manajemen stres menghadapi ujian"
                                {...register('topic')}
                            />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Catatan Sesi
                        </h2>
                        <div className="space-y-1.5">
                            <Label htmlFor="cg-desc">Latar Belakang / Uraian</Label>
                            <Textarea
                                id="cg-desc"
                                rows={3}
                                placeholder="Tujuan, dinamika kelompok, dan isu yang dibahas..."
                                {...register('description')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cg-outcome">Hasil / Kesimpulan</Label>
                            <Textarea
                                id="cg-outcome"
                                rows={3}
                                placeholder="Perkembangan dan hasil yang dicapai dalam sesi ini..."
                                {...register('outcome')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cg-plan">Rencana Tindak Lanjut</Label>
                            <Textarea
                                id="cg-plan"
                                rows={2}
                                placeholder="Langkah selanjutnya untuk kelompok..."
                                {...register('next_plan')}
                            />
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

                    {/* Rahasia */}
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

                    <input type="hidden" {...register('academic_year_id')} />

                    <div className="flex justify-end gap-3">
                        <Link href={route('counseling.group.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Sesi'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
