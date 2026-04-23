import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Dialog } from '@/Components/ui/Dialog';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { InputError } from '@/Components/ui/InputError';
import { Select } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, AkpdItem, PaginatedData } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    bidang: z.enum(['pribadi', 'sosial', 'belajar', 'karier']),
    question: z.string().min(3, 'Pertanyaan minimal 3 karakter'),
    sort_order: z.coerce.number().int().optional(),
    is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    items: PaginatedData<AkpdItem>;
    filters: { bidang?: string; search?: string; per_page?: string };
}

const BIDANG_OPTIONS = [
    { value: 'pribadi', label: 'Pribadi' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'belajar', label: 'Belajar' },
    { value: 'karier', label: 'Karier' },
];

const bidangBadge = (b: string): 'info' | 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
        pribadi: 'info',
        sosial: 'success',
        belajar: 'warning',
        karier: 'danger',
    };
    return map[b] ?? 'info';
};

export default function AkpdItems({ items, filters, permissions }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: AkpdItem | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<AkpdItem | null>(null);
    const [processing, setProcessing] = useState(false);

    const canWrite = permissions['instrument_akpd']?.write;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { bidang: 'pribadi', is_active: true },
    });

    const openCreate = () => {
        reset({ bidang: 'pribadi', question: '', sort_order: 0, is_active: true });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: AkpdItem) => {
        reset({
            bidang: item.bidang,
            question: item.question,
            sort_order: item.sort_order,
            is_active: item.is_active,
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const method = editing ? 'put' : 'post';
        const url = editing ? route('akpd.items.update', editing.id) : route('akpd.items.store');

        router[method](url, data, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'Butir AKPD diperbarui.' : 'Butir AKPD ditambahkan.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('akpd.items.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Butir dihapus.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('akpd.items'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'AKPD — Butir', href: route('akpd.items') },
            ]}
        >
            <Head title="AKPD — Butir" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">AKPD — Butir</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Kelola butir Angket Kebutuhan Peserta Didik (4 bidang)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => router.get(route('akpd.responses'))}
                        >
                            Lihat Respons Siswa
                        </Button>
                        {canWrite && (
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Tambah Butir
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari pertanyaan..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-64"
                            />
                            <Select
                                value={filters.bidang ?? ''}
                                onValueChange={(v) => handleFilter('bidang', v)}
                                options={[{ value: '', label: 'Semua Bidang' }, ...BIDANG_OPTIONS]}
                                className="w-44"
                            />
                        </div>
                        <PerPageSelect
                            value={Number(filters.per_page ?? 25)}
                            onChange={(v) => handleFilter('per_page', String(v))}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
                                    <th className="w-16 px-4 py-3">#</th>
                                    <th className="px-4 py-3">Bidang</th>
                                    <th className="px-4 py-3">Pertanyaan</th>
                                    <th className="px-4 py-3">Status</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {items.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 5 : 4}>
                                            <EmptyState description="Belum ada butir AKPD." />
                                        </td>
                                    </tr>
                                ) : (
                                    items.data.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 text-neutral-500">
                                                {(items.current_page - 1) * items.per_page +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={bidangBadge(item.bidang)}>
                                                    {item.bidang.charAt(0).toUpperCase() +
                                                        item.bidang.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700">
                                                {item.question}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={item.is_active ? 'success' : 'neutral'}
                                                >
                                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            {canWrite && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openEdit(item)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setDeleteModal({
                                                                    open: true,
                                                                    item,
                                                                })
                                                            }
                                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={items}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Butir AKPD' : 'Tambah Butir AKPD'}
                className="max-w-xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Bidang</Label>
                        <Select
                            value={watch('bidang') ?? 'pribadi'}
                            onValueChange={(v) => setValue('bidang', v as FormData['bidang'])}
                            options={BIDANG_OPTIONS}
                        />
                        <InputError message={errors.bidang?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="q">Pertanyaan</Label>
                        <Textarea id="q" rows={3} {...register('question')} />
                        <InputError message={errors.question?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sort">Urutan</Label>
                        <Input
                            id="sort"
                            type="number"
                            {...register('sort_order', { valueAsNumber: true })}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                        <input type="checkbox" {...register('is_active')} className="rounded" />
                        Aktif
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDialogOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Butir AKPD"
                description="Butir yang dihapus tidak bisa dikembalikan."
                onConfirm={confirmDelete}
                loading={processing}
            />
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
