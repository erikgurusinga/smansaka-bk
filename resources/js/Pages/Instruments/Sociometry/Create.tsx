import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { PageProps, SchoolClass, AcademicYear } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    class_id: z.string().min(1, 'Kelas wajib dipilih'),
    title: z.string().min(3, 'Judul minimal 3 karakter'),
    description: z.string().optional(),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    max_choices: z.coerce.number().int().min(1).max(5).default(3),
    status: z.enum(['draft', 'open', 'closed']).default('draft'),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    classes: SchoolClass[];
    academic_year: AcademicYear;
}

interface Criterion {
    key: string;
    label: string;
    polarity: 'positive' | 'negative';
}

const defaultCriteria: Criterion[] = [
    {
        key: 'teman_dekat',
        label: 'Teman dekat yang disukai untuk belajar bersama',
        polarity: 'positive',
    },
    { key: 'teman_bermain', label: 'Teman dekat untuk bermain / bercerita', polarity: 'positive' },
    { key: 'tidak_disukai', label: 'Teman yang kurang disukai', polarity: 'negative' },
];

export default function SociometryCreate({ classes, academic_year }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
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
            class_id: '',
            title: '',
            description: '',
            date: new Date().toISOString().slice(0, 10),
            max_choices: 3,
            status: 'open',
        },
    });

    const addCriterion = () => {
        setCriteria([
            ...criteria,
            { key: `krit_${criteria.length + 1}`, label: '', polarity: 'positive' },
        ]);
    };

    const updateCriterion = (idx: number, patch: Partial<Criterion>) => {
        setCriteria((c) => c.map((k, i) => (i === idx ? { ...k, ...patch } : k)));
    };

    const removeCriterion = (idx: number) => {
        setCriteria((c) => c.filter((_, i) => i !== idx));
    };

    const onSubmit = (data: FormData) => {
        const validCriteria = criteria.filter((c) => c.label.trim() && c.key.trim());
        if (validCriteria.length === 0) {
            toast.error('Minimal satu kriteria harus diisi.');
            return;
        }

        setProcessing(true);
        router.post(
            route('sociometry.store'),
            {
                ...data,
                academic_year_id: academic_year.id,
                criteria: validCriteria,
            },
            {
                onSuccess: () => toast.success('Sesi sosiometri dibuat.'),
                onError: handleError,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'Sosiometri', href: route('sociometry.index') },
                { label: 'Buat Sesi' },
            ]}
        >
            <Head title="Buat Sesi Sosiometri" />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('sociometry.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">Buat Sesi Sosiometri</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Detail Sesi
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Kelas</Label>
                                <Select
                                    value={watch('class_id') ?? ''}
                                    onValueChange={(v) => setValue('class_id', v)}
                                    options={[
                                        { value: '', label: '— Pilih kelas —' },
                                        ...classes.map((c) => ({
                                            value: String(c.id),
                                            label: c.name,
                                        })),
                                    ]}
                                />
                                <InputError message={errors.class_id?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="date">Tanggal</Label>
                                <Input id="date" type="date" {...register('date')} />
                                <InputError message={errors.date?.message} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="title">Judul Sesi</Label>
                            <Input
                                id="title"
                                placeholder="Sosiometri Kelas X IPA 1 — Semester Ganjil"
                                {...register('title')}
                            />
                            <InputError message={errors.title?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="desc">Deskripsi</Label>
                            <Textarea id="desc" rows={2} {...register('description')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="max">Jumlah Pilihan per Kriteria</Label>
                                <Input
                                    id="max"
                                    type="number"
                                    min={1}
                                    max={5}
                                    {...register('max_choices', { valueAsNumber: true })}
                                />
                                <InputError message={errors.max_choices?.message} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status Awal</Label>
                                <Select
                                    value={watch('status') ?? 'open'}
                                    onValueChange={(v) =>
                                        setValue('status', v as FormData['status'])
                                    }
                                    options={[
                                        { value: 'draft', label: 'Draft' },
                                        { value: 'open', label: 'Terbuka' },
                                        { value: 'closed', label: 'Ditutup' },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Kriteria Pemilihan
                            </h2>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addCriterion}
                                className="gap-1.5"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Kriteria
                            </Button>
                        </div>

                        {criteria.length === 0 && (
                            <p className="text-sm text-neutral-400">Belum ada kriteria.</p>
                        )}

                        <div className="space-y-3">
                            {criteria.map((c, i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-[140px,1fr,140px,auto] items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
                                >
                                    <Input
                                        placeholder="key (unik)"
                                        value={c.key}
                                        onChange={(e) =>
                                            updateCriterion(i, { key: e.target.value })
                                        }
                                    />
                                    <Input
                                        placeholder="Pertanyaan kriteria..."
                                        value={c.label}
                                        onChange={(e) =>
                                            updateCriterion(i, { label: e.target.value })
                                        }
                                    />
                                    <Select
                                        value={c.polarity}
                                        onValueChange={(v) =>
                                            updateCriterion(i, {
                                                polarity: v as 'positive' | 'negative',
                                            })
                                        }
                                        options={[
                                            { value: 'positive', label: 'Positif (disukai)' },
                                            { value: 'negative', label: 'Negatif (dijauhi)' },
                                        ]}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCriterion(i)}
                                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={route('sociometry.index')}>
                            <Button type="button" variant="secondary">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Sesi'}
                        </Button>
                    </div>
                </form>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
