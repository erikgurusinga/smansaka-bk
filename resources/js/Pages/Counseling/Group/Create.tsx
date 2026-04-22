import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
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
    student_ids: z.array(z.string()).min(2, 'Minimal 2 siswa untuk konseling kelompok'),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    start_time: z.string().optional(),
    duration_minutes: z.coerce.number().int().min(1).max(480).optional().or(z.literal('')),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    description: z.string().optional(),
    outcome: z.string().optional(),
    next_plan: z.string().optional(),
    status: z.enum(['dijadwalkan', 'berlangsung', 'selesai', 'dibatalkan']),
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

export default function GroupCounselingCreate({ students, academic_year }: Props) {
    const [processing, setProcessing] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [studentSearch, setStudentSearch] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            student_ids: [],
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            start_time: '',
            topic: '',
            description: '',
            outcome: '',
            next_plan: '',
            status: 'selesai',
        },
    });

    const filteredStudents = students.filter(
        (s) =>
            !selectedStudents.find((sel) => sel.id === s.id) &&
            (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.nis.includes(studentSearch)),
    );

    const addStudent = (student: Student) => {
        const updated = [...selectedStudents, student];
        setSelectedStudents(updated);
        setValue(
            'student_ids',
            updated.map((s) => String(s.id)),
        );
        setStudentSearch('');
    };

    const removeStudent = (id: number) => {
        const updated = selectedStudents.filter((s) => s.id !== id);
        setSelectedStudents(updated);
        setValue(
            'student_ids',
            updated.map((s) => String(s.id)),
        );
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(route('counseling.group.store'), data, {
            onSuccess: () => toast.success('Sesi konseling kelompok dicatat.'),
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
                { label: 'Konseling Kelompok', href: route('counseling.group.index') },
                { label: 'Catat Sesi Baru' },
            ]}
        >
            <Head title="Catat Sesi Konseling Kelompok" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('counseling.group.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Catat Sesi Konseling Kelompok
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">Minimal 2 siswa per sesi</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Peserta Kelompok
                        </h2>

                        {selectedStudents.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedStudents.map((s) => (
                                    <span
                                        key={s.id}
                                        className="bg-primary-50 text-primary-700 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                                    >
                                        {s.name}
                                        <button
                                            type="button"
                                            onClick={() => removeStudent(s.id)}
                                            className="text-primary-400 hover:text-primary-700"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Tambah Siswa</Label>
                            <Input
                                placeholder="Cari nama atau NIS siswa..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                            />
                            {studentSearch && filteredStudents.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
                                    {filteredStudents.slice(0, 10).map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => addStudent(s)}
                                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                                        >
                                            <span className="font-medium text-neutral-800">
                                                {s.name}
                                            </span>
                                            <span className="text-xs text-neutral-400">
                                                {s.nis} — {s.school_class?.name ?? 'Tanpa Kelas'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <InputError message={errors.student_ids?.message} />
                            <p className="text-xs text-neutral-400">
                                {selectedStudents.length} siswa dipilih
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Sesi
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-date">Tanggal</Label>
                                <Input id="cg-date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-time">Jam Mulai</Label>
                                <Input id="cg-time" type="time" {...register('start_time')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cg-dur">Durasi (menit)</Label>
                                <Input
                                    id="cg-dur"
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
                            <Label htmlFor="cg-topic">Topik / Tema Kelompok</Label>
                            <Input
                                id="cg-topic"
                                placeholder="Contoh: Manajemen stres menghadapi ujian"
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
                            <Label htmlFor="cg-desc">Latar Belakang / Uraian</Label>
                            <Textarea
                                id="cg-desc"
                                rows={3}
                                placeholder="Tujuan, dinamika kelompok, dan isu yang dibahas..."
                                {...register('description')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cg-outcome">Hasil / Kesimpulan</Label>
                            <Textarea
                                id="cg-outcome"
                                rows={3}
                                placeholder="Perkembangan dan hasil yang dicapai dalam sesi ini..."
                                {...register('outcome')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cg-plan">Rencana Tindak Lanjut</Label>
                            <Textarea
                                id="cg-plan"
                                rows={2}
                                placeholder="Langkah selanjutnya untuk kelompok..."
                                {...register('next_plan')}
                            />
                        </div>
                    </div>

                    <input type="hidden" {...register('academic_year_id')} />

                    <div className="flex justify-end gap-3">
                        <Link href={route('counseling.group.index')}>
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
