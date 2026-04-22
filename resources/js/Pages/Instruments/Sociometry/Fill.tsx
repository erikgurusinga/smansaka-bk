import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Select } from '@/Components/ui/Select';
import { Label } from '@/Components/ui/Label';
import { PageProps, SociometrySession, Student } from '@/types';

interface ExistingChoice {
    criterion_key: string;
    to_student_id: number;
    rank: number;
}

interface Props extends PageProps {
    session: SociometrySession;
    student: Student;
    classmates: Student[];
    existing_choices: ExistingChoice[];
}

type ChoicesState = Record<string, Array<number | ''>>;

export default function SociometryFill({ session, student, classmates, existing_choices }: Props) {
    const criteria = session.criteria ?? [];
    const max = session.max_choices;

    const initial: ChoicesState = {};
    criteria.forEach((c) => {
        initial[c.key] = Array.from({ length: max }, (_, i) => {
            const found = existing_choices.find(
                (ex) => ex.criterion_key === c.key && ex.rank === i + 1,
            );
            return found?.to_student_id ?? '';
        });
    });

    const [choices, setChoices] = useState<ChoicesState>(initial);
    const [processing, setProcessing] = useState(false);

    const updateChoice = (key: string, rankIdx: number, value: string) => {
        setChoices((c) => {
            const list = [...(c[key] ?? [])];
            list[rankIdx] = value ? Number(value) : '';
            return { ...c, [key]: list };
        });
    };

    const onSubmit = () => {
        setProcessing(true);
        const payload: Array<{
            criterion_key: string;
            to_student_id: number;
            rank: number;
        }> = [];

        for (const [key, ranks] of Object.entries(choices)) {
            ranks.forEach((v, i) => {
                if (typeof v === 'number' && v > 0) {
                    payload.push({
                        criterion_key: key,
                        to_student_id: v,
                        rank: i + 1,
                    });
                }
            });
        }

        router.post(
            route('sociometry.submit', [session.id, student.id]),
            { choices: payload },
            {
                onSuccess: () => toast.success('Pilihan tersimpan.'),
                onError: () => toast.error('Terjadi kesalahan.'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'Sosiometri', href: route('sociometry.index') },
                {
                    label: session.title,
                    href: route('sociometry.show', session.id),
                },
                { label: student.name ?? 'Siswa' },
            ]}
        >
            <Head title={`Isi Sosiometri — ${student.name}`} />

            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('sociometry.show', session.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Isi Sosiometri</h1>
                        <p className="text-sm text-neutral-500">
                            {student.name} · {session.school_class?.name}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
                    Pilih maksimal <strong>{max}</strong> teman sekelas untuk setiap kriteria.
                    Jawaban jujur — hasil dipakai untuk membantu pemetaan sosial kelas, bukan
                    penilaian siapa yang &ldquo;bagus&rdquo; atau &ldquo;jelek&rdquo;.
                </div>

                {criteria.map((c) => (
                    <div
                        key={c.key}
                        className={`rounded-2xl p-5 shadow-sm ring-1 ${
                            c.polarity === 'positive'
                                ? 'bg-sky-50 ring-sky-100'
                                : 'bg-rose-50 ring-rose-100'
                        }`}
                    >
                        <p
                            className={`mb-3 text-sm font-semibold ${
                                c.polarity === 'positive' ? 'text-sky-900' : 'text-rose-900'
                            }`}
                        >
                            {c.label}
                        </p>

                        <div className="space-y-2">
                            {Array.from({ length: max }, (_, i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-[80px,1fr] items-center gap-2"
                                >
                                    <Label className="text-xs">Pilihan #{i + 1}</Label>
                                    <Select
                                        value={String(choices[c.key]?.[i] ?? '')}
                                        onValueChange={(v) => updateChoice(c.key, i, v)}
                                        options={[
                                            { value: '', label: '— Tidak memilih —' },
                                            ...classmates
                                                .filter((s) => {
                                                    const taken = choices[c.key] ?? [];
                                                    return !taken.some(
                                                        (t, ti) => ti !== i && t === s.id,
                                                    );
                                                })
                                                .map((s) => ({
                                                    value: String(s.id),
                                                    label: s.name ?? '',
                                                })),
                                        ]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="sticky bottom-4 flex justify-end rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
                    <Button onClick={onSubmit} disabled={processing} className="gap-1.5">
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Pilihan'}
                    </Button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
