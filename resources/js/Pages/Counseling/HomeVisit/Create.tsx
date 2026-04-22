import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from 'signature_pad';
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
    students: Student[];
    academic_year: AcademicYear | null;
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
            padRef.current = new SignaturePad(canvasRef.current, {
                penColor: '#1e293b',
            });
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

export default function HomeVisitCreate({ students, academic_year }: Props) {
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
            purpose: '',
            findings: '',
            action_plan: '',
            status: 'dijadwalkan',
        },
    });

    const studentOptions = [
        { value: '', label: '— Pilih Siswa —' },
        ...students.map((s) => ({ value: String(s.id), label: `${s.name} (${s.nis})` })),
    ];

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(route('home-visits.store'), data, {
            onSuccess: () => toast.success('Home visit dicatat.'),
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
        </AuthenticatedLayout>
    );
}
