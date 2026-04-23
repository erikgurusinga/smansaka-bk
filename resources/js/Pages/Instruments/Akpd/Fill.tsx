import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, Student, AcademicYear, AkpdItem } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface Props extends PageProps {
    student: Student;
    items: AkpdItem[];
    responses: Record<number, boolean>;
    academic_year: AcademicYear;
}

const bidangLabel: Record<string, string> = {
    pribadi: 'Bidang Pribadi',
    sosial: 'Bidang Sosial',
    belajar: 'Bidang Belajar',
    karier: 'Bidang Karier',
};

const bidangBadge = (b: string): 'info' | 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
        pribadi: 'info',
        sosial: 'success',
        belajar: 'warning',
        karier: 'danger',
    };
    return map[b] ?? 'info';
};

export default function AkpdFill({ student, items, responses, academic_year }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [answers, setAnswers] = useState<Record<number, boolean>>(responses ?? {});
    const [processing, setProcessing] = useState(false);

    const grouped = useMemo(() => {
        const g: Record<string, AkpdItem[]> = { pribadi: [], sosial: [], belajar: [], karier: [] };
        items.forEach((i) => g[i.bidang].push(i));
        return g;
    }, [items]);

    const toggle = (id: number) => setAnswers((a) => ({ ...a, [id]: !a[id] }));

    const checkedCount = Object.values(answers).filter(Boolean).length;

    const onSubmit = () => {
        setProcessing(true);
        const payload: Record<number, boolean> = {};
        items.forEach((i) => {
            payload[i.id] = !!answers[i.id];
        });

        router.post(
            route('akpd.submit', student.id),
            { academic_year_id: academic_year.id, answers: payload },
            {
                onSuccess: () => toast.success('Jawaban tersimpan.'),
                onError: handleError,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'AKPD', href: route('akpd.responses') },
                { label: student.name ?? 'Siswa' },
            ]}
        >
            <Head title={`AKPD — ${student.name}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('akpd.responses')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                AKPD — {student.name}
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {student.school_class?.name ?? 'Tanpa Kelas'} · {academic_year.year}{' '}
                                {academic_year.semester}
                            </p>
                        </div>
                    </div>
                    <Badge variant="info">
                        {checkedCount} dari {items.length} dicentang
                    </Badge>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
                    Centang butir pertanyaan yang <strong>sesuai</strong> dengan kebutuhan /
                    permasalahan Anda. Jujurlah — hasilnya digunakan untuk menyusun program layanan
                    BK yang relevan.
                </div>

                {Object.entries(grouped).map(([bidang, list]) =>
                    list.length === 0 ? null : (
                        <div
                            key={bidang}
                            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-neutral-700">
                                    {bidangLabel[bidang]}
                                </h2>
                                <Badge variant={bidangBadge(bidang)}>{list.length} butir</Badge>
                            </div>
                            <div className="space-y-2">
                                {list.map((item, idx) => (
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
                    ),
                )}

                <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-md">
                    <span className="text-sm text-neutral-500">{checkedCount} butir dicentang</span>
                    <Button onClick={onSubmit} disabled={processing} className="gap-1.5">
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Jawaban'}
                    </Button>
                </div>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
