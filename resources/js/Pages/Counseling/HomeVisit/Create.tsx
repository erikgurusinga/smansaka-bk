import { Head, Link, router } from '@inertiajs/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Upload, X, FileText, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from 'signature_pad';
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

interface TeacherOption {
    id: number;
    name: string;
    is_bk: boolean;
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
    location: z.string().optional(),
    address: z.string().optional(),
    companions: z.array(z.object({ name: z.string().min(1), role: z.string().min(1) })).optional(),
    purpose: z.string().min(1, 'Tujuan kunjungan wajib diisi'),
    findings: z.string().optional(),
    action_plan: z.string().optional(),
    signature_student: z.string().optional(),
    signature_parent: z.string().optional(),
    signature_counselor: z.string().optional(),
    status: z.enum(['dijadwalkan', 'selesai']),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: SchoolClassOption[];
    academic_year: AcademicYear | null;
    teachers: TeacherOption[];
}

function SignatureField({
    label,
    onSave,
}: {
    label: string;
    onSave: (data: string | undefined) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            padRef.current = new SignaturePad(canvasRef.current, { penColor: '#1e293b' });
            padRef.current.addEventListener('endStroke', () => {
                onSave(padRef.current?.toDataURL());
            });
        }
    }, []);

    const clear = () => {
        padRef.current?.clear();
        onSave(undefined);
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <button
                    type="button"
                    onClick={clear}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
                >
                    <RotateCcw className="h-3 w-3" />
                    Hapus
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full touch-none rounded-xl border border-neutral-200 bg-white"
            />
            <p className="text-xs text-neutral-400">Tanda tangan di atas</p>
        </div>
    );
}

export default function HomeVisitCreate({ classes, academic_year, teachers }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [processing, setProcessing] = useState(false);

    // Student combobox
    const [classFilter, setClassFilter] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
    const comboRef = useRef<HTMLDivElement>(null);

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
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            student_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            address: '',
            companions: [],
            purpose: '',
            findings: '',
            action_plan: '',
            status: 'dijadwalkan',
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
    const [companionModes, setCompanionModes] = useState<('guru' | 'manual')[]>([]);
    const setMode = (idx: number, mode: 'guru' | 'manual') =>
        setCompanionModes((prev) => {
            const n = [...prev];
            n[idx] = mode;
            return n;
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
        setProcessing(true);
        const fd = new window.FormData();
        const { companions, ...rest } = data;
        Object.entries(rest).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
        });
        (companions ?? []).forEach((c, i) => {
            fd.append(`companions[${i}][name]`, c.name);
            fd.append(`companions[${i}][role]`, c.role);
        });
        photos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('home-visits.store'), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Home visit dicatat.'),
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
                { label: 'Catat Kunjungan' },
            ]}
        >
            <Head title="Catat Home Visit" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('home-visits.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Catat Home Visit</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Kunjungan rumah + berita acara digital
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Identitas Kunjungan
                        </h2>

                        {/* Student combobox */}
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
                                <Label htmlFor="hv-date">Tanggal Kunjungan</Label>
                                <Input id="hv-date" type="date" {...register('date')} />
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="hv-location">Tempat Dikunjungi</Label>
                                <Input
                                    id="hv-location"
                                    placeholder="Rumah siswa, kos, dll."
                                    {...register('location')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="hv-address">Alamat</Label>
                                <Input
                                    id="hv-address"
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
                                    const mode = companionModes[idx] ?? 'guru';
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
                            <Label htmlFor="hv-purpose">Tujuan Kunjungan</Label>
                            <Textarea
                                id="hv-purpose"
                                rows={2}
                                placeholder="Tujuan dilakukannya home visit..."
                                {...register('purpose')}
                            />
                            <InputError message={errors.purpose?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Hasil Kunjungan
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="hv-findings">Temuan / Hasil Kunjungan</Label>
                            <Textarea
                                id="hv-findings"
                                rows={3}
                                placeholder="Kondisi di rumah, informasi dari orang tua..."
                                {...register('findings')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="hv-plan">Rencana Tindak Lanjut</Label>
                            <Textarea
                                id="hv-plan"
                                rows={2}
                                placeholder="Langkah selanjutnya setelah home visit..."
                                {...register('action_plan')}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Tanda Tangan
                        </h2>
                        <p className="text-xs text-neutral-500">
                            Tanda tangan digital untuk berita acara. Dapat diisi setelah kunjungan
                            selesai.
                        </p>
                        <div className="grid gap-6">
                            <SignatureField
                                label="Tanda Tangan Siswa"
                                onSave={(v) => setValue('signature_student', v)}
                            />
                            <SignatureField
                                label="Tanda Tangan Orang Tua / Wali"
                                onSave={(v) => setValue('signature_parent', v)}
                            />
                            <SignatureField
                                label="Tanda Tangan Guru BK"
                                onSave={(v) => setValue('signature_counselor', v)}
                            />
                        </div>
                    </div>

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
                        <Link href={route('home-visits.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Kunjungan'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
