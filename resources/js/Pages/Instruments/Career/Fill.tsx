import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Textarea } from '@/Components/ui/Textarea';
import { Label } from '@/Components/ui/Label';
import { PageProps, Student, AcademicYear } from '@/types';

interface CareerItem {
    id: number;
    dimension: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
    question: string;
}

interface Props extends PageProps {
    student: Student;
    items: CareerItem[];
    existing_scores: Record<string, number> | null;
    academic_year: AcademicYear;
}

const SCALE_LABELS = [
    { v: 1, label: 'Tidak suka' },
    { v: 2, label: 'Kurang' },
    { v: 3, label: 'Netral' },
    { v: 4, label: 'Suka' },
    { v: 5, label: 'Sangat suka' },
];

export default function CareerFill({ student, items, academic_year }: Props) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const answeredCount = Object.keys(answers).length;
    const total = items.length;

    const setAnswer = (id: number, value: number) => {
        setAnswers((a) => ({ ...a, [id]: value }));
    };

    const grouped = useMemo(() => {
        const g: Record<string, CareerItem[]> = {
            R: [],
            I: [],
            A: [],
            S: [],
            E: [],
            C: [],
        };
        items.forEach((i) => g[i.dimension].push(i));
        return g;
    }, [items]);

    const onSubmit = () => {
        if (answeredCount < total) {
            toast.error(`Masih ada ${total - answeredCount} pertanyaan yang belum diisi.`);
            return;
        }

        setProcessing(true);
        router.post(
            route('career.submit', student.id),
            {
                academic_year_id: academic_year.id,
                answers,
                notes: notes || undefined,
            },
            {
                onSuccess: () => toast.success('Hasil asesmen tersimpan.'),
                onError: () => toast.error('Terjadi kesalahan.'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'Minat Bakat', href: route('career.index') },
                { label: student.name ?? 'Siswa' },
            ]}
        >
            <Head title={`Minat Bakat — ${student.name}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('career.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                Inventori Minat Bakat (RIASEC)
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {student.name} · {student.school_class?.name ?? 'Tanpa Kelas'}
                            </p>
                        </div>
                    </div>
                    <Badge variant="info">
                        {answeredCount}/{total}
                    </Badge>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
                    Nilai kesukaan Anda pada tiap pernyataan dari skala{' '}
                    <strong>1 (Tidak suka)</strong> sampai <strong>5 (Sangat suka)</strong>. Hasil
                    akan memetakan minat Anda ke kode Holland (RIASEC) untuk rekomendasi jurusan.
                </div>

                {Object.entries(grouped).map(([dim, list]) => (
                    <div
                        key={dim}
                        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
                    >
                        <p className="text-primary-700 mb-3 text-xs font-semibold tracking-wide uppercase">
                            Dimensi {dim}
                        </p>
                        <div className="space-y-3">
                            {list.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
                                >
                                    <p className="mb-2 text-sm text-neutral-800">{item.question}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SCALE_LABELS.map((s) => (
                                            <button
                                                key={s.v}
                                                type="button"
                                                onClick={() => setAnswer(item.id, s.v)}
                                                className={`flex flex-col items-center rounded-lg px-3 py-1.5 text-xs transition ${
                                                    answers[item.id] === s.v
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100'
                                                }`}
                                            >
                                                <span className="font-semibold">{s.v}</span>
                                                <span className="mt-0.5 text-[10px]">
                                                    {s.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                    <Label htmlFor="notes" className="mb-2 block">
                        Catatan Tambahan
                    </Label>
                    <Textarea
                        id="notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Cita-cita / jurusan yang sudah dibayangkan (opsional)"
                    />
                </div>

                <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
                    <span className="text-sm text-neutral-500">
                        {answeredCount} dari {total} terjawab
                    </span>
                    <Button onClick={onSubmit} disabled={processing} className="gap-1.5">
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan & Hitung'}
                    </Button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
