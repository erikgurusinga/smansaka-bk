import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, AcademicYear } from '@/types';

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
    academic_year_id: z.string().min(1, 'Tahun ajaran wajib dipilih'),
    category: z.enum(['akademik', 'pribadi', 'sosial', 'karier', 'pelanggaran'], {
        required_error: 'Kategori wajib dipilih',
    }),
    title: z.string().min(1, 'Judul kasus wajib diisi').max(255),
    description: z.string().min(1, 'Uraian kasus wajib diisi'),
    is_confidential: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: SchoolClassOption[];
    academic_year: AcademicYear | null;
}

const CATEGORY_OPTIONS = [
    { value: 'akademik', label: 'Akademik' },
    { value: 'pribadi', label: 'Pribadi' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'karier', label: 'Karier' },
    { value: 'pelanggaran', label: 'Pelanggaran' },
];

export default function CasesCreate({ classes, academic_year }: Props) {
    const [processing, setProcessing] = useState(false);

    // Student combobox
    const [classFilter, setClassFilter] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
    const comboRef = useRef<HTMLDivElement>(null);

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
            category: 'akademik',
            title: '',
            description: '',
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

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(route('cases.store'), data, {
            onSuccess: () => toast.success('Kasus berhasil dicatat.'),
            onError: () => {
                toast.error('Terjadi kesalahan. Periksa kembali form.');
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Kasus & Pelanggaran' },
                { label: 'Buku Kasus', href: route('cases.index') },
                { label: 'Catat Kasus Baru' },
            ]}
        >
            <Head title="Catat Kasus Baru" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('cases.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Catat Kasus Baru</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Data kasus akan disimpan sebagai rahasia secara default
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Informasi Dasar
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
                                <Label>Kategori</Label>
                                <Select
                                    value={watch('category') ?? 'akademik'}
                                    onValueChange={(v) =>
                                        setValue(
                                            'category',
                                            v as
                                                | 'akademik'
                                                | 'pribadi'
                                                | 'sosial'
                                                | 'karier'
                                                | 'pelanggaran',
                                        )
                                    }
                                    options={CATEGORY_OPTIONS}
                                />
                                <InputError message={errors.category?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="c-ayid">Tahun Ajaran</Label>
                                <Input
                                    id="c-ayid"
                                    value={
                                        academic_year
                                            ? `${academic_year.year} ${academic_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`
                                            : '—'
                                    }
                                    readOnly
                                    className="bg-neutral-50 text-neutral-500"
                                />
                                <input type="hidden" {...register('academic_year_id')} />
                                <InputError message={errors.academic_year_id?.message} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="c-title">Judul Kasus</Label>
                            <Input
                                id="c-title"
                                placeholder="Contoh: Sering membolos pada jam pelajaran IPA"
                                {...register('title')}
                            />
                            <InputError message={errors.title?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="c-desc">Uraian Kasus</Label>
                            <Textarea
                                id="c-desc"
                                rows={5}
                                placeholder="Jelaskan kasus secara rinci: kronologi, faktor penyebab, pihak yang terlibat..."
                                {...register('description')}
                            />
                            <InputError message={errors.description?.message} />
                        </div>
                    </div>

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
                                    Catatan hanya dapat dilihat oleh guru BK penangani, Koordinator
                                    BK, dan Kepala Sekolah. Wali kelas tidak akan melihat isi
                                    catatan ini.
                                </span>
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={route('cases.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Kasus'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
