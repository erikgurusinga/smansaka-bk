import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, Student, AcademicYear, DcmItem } from '@/types';

interface Props extends PageProps {
    student: Student;
    items: DcmItem[];
    responses: Record<number, boolean>;
    academic_year: AcademicYear;
}

export default function DcmFill({ student, items, responses, academic_year }: Props) {
    const [answers, setAnswers] = useState<Record<number, boolean>>(responses ?? {});
    const [processing, setProcessing] = useState(false);
    const [activeTopic, setActiveTopic] = useState<string | null>(null);

    const grouped = useMemo(() => {
        const g = new Map<string, DcmItem[]>();
        items.forEach((i) => {
            if (!g.has(i.topic)) g.set(i.topic, []);
            g.get(i.topic)!.push(i);
        });
        return g;
    }, [items]);

    const topicNames = Array.from(grouped.keys());
    const currentTopic = activeTopic ?? topicNames[0];
    const currentItems = grouped.get(currentTopic) ?? [];

    const toggle = (id: number) => setAnswers((a) => ({ ...a, [id]: !a[id] }));

    const checkedCount = Object.values(answers).filter(Boolean).length;

    const countForTopic = (topic: string) => {
        const list = grouped.get(topic) ?? [];
        return list.filter((i) => answers[i.id]).length;
    };

    const onSubmit = () => {
        setProcessing(true);
        const payload: Record<number, boolean> = {};
        items.forEach((i) => (payload[i.id] = !!answers[i.id]));

        router.post(
            route('dcm.submit', student.id),
            { academic_year_id: academic_year.id, answers: payload },
            {
                onSuccess: () => toast.success('Jawaban tersimpan.'),
                onError: () => toast.error('Gagal menyimpan.'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'DCM', href: route('dcm.responses') },
                { label: student.name ?? 'Siswa' },
            ]}
        >
            <Head title={`DCM — ${student.name}`} />

            <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('dcm.responses')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                DCM — {student.name}
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {student.school_class?.name ?? 'Tanpa Kelas'} · {academic_year.year}{' '}
                                {academic_year.semester}
                            </p>
                        </div>
                    </div>
                    <Badge variant="info">{checkedCount} dicentang</Badge>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
                    Centang pernyataan yang <strong>sesuai dengan masalah yang Anda alami</strong>.
                    Isi jujur — DCM ini rahasia dan hanya dipakai untuk membantu menyusun program
                    BK.
                </div>

                <div className="grid gap-4 lg:grid-cols-[240px,1fr]">
                    <aside className="space-y-1 self-start rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 lg:sticky lg:top-4">
                        {topicNames.map((t) => {
                            const total = (grouped.get(t) ?? []).length;
                            const c = countForTopic(t);
                            const active = currentTopic === t;
                            return (
                                <button
                                    key={t}
                                    onClick={() => setActiveTopic(t)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                                        active
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-neutral-700 hover:bg-neutral-50'
                                    }`}
                                >
                                    <span>{t}</span>
                                    <span
                                        className={`rounded-full px-1.5 text-xs ${
                                            c > 0
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'text-neutral-400'
                                        }`}
                                    >
                                        {c}/{total}
                                    </span>
                                </button>
                            );
                        })}
                    </aside>

                    <div className="space-y-3">
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                            <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                                {currentTopic}
                            </h2>
                            <div className="space-y-1">
                                {currentItems.map((item, idx) => (
                                    <label
                                        key={item.id}
                                        className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-sm hover:bg-neutral-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!answers[item.id]}
                                            onChange={() => toggle(item.id)}
                                            className="mt-0.5 h-4 w-4 rounded"
                                        />
                                        <span className="flex-1 text-neutral-700">
                                            <span className="mr-2 text-neutral-400">
                                                {idx + 1}.
                                            </span>
                                            {item.question}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
                            <span className="text-sm text-neutral-500">
                                {checkedCount} dari {items.length} dicentang
                            </span>
                            <Button onClick={onSubmit} disabled={processing} className="gap-1.5">
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Jawaban'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
