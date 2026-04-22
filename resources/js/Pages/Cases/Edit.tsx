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
import { PageProps, CaseRecord, Student, AcademicYear } from '@/types';

const schema = z.object({
    category: z.enum(['akademik', 'pribadi', 'sosial', 'karier', 'pelanggaran']),
    title: z.string().min(1, 'Judul wajib diisi').max(255),
    description: z.string().min(1, 'Uraian wajib diisi'),
    status: z.enum(['baru', 'penanganan', 'selesai', 'rujukan']),
    is_confidential: z.boolean(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    case: CaseRecord;
    students: Student[];
    academic_years: AcademicYear[];
}

const CATEGORY_OPTIONS = [
    { value: 'akademik', label: 'Akademik' },
    { value: 'pribadi', label: 'Pribadi' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'karier', label: 'Karier' },
    { value: 'pelanggaran', label: 'Pelanggaran' },
];

const STATUS_OPTIONS = [
    { value: 'baru', label: 'Baru' },
    { value: 'penanganan', label: 'Penanganan' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'rujukan', label: 'Rujukan' },
];

export default function CasesEdit({ case: caseRecord }: Props) {
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
            category: caseRecord.category,
            title: caseRecord.title,
            description: caseRecord.description,
            status: caseRecord.status,
            is_confidential: caseRecord.is_confidential,
        },
    });

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.put(route('cases.update', caseRecord.id), data, {
            onSuccess: () => toast.success('Kasus diperbarui.'),
            onError: () => {
                toast.error('Terjadi kesalahan.');
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Kasus & Pelanggaran' },
                { label: 'Buku Kasus', href: route('cases.index') },
                { label: caseRecord.title, href: route('cases.show', caseRecord.id) },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit Kasus — ${caseRecord.title}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('cases.show', caseRecord.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Edit Kasus</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">{caseRecord.title}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Informasi Kasus
                        </h2>

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
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={watch('status') ?? 'baru'}
                                    onValueChange={(v) =>
                                        setValue(
                                            'status',
                                            v as 'baru' | 'penanganan' | 'selesai' | 'rujukan',
                                        )
                                    }
                                    options={STATUS_OPTIONS}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="e-title">Judul Kasus</Label>
                            <Input id="e-title" {...register('title')} />
                            <InputError message={errors.title?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="e-desc">Uraian Kasus</Label>
                            <Textarea id="e-desc" rows={6} {...register('description')} />
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
                                    Hanya bisa dilihat oleh guru BK penangani, Koordinator BK, dan
                                    Kepala Sekolah.
                                </span>
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={route('cases.show', caseRecord.id)}>
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
        </AuthenticatedLayout>
    );
}
