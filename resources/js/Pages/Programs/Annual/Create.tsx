import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Sparkles, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, AcademicYear, RplBk } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface AkpdSuggestion {
    bidang: string;
    checked_count: number;
    percentage: number;
    priority: number;
    target_count: number;
}

interface PlanItem {
    bidang: 'pribadi' | 'sosial' | 'belajar' | 'karier';
    priority: number;
    focus: string;
    target_count: number;
    rpl_ids: number[];
}

interface Props extends PageProps {
    academic_years: AcademicYear[];
    active_year_id: number | null;
    akpd_suggestion: AkpdSuggestion[];
    rpls: RplBk[];
}

const BIDANG_LABELS: Record<string, string> = {
    pribadi: 'Pribadi',
    sosial: 'Sosial',
    belajar: 'Belajar',
    karier: 'Karier',
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

const FOCUS_TEMPLATES: Record<string, string> = {
    pribadi: 'Mengembangkan kepercayaan diri, kemandirian emosional, dan pemahaman diri siswa.',
    sosial: 'Membangun keterampilan komunikasi, kerja sama, dan adaptasi dalam pergaulan.',
    belajar: 'Meningkatkan kebiasaan belajar efektif, motivasi, dan pemahaman gaya belajar.',
    karier: 'Memfasilitasi pilihan karier, pengenalan jurusan lanjutan, dan eksplorasi minat.',
};

export default function AnnualCreate({
    academic_years,
    active_year_id,
    akpd_suggestion,
    rpls,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const [yearId, setYearId] = useState<number | null>(active_year_id);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState<'manual' | 'akpd' | 'dcm'>('manual');
    const [items, setItems] = useState<PlanItem[]>([]);
    const [processing, setProcessing] = useState(false);

    const applyAkpdSuggestion = () => {
        const generated: PlanItem[] = akpd_suggestion.map((s) => ({
            bidang: s.bidang as PlanItem['bidang'],
            priority: s.priority,
            focus: FOCUS_TEMPLATES[s.bidang] ?? '',
            target_count: s.target_count,
            rpl_ids: [],
        }));
        setItems(generated);
        setSource('akpd');
        toast.success('Saran AKPD diterapkan — silakan edit detailnya.');
    };

    const addBlankItem = () => {
        setItems((prev) => [
            ...prev,
            {
                bidang: 'pribadi',
                priority: 3,
                focus: FOCUS_TEMPLATES.pribadi ?? '',
                target_count: 2,
                rpl_ids: [],
            },
        ]);
    };

    const updateItem = (idx: number, patch: Partial<PlanItem>) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };

    const removeItem = (idx: number) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const toggleRpl = (idx: number, rplId: number) => {
        setItems((prev) =>
            prev.map((it, i) => {
                if (i !== idx) return it;
                const has = it.rpl_ids.includes(rplId);
                return {
                    ...it,
                    rpl_ids: has ? it.rpl_ids.filter((x) => x !== rplId) : [...it.rpl_ids, rplId],
                };
            }),
        );
    };

    const onSubmit = () => {
        if (!yearId) {
            toast.error('Tahun ajaran wajib dipilih.');
            return;
        }
        if (!title.trim()) {
            toast.error('Judul program wajib diisi.');
            return;
        }
        if (items.length === 0) {
            toast.error('Minimal satu item bidang harus ditambahkan.');
            return;
        }

        setProcessing(true);
        router.post(
            route('annual.store'),
            {
                academic_year_id: yearId,
                title,
                description: description || undefined,
                status: 'draft',
                generation_source: source,
                items,
            },
            {
                onSuccess: () => toast.success('Program tahunan dibuat.'),
                onError: handleError,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Program BK' },
                { label: 'Program Tahunan', href: route('annual.index') },
                { label: 'Susun Program' },
            ]}
        >
            <Head title="Susun Program Tahunan" />

            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('annual.index')}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        Susun Program Tahunan
                    </h1>
                </div>

                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                        Informasi Dasar
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Tahun Ajaran</Label>
                            <Select
                                value={yearId ? String(yearId) : ''}
                                onValueChange={(v) => setYearId(Number(v))}
                                options={[
                                    { value: '', label: '— Pilih TA —' },
                                    ...academic_years.map((ay) => ({
                                        value: String(ay.id),
                                        label: `${ay.year} ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
                                    })),
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="title">Judul Program</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Program Tahunan BK SMANSAKA 2026/2027"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="desc">Deskripsi</Label>
                        <Textarea
                            id="desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                {akpd_suggestion.length > 0 && akpd_suggestion.some((s) => s.checked_count > 0) && (
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 ring-1 ring-amber-200">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-600" />
                                <h2 className="text-sm font-semibold text-amber-900">
                                    Saran dari Hasil AKPD
                                </h2>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={applyAkpdSuggestion}
                                className="gap-1.5"
                            >
                                <Sparkles className="h-4 w-4" />
                                Terapkan Saran
                            </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {akpd_suggestion.map((s) => (
                                <div key={s.bidang} className="rounded-xl bg-white p-3 text-center">
                                    <Badge variant={bidangBadge(s.bidang)}>
                                        {BIDANG_LABELS[s.bidang]}
                                    </Badge>
                                    <p className="mt-2 text-2xl font-bold text-neutral-900">
                                        {s.percentage}%
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        Prioritas {s.priority}/5
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-amber-800">
                            Saran berdasarkan persentase butir dicentang siswa pada tiap bidang di
                            angket AKPD. Prioritas &amp; jumlah RPL dibuat otomatis — Anda bisa
                            mengubahnya setelah diterapkan.
                        </p>
                    </div>
                )}

                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase">
                            Item Program ({items.length})
                        </h2>
                        <Button variant="secondary" onClick={addBlankItem} className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Tambah Item
                        </Button>
                    </div>

                    {items.length === 0 && (
                        <p className="py-8 text-center text-sm text-neutral-400">
                            Belum ada item. Terapkan saran AKPD di atas atau klik &ldquo;Tambah
                            Item&rdquo;.
                        </p>
                    )}

                    {items.map((item, idx) => {
                        const matchingRpls = rpls.filter((r) => r.bidang === item.bidang);
                        return (
                            <div
                                key={idx}
                                className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={bidangBadge(item.bidang)}>
                                            #{idx + 1} — {BIDANG_LABELS[item.bidang]}
                                        </Badge>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Bidang</Label>
                                        <Select
                                            value={item.bidang}
                                            onValueChange={(v) =>
                                                updateItem(idx, {
                                                    bidang: v as PlanItem['bidang'],
                                                    focus: FOCUS_TEMPLATES[v] ?? item.focus,
                                                })
                                            }
                                            options={[
                                                { value: 'pribadi', label: 'Pribadi' },
                                                { value: 'sosial', label: 'Sosial' },
                                                { value: 'belajar', label: 'Belajar' },
                                                { value: 'karier', label: 'Karier' },
                                            ]}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Prioritas (1–5)</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={item.priority}
                                            onChange={(e) =>
                                                updateItem(idx, {
                                                    priority: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Target RPL</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={item.target_count}
                                            onChange={(e) =>
                                                updateItem(idx, {
                                                    target_count: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Fokus Layanan</Label>
                                    <Textarea
                                        rows={2}
                                        value={item.focus}
                                        onChange={(e) => updateItem(idx, { focus: e.target.value })}
                                    />
                                </div>

                                {matchingRpls.length > 0 && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">
                                            Kaitkan RPL BK ({item.rpl_ids.length} dipilih)
                                        </Label>
                                        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2">
                                            {matchingRpls.map((r) => (
                                                <label
                                                    key={r.id}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={item.rpl_ids.includes(r.id)}
                                                        onChange={() => toggleRpl(idx, r.id)}
                                                        className="rounded"
                                                    />
                                                    <span className="flex-1 text-neutral-700">
                                                        {r.title}
                                                    </span>
                                                    <span className="text-xs text-neutral-400">
                                                        {r.service_type}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3">
                    <Link href={route('annual.index')}>
                        <Button type="button" variant="secondary">
                            Batal
                        </Button>
                    </Link>
                    <Button onClick={onSubmit} disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Program'}
                    </Button>
                </div>
            </div>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
