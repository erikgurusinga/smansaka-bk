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
import { PageProps, Student, CaseRecord, AcademicYear } from '@/types';

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
    students: Student[];
    cases: (CaseRecord & { student?: { name: string } })[];
    academic_year: AcademicYear | null;
}

const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'diterima', label: 'Diterima' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'selesai', label: 'Selesai' },
];

export default function ReferralsCreate({ students, cases, academic_year }: Props) {
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
            case_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            referred_to: '',
            reason: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            status: 'aktif',
        },
    });

    const studentOptions = [
        { value: '', label: '— Pilih Siswa —' },
        ...students.map((s) => ({ value: String(s.id), label: `${s.name} (${s.nis})` })),
    ];

    const caseOptions = [
        { value: '', label: '— Tidak terkait kasus —' },
        ...cases.map((c) => ({
            value: String(c.id),
            label: `${c.title} (${c.student?.name ?? '—'})`,
        })),
    ];

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(route('referrals.store'), data, {
            onSuccess: () => toast.success('Referral dicatat.'),
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
                            <Select
                                value={watch('student_id') ?? ''}
                                onValueChange={(v) => setValue('student_id', v)}
                                options={studentOptions}
                            />
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
        </AuthenticatedLayout>
    );
}
