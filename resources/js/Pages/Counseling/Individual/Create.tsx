import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, X, ImageIcon, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, AcademicYear } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface SchoolClassOption {
    id: number;
    name: string;
    level: string;
}

interface StudentResult {
    id: number;
    nis: string;
    name: string;
    gender: string;
    status: string;
    class_name: string | null;
    photo_url: string;
}

const schema = z.object({
    student_id: z.string().min(1, 'Siswa wajib dipilih'),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    start_time: z.string().optional(),
    duration_minutes: z.coerce.number().int().min(1).max(480).optional().or(z.literal('')),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    description: z.string().optional(),
    outcome: z.string().optional(),
    next_plan: z.string().optional(),
    status: z.enum(['dijadwalkan', 'berlangsung', 'selesai', 'dibatalkan']),
    is_confidential: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: SchoolClassOption[];
    academic_year: AcademicYear | null;
}

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export default function IndividualCounselingCreate({ classes, academic_year }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);

    // Student combobox state
    const [classFilter, setClassFilter] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
    const comboRef = useRef<HTMLDivElement>(null);

    // Photo state — maks 2 foto
    const [photos, setPhotos] = useState<(File | null)[]>([null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
    const [photoErrors, setPhotoErrors] = useState<string[]>(['', '']);
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
            student_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            start_time: '',
            topic: '',
            description: '',
            outcome: '',
            next_plan: '',
            status: 'selesai',
            is_confidential: true,
        },
    });

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced lookup
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        const timer = setTimeout(async () => {
            const params = new URLSearchParams({ q: query });
            if (classFilter) params.set('class_id', classFilter);
            const res = await fetch(`/students/lookup?${params}`);
            const data: StudentResult[] = await res.json();
            setResults(data);
            setShowDropdown(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, classFilter]);

    const selectStudent = (s: StudentResult) => {
        setSelectedStudent(s);
        setValue('student_id', String(s.id));
        setQuery('');
        setShowDropdown(false);
    };

    const clearStudent = () => {
        setSelectedStudent(null);
        setValue('student_id', '');
        setQuery('');
    };

    const classOptions = [
        { value: '', label: 'Semua Kelas' },
        ...classes.map((c) => ({ value: String(c.id), label: `${c.level} – ${c.name}` })),
    ];

    const handlePhotoChange = (idx: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_PHOTO_BYTES) {
            setPhotoErrors((prev) => {
                const n = [...prev];
                n[idx] = 'Ukuran foto maksimal 2 MB.';
                return n;
            });
            e.target.value = '';
            return;
        }
        setPhotoErrors((prev) => {
            const n = [...prev];
            n[idx] = '';
            return n;
        });
        setPhotos((prev) => {
            const n = [...prev];
            n[idx] = file;
            return n;
        });
        setPreviews((prev) => {
            const n = [...prev];
            n[idx] = URL.createObjectURL(file);
            return n;
        });
    };

    const removePhoto = (idx: 0 | 1) => {
        setPhotos((prev) => {
            const n = [...prev];
            n[idx] = null;
            return n;
        });
        setPreviews((prev) => {
            const n = [...prev];
            n[idx] = null;
            return n;
        });
        setPhotoErrors((prev) => {
            const n = [...prev];
            n[idx] = '';
            return n;
        });
        const ref = fileRefs[idx];
        if (ref.current) ref.current.value = '';
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const payload: Record<string, unknown> = { ...data };
        const files = photos.filter(Boolean) as File[];
        if (files.length > 0) payload['documentation'] = files;
        if (agreementFile) payload['agreement'] = agreementFile;

        router.post(route('counseling.individual.store'), payload, {
            forceFormData: true,
            onSuccess: () => toast.success('Sesi konseling dicatat.'),
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
                { label: 'Konseling Individual', href: route('counseling.individual.index') },
                { label: 'Catat Sesi Baru' },
            ]}
        >
            <Head title="Catat Sesi Konseling Individual" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('counseling.individual.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Catat Sesi Konseling Individual
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Catatan bersifat rahasia secara default
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Identitas Sesi */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Identitas Sesi
                        </h2>

                        {/* Student search */}
                        <div className="space-y-1.5">
                            <Label>Siswa</Label>

                            {selectedStudent ? (
                                <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                                    {selectedStudent.photo_url ? (
                                        <img
                                            src={selectedStudent.photo_url}
                                            alt=""
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="bg-primary-100 text-primary-700 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                                            {selectedStudent.name[0]}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-neutral-900">
                                            {selectedStudent.name}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {selectedStudent.nis}
                                            {selectedStudent.class_name &&
                                                ` · ${selectedStudent.class_name}`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearStudent}
                                        className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div ref={comboRef} className="space-y-2">
                                    {/* Class filter + search input row */}
                                    <div className="flex gap-2">
                                        <Select
                                            value={classFilter}
                                            onValueChange={(v) => {
                                                setClassFilter(v);
                                                setResults([]);
                                                setShowDropdown(false);
                                            }}
                                            options={classOptions}
                                            className="w-44 shrink-0"
                                        />
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                            <Input
                                                placeholder="Ketik nama atau NIS..."
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                onFocus={() =>
                                                    results.length > 0 && setShowDropdown(true)
                                                }
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Results dropdown */}
                                    {showDropdown && (
                                        <div className="rounded-xl border border-neutral-200 bg-white shadow-lg">
                                            {results.length === 0 ? (
                                                <p className="px-4 py-3 text-sm text-neutral-500">
                                                    Siswa tidak ditemukan.
                                                </p>
                                            ) : (
                                                <ul className="max-h-56 divide-y divide-neutral-50 overflow-y-auto">
                                                    {results.map((s) => (
                                                        <li key={s.id}>
                                                            <button
                                                                type="button"
                                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
                                                                onClick={() => selectStudent(s)}
                                                            >
                                                                {s.photo_url ? (
                                                                    <img
                                                                        src={s.photo_url}
                                                                        alt=""
                                                                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="bg-primary-100 text-primary-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                                        {s.name[0]}
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-neutral-900">
                                                                        {s.name}
                                                                    </p>
                                                                    <p className="text-xs text-neutral-500">
                                                                        {s.nis}
                                                                        {s.class_name &&
                                                                            ` · ${s.class_name}`}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <InputError message={errors.student_id?.message} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ci-date">Tanggal</Label>
                                <Input id="ci-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ci-time">Jam Mulai</Label>
                                <Input id="ci-time" type="time" {...register('start_time')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ci-dur">Durasi (menit)</Label>
                                <Input
                                    id="ci-dur"
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
                            <Label htmlFor="ci-topic">Topik / Masalah</Label>
                            <Input
                                id="ci-topic"
                                placeholder="Contoh: Kesulitan belajar matematika"
                                {...register('topic')}
                            />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    {/* Catatan Sesi */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Catatan Sesi
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="ci-desc">Latar Belakang / Uraian Masalah</Label>
                            <Textarea
                                id="ci-desc"
                                rows={3}
                                placeholder="Kronologi dan uraian masalah yang disampaikan siswa..."
                                {...register('description')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ci-outcome">Hasil / Kesimpulan Konseling</Label>
                            <Textarea
                                id="ci-outcome"
                                rows={3}
                                placeholder="Perkembangan, keputusan, dan hasil yang dicapai dalam sesi ini..."
                                {...register('outcome')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ci-plan">Rencana Tindak Lanjut (RTL)</Label>
                            <Textarea
                                id="ci-plan"
                                rows={2}
                                placeholder="Langkah selanjutnya, jadwal sesi berikutnya, tugas untuk siswa..."
                                {...register('next_plan')}
                            />
                        </div>
                    </div>

                    {/* Dokumentasi */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Dokumentasi
                            </h2>
                            <span className="text-xs text-neutral-400">
                                Maks 2 foto · JPG, PNG, WEBP · 2 MB
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {([0, 1] as const).map((idx) => (
                                <div key={idx}>
                                    {previews[idx] ? (
                                        <div className="relative">
                                            <img
                                                src={previews[idx]!}
                                                alt={`Foto ${idx + 1}`}
                                                className="h-40 w-full rounded-xl object-cover ring-1 ring-neutral-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <p className="mt-1 truncate text-xs text-neutral-400">
                                                {photos[idx]?.name}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileRefs[idx].current?.click()}
                                            className="hover:border-primary-300 hover:text-primary-500 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400 transition"
                                        >
                                            <ImageIcon className="h-6 w-6" />
                                            <span className="text-xs font-medium">
                                                Foto {idx + 1}
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
                                    {photoErrors[idx] && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {photoErrors[idx]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dokumen Kesepakatan */}
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Dokumen Kesepakatan
                            </h2>
                            <span className="text-xs text-neutral-400">PDF · maks. 5 MB</span>
                        </div>
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
                                    className="rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
                                >
                                    <X className="h-3.5 w-3.5" />
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

                    {/* Kerahasiaan */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="mb-4 text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Kerahasiaan
                        </h2>
                        <label className="flex items-start gap-3 text-sm text-neutral-700">
                            <input
                                type="checkbox"
                                {...register('is_confidential')}
                                className="mt-0.5 rounded"
                            />
                            <span>
                                <span className="font-medium">Rahasia</span>
                                <span className="mt-0.5 block text-xs text-neutral-500">
                                    Catatan hanya terlihat oleh guru BK penangani dan Koordinator
                                    BK.
                                </span>
                            </span>
                        </label>
                        <input type="hidden" {...register('academic_year_id')} />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={route('counseling.individual.index')}>
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
