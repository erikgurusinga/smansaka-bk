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
    students: Student[];
    academic_year: AcademicYear | null;
}

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

export default function IndividualCounselingCreate({ students, academic_year }: Props) {
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

    const studentOptions = [
        { value: '', label: '— Pilih Siswa —' },
        ...students.map((s) => ({ value: String(s.id), label: `${s.name} (${s.nis})` })),
    ];

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(route('counseling.individual.store'), data, {
            onSuccess: () => toast.success('Sesi konseling dicatat.'),
            onError: () => {
                toast.error('Terjadi kesalahan.');
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
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Identitas Sesi
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
        </AuthenticatedLayout>
    );
}
