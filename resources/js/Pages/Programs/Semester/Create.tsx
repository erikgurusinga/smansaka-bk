import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, AnnualProgram, RplBk } from '@/types';

interface ScheduleItem {
    month: number;
    week: number;
    rpl_id: number;
    class_level: 'X' | 'XI' | 'XII' | 'semua';
    notes: string;
}

interface Props extends PageProps {
    annual: AnnualProgram;
    rpls: RplBk[];
    suggested_semester: 'ganjil' | 'genap';
}

const MONTHS_GANJIL = [
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

const MONTHS_GENAP = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
];

export default function SemesterCreate({ annual, rpls, suggested_semester }: Props) {
    const [semester, setSemester] = useState<'ganjil' | 'genap'>(suggested_semester);
    const [title, setTitle] = useState(
        `Program Semester ${suggested_semester === 'ganjil' ? 'Ganjil' : 'Genap'} — ${annual.title}`,
    );
    const [notes, setNotes] = useState('');
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [processing, setProcessing] = useState(false);

    const months = semester === 'ganjil' ? MONTHS_GANJIL : MONTHS_GENAP;

    // RPL yang cocok: RPL di semester yang sama
    const relevantRpls = rpls.filter((r) => r.semester === semester);

    const addRow = () => {
        setSchedule((prev) => [
            ...prev,
            {
                month: months[0].value,
                week: 1,
                rpl_id: relevantRpls[0]?.id ?? rpls[0]?.id ?? 0,
                class_level: 'semua',
                notes: '',
            },
        ]);
    };

    const updateRow = (idx: number, patch: Partial<ScheduleItem>) => {
        setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    };

    const removeRow = (idx: number) => {
        setSchedule((prev) => prev.filter((_, i) => i !== idx));
    };

    const onSubmit = () => {
        if (!title.trim()) {
            toast.error('Judul wajib diisi.');
            return;
        }
        if (schedule.length === 0) {
            toast.error('Minimal satu jadwal harus dibuat.');
            return;
        }

        setProcessing(true);
        router.post(
            route('semester.store'),
            {
                annual_program_id: annual.id,
                semester,
                title,
                notes: notes || undefined,
                schedule,
            },
            {
                onSuccess: () => toast.success('Program semester dibuat.'),
                onError: () => toast.error('Terjadi kesalahan.'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Program BK' },
                { label: 'Program Tahunan', href: route('annual.index') },
                { label: annual.title, href: route('annual.show', annual.id) },
                { label: 'Buat Semester' },
            ]}
        >
            <Head title="Buat Program Semester" />

            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('annual.show', annual.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        Buat Program Semester
                    </h1>
                </div>

                <div className="bg-primary-50 ring-primary-100 rounded-2xl p-4 ring-1">
                    <p className="text-primary-700 text-xs font-semibold tracking-wide uppercase">
                        Turunan dari
                    </p>
                    <p className="text-primary-900 mt-1 text-sm font-medium">{annual.title}</p>
                </div>

                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Semester</Label>
                            <Select
                                value={semester}
                                onValueChange={(v) => {
                                    setSemester(v as 'ganjil' | 'genap');
                                    setSchedule([]);
                                }}
                                options={[
                                    { value: 'ganjil', label: 'Ganjil (Jul–Des)' },
                                    { value: 'genap', label: 'Genap (Jan–Jun)' },
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Judul</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Catatan</Label>
                        <Textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Opsional — catatan pelaksanaan program semester"
                        />
                    </div>
                </div>

                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                Jadwal Layanan ({schedule.length})
                            </h2>
                            <p className="mt-0.5 text-xs text-neutral-400">
                                Susun urutan RPL per bulan &amp; minggu selama semester ini.
                                {relevantRpls.length === 0 && (
                                    <span className="ml-1 text-rose-600">
                                        Belum ada RPL untuk semester {semester}. Tambahkan di menu
                                        RPL BK dulu.
                                    </span>
                                )}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={addRow}
                            disabled={rpls.length === 0}
                            className="gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Jadwal
                        </Button>
                    </div>

                    {schedule.length === 0 && (
                        <p className="py-6 text-center text-sm text-neutral-400">
                            Belum ada jadwal. Klik &ldquo;Tambah Jadwal&rdquo; untuk memulai.
                        </p>
                    )}

                    {schedule.map((row, idx) => {
                        const rpl = rpls.find((r) => r.id === row.rpl_id);
                        return (
                            <div
                                key={idx}
                                className="grid grid-cols-[60px,120px,80px,1fr,120px,auto] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3"
                            >
                                <Badge variant="neutral">#{idx + 1}</Badge>
                                <Select
                                    value={String(row.month)}
                                    onValueChange={(v) => updateRow(idx, { month: Number(v) })}
                                    options={months.map((m) => ({
                                        value: String(m.value),
                                        label: m.label,
                                    }))}
                                />
                                <Select
                                    value={String(row.week)}
                                    onValueChange={(v) => updateRow(idx, { week: Number(v) })}
                                    options={[1, 2, 3, 4, 5].map((w) => ({
                                        value: String(w),
                                        label: `Mg ${w}`,
                                    }))}
                                />
                                <Select
                                    value={String(row.rpl_id)}
                                    onValueChange={(v) => updateRow(idx, { rpl_id: Number(v) })}
                                    options={rpls.map((r) => ({
                                        value: String(r.id),
                                        label: `[${r.bidang}] ${r.title}`,
                                    }))}
                                />
                                <Select
                                    value={row.class_level}
                                    onValueChange={(v) =>
                                        updateRow(idx, {
                                            class_level: v as ScheduleItem['class_level'],
                                        })
                                    }
                                    options={[
                                        { value: 'semua', label: 'Semua' },
                                        { value: 'X', label: 'Kelas X' },
                                        { value: 'XI', label: 'Kelas XI' },
                                        { value: 'XII', label: 'Kelas XII' },
                                    ]}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRow(idx)}
                                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                {rpl && (
                                    <div className="col-span-6 -mt-1 text-xs text-neutral-400">
                                        Durasi: {rpl.duration_minutes ?? '—'} mnt ·{' '}
                                        {rpl.service_type}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3">
                    <Link href={route('annual.show', annual.id)}>
                        <Button type="button" variant="secondary">
                            Batal
                        </Button>
                    </Link>
                    <Button onClick={onSubmit} disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Program Semester'}
                    </Button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
