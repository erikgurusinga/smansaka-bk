import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, X, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, CaseRecord, AcademicYear } from '@/types';

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
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    student_id: z.string().min(1, 'Siswa wajib dipilih'),
    case_id: z.string().optional(),
    academic_year_id: z.string().min(1),
    referred_to: z.string().min(1, 'Tujuan rujukan wajib diisi').max(255),
    reason: z.string().min(1, 'Alasan wajib diisi'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    notes: z.string().optional(),
    status: z.enum(['aktif', 'diterima', 'ditolak', 'selesai']),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: SchoolClassOption[];
    cases: (CaseRecord & { student?: { name: string } })[];
    academic_year: AcademicYear | null;
}

const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'diterima', label: 'Diterima' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'selesai', label: 'Selesai' },
];

export default function ReferralsCreate({ classes, cases, academic_year }: Props) {
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
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            student_id: '',
            case_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            referred_to: '',
            reason: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            status: 'aktif',
        },
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node))
                setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
            setResults(await res.json());
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

    const caseOptions = [
        { value: '', label: '— Tidak terkait kasus —' },
        ...cases.map((c) => ({
            value: String(c.id),
            label: `${c.title} (${c.student?.name ?? '—'})`,
        })),
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
        Object.entries(data).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
        });
        photos.filter(Boolean).forEach((f) => fd.append('documentation[]', f!));
        if (agreementFile) fd.append('agreement', agreementFile);

        router.post(route('referrals.store'), fd, {
            forceFormData: true,
            onSuccess: () => toast.success('Referral dicatat.'),
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
                { label: 'Buat Referral' },
            ]}
        >
            <Head title="Buat Referral" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('referrals.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Buat Referral</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Rujukan ke psikolog, puskesmas, atau dinas
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Identitas Referral
                        </h2>

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
                                                                onClick={() => selectStudent(s)}
                                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
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
                                <Label htmlFor="ref-date">Tanggal Rujukan</Label>
                                <Input id="ref-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status') ?? 'aktif'}
                                    onValueChange={(v) =>
                                        setValue(
                                            'status',
                                            v as 'aktif' | 'diterima' | 'ditolak' | 'selesai',
                                        )
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ref-to">Dirujuk Ke</Label>
                            <Input
                                id="ref-to"
                                placeholder="Contoh: Psikolog Puskesmas Kabanjahe"
                                {...register('referred_to')}
                            />
                            <InputError message={errors.referred_to?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Rujukan
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="ref-reason">Alasan / Dasar Rujukan</Label>
                            <Textarea
                                id="ref-reason"
                                rows={3}
                                placeholder="Kondisi siswa yang melatarbelakangi keputusan rujukan..."
                                {...register('reason')}
                            />
                            <InputError message={errors.reason?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ref-notes">Catatan Tambahan</Label>
                            <Textarea
                                id="ref-notes"
                                rows={2}
                                placeholder="Hal-hal khusus yang perlu diketahui penerima rujukan..."
                                {...register('notes')}
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
                        <Link href={route('referrals.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Referral'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
