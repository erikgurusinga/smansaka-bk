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

interface PlanItem {
    bidang: 'pribadi' | 'sosial' | 'belajar' | 'karier';
    priority: number;
    focus: string;
    target_count: number;
    rpl_ids: number[];
}

interface Props extends PageProps {
    program: AnnualProgram;
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

export default function AnnualEdit({ program, rpls }: Props) {
    const [title, setTitle] = useState(program.title);
    const [description, setDescription] = useState(program.description ?? '');
    const [status, setStatus] = useState<'draft' | 'active' | 'completed'>(program.status);
    const [items, setItems] = useState<PlanItem[]>((program.items ?? []) as PlanItem[]);
    const [processing, setProcessing] = useState(false);

    const updateItem = (idx: number, patch: Partial<PlanItem>) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };

    const addBlankItem = () => {
        setItems((prev) => [
            ...prev,
            { bidang: 'pribadi', priority: 3, focus: '', target_count: 2, rpl_ids: [] },
        ]);
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
        if (items.length === 0) {
            toast.error('Minimal satu item bidang harus ada.');
            return;
        }
        setProcessing(true);
        router.put(
            route('annual.update', program.id),
            { title, description: description || undefined, status, items },
            {
                onSuccess: () => toast.success('Program diperbarui.'),
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
                { label: program.title, href: route('annual.show', program.id) },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit — ${program.title}`} />

            <div className="mx-auto max-w-4xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('annual.show', program.id)}>
                        <Button variant="secondary" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-neutral-900">Edit Program Tahunan</h1>
                </div>

                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Judul</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) =>
                                    setStatus(v as 'draft' | 'active' | 'completed')
                                }
                                options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'completed', label: 'Selesai' },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Deskripsi</Label>
                        <Textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

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

                    {items.map((item, idx) => {
                        const matchingRpls = rpls.filter((r) => r.bidang === item.bidang);
                        return (
                            <div
                                key={idx}
                                className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <Badge variant={bidangBadge(item.bidang)}>
                                        #{idx + 1} — {BIDANG_LABELS[item.bidang]}
                                    </Badge>
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
                                    <Label className="text-xs">Fokus</Label>
                                    <Textarea
                                        rows={2}
                                        value={item.focus}
                                        onChange={(e) => updateItem(idx, { focus: e.target.value })}
                                    />
                                </div>

                                {matchingRpls.length > 0 && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">
                                            RPL BK ({item.rpl_ids.length} dipilih)
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
                    <Link href={route('annual.show', program.id)}>
                        <Button type="button" variant="secondary">
                            Batal
                        </Button>
                    </Link>
                    <Button onClick={onSubmit} disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
