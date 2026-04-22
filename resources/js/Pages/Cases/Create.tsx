import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, Student, AcademicYear } from '@/types';

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
    students: Student[];
    academic_year: AcademicYear | null;
}

const CATEGORY_OPTIONS = [
    { value: 'akademik', label: 'Akademik' },
    { value: 'pribadi', label: 'Pribadi' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'karier', label: 'Karier' },
    { value: 'pelanggaran', label: 'Pelanggaran' },
];

export default function CasesCreate({ students, academic_year }: Props) {
    const [processing, setProcessing] = useState(false);

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

    const studentOptions = [
        { value: '', label: '— Pilih Siswa —' },
        ...students.map((s) => ({ value: String(s.id), label: `${s.name} (${s.nis})` })),
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

                        <div className="space-y-1.5">
                            <Label>Siswa</Label>
                            <Select
                                value={watch('student_id') ?? ''}
                                onValueChange={(v) => setValue('student_id', v)}
                                options={studentOptions}
                            />
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
