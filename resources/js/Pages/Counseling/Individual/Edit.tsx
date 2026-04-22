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
import { PageProps, CounselingSession } from '@/types';

const schema = z.object({
    date: z.string().min(1),
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
    session: CounselingSession;
}

const STATUS_OPTIONS = [
    { value: 'dijadwalkan', label: 'Dijadwalkan' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

export default function IndividualCounselingEdit({ session: sesi }: Props) {
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
            date: sesi.date,
            start_time: sesi.start_time ?? '',
            duration_minutes: sesi.duration_minutes ?? '',
            topic: sesi.topic,
            description: sesi.description ?? '',
            outcome: sesi.outcome ?? '',
            next_plan: sesi.next_plan ?? '',
            status: sesi.status,
            is_confidential: sesi.is_confidential,
        },
    });

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.put(route('counseling.individual.update', sesi.id), data, {
            onSuccess: () => toast.success('Sesi konseling diperbarui.'),
            onError: () => {
                toast.error('Terjadi kesalahan.');
                setProcessing(false);
            },
        });
    };

    const student = sesi.students?.[0];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Konseling Individual', href: route('counseling.individual.index') },
                { label: sesi.topic, href: route('counseling.individual.show', sesi.id) },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit — ${sesi.topic}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('counseling.individual.show', sesi.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Edit Sesi Konseling
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            {student?.name ?? '—'} — {student?.school_class?.name ?? 'Tanpa Kelas'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Sesi
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ei-date">Tanggal</Label>
                                <Input id="ei-date" type="date" {...register('date')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ei-time">Jam Mulai</Label>
                                <Input id="ei-time" type="time" {...register('start_time')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ei-dur">Durasi (menit)</Label>
                                <Input
                                    id="ei-dur"
                                    type="number"
                                    min={1}
                                    max={480}
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
                            <Label htmlFor="ei-topic">Topik / Masalah</Label>
                            <Input id="ei-topic" {...register('topic')} />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Catatan Sesi
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-desc">Latar Belakang / Uraian Masalah</Label>
                            <Textarea id="ei-desc" rows={3} {...register('description')} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-outcome">Hasil / Kesimpulan</Label>
                            <Textarea id="ei-outcome" rows={3} {...register('outcome')} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ei-plan">Rencana Tindak Lanjut</Label>
                            <Textarea id="ei-plan" rows={2} {...register('next_plan')} />
                        </div>
                    </div>

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

                    <div className="flex justify-end gap-3">
                        <Link href={route('counseling.individual.show', sesi.id)}>
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
