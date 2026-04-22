import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, CaseRecord, AcademicYear } from '@/types';

const participantSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    role: z.string().min(1, 'Jabatan/peran wajib diisi'),
});

const schema = z.object({
    case_id: z.string().optional(),
    academic_year_id: z.string().min(1),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    topic: z.string().min(1, 'Topik wajib diisi').max(255),
    participants: z.array(participantSchema).optional(),
    notes: z.string().optional(),
    outcome: z.string().optional(),
    status: z.enum(['dijadwalkan', 'selesai']),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    cases: (CaseRecord & { student?: { name: string } })[];
    academic_year: AcademicYear | null;
}

export default function CaseConferencesCreate({ cases, academic_year }: Props) {
    const [processing, setProcessing] = useState(false);
    const [participants, setParticipants] = useState<{ name: string; role: string }[]>([
        { name: '', role: '' },
    ]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            case_id: '',
            academic_year_id: academic_year ? String(academic_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            topic: '',
            notes: '',
            outcome: '',
            status: 'dijadwalkan',
        },
    });

    const caseOptions = [
        { value: '', label: '— Tidak terkait kasus —' },
        ...cases.map((c) => ({
            value: String(c.id),
            label: `${c.title} (${c.student?.name ?? '—'})`,
        })),
    ];

    const addParticipant = () => {
        setParticipants((p) => [...p, { name: '', role: '' }]);
    };

    const removeParticipant = (i: number) => {
        setParticipants((p) => p.filter((_, idx) => idx !== i));
    };

    const updateParticipant = (i: number, field: 'name' | 'role', value: string) => {
        setParticipants((p) =>
            p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
        );
    };

    const onSubmit = (data: FormData) => {
        const validParticipants = participants.filter((p) => p.name && p.role);
        setProcessing(true);
        router.post(
            route('case-conferences.store'),
            { ...data, participants: validParticipants },
            {
                onSuccess: () => toast.success('Konferensi kasus dicatat.'),
                onError: () => {
                    toast.error('Terjadi kesalahan.');
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Layanan BK' },
                { label: 'Konferensi Kasus', href: route('case-conferences.index') },
                { label: 'Buat Konferensi' },
            ]}
        >
            <Head title="Buat Konferensi Kasus" />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('case-conferences.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Buat Konferensi Kasus
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Rapat multi-pihak dengan notulen
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Konferensi
                        </h2>

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
                                <Label htmlFor="cc-date">Tanggal</Label>
                                <Input id="cc-date" type="date" {...register('date')} />
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
                            <Label htmlFor="cc-topic">Topik / Agenda</Label>
                            <Input
                                id="cc-topic"
                                placeholder="Contoh: Penanganan kasus bullying XI-A"
                                {...register('topic')}
                            />
                            <InputError message={errors.topic?.message} />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Peserta
                            </h2>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addParticipant}
                                className="h-7 gap-1 text-xs"
                            >
                                <Plus className="h-3 w-3" />
                                Tambah
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {participants.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Nama"
                                        value={p.name}
                                        onChange={(e) =>
                                            updateParticipant(i, 'name', e.target.value)
                                        }
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Jabatan / Peran"
                                        value={p.role}
                                        onChange={(e) =>
                                            updateParticipant(i, 'role', e.target.value)
                                        }
                                        className="flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeParticipant(i)}
                                        disabled={participants.length === 1}
                                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Notulen
                        </h2>

                        <div className="space-y-1.5">
                            <Label htmlFor="cc-notes">Catatan Rapat</Label>
                            <Textarea
                                id="cc-notes"
                                rows={4}
                                placeholder="Isi pembahasan, pendapat pihak-pihak yang hadir..."
                                {...register('notes')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cc-outcome">Hasil / Keputusan</Label>
                            <Textarea
                                id="cc-outcome"
                                rows={3}
                                placeholder="Keputusan yang disepakati bersama..."
                                {...register('outcome')}
                            />
                        </div>
                    </div>

                    <input type="hidden" {...register('academic_year_id')} />

                    <div className="flex justify-end gap-3">
                        <Link href={route('case-conferences.index')}>
                            <Button type="button" variant="secondary" disabled={processing}>
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Konferensi'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
