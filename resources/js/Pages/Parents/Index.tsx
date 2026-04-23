import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useSelection } from '@/hooks/useSelection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Camera, Upload } from 'lucide-react';
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
import { PageProps, Guardian, PaginatedData } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const schema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    relation: z.enum(['ayah', 'ibu', 'wali'], { required_error: 'Hubungan wajib dipilih' }),
    phone: z.string().optional(),
    email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
    occupation: z.string().optional(),
    address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    parents: PaginatedData<Guardian>;
    filters: { search?: string; relation?: string; per_page?: string };
}

const RELATION_OPTIONS = [
    { value: 'ayah', label: 'Ayah' },
    { value: 'ibu', label: 'Ibu' },
    { value: 'wali', label: 'Wali' },
];

const relationBadge = (r: string): 'default' | 'info' | 'neutral' => {
    if (r === 'ayah') return 'default';
    if (r === 'ibu') return 'info';
    return 'neutral';
};

interface PopoverStudent {
    id: number;
    nis: string;
    name: string;
    gender: 'L' | 'P';
    status: string;
    class_name: string | null;
    photo_url: string;
}

export default function ParentsIndex({ parents, filters, permissions }: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Guardian | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<Guardian | null>(null);
    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [photoModal, setPhotoModal] = useState<{ open: boolean; item: Guardian | null }>({
        open: false,
        item: null,
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const photoRef = useRef<HTMLInputElement>(null);

    const [popover, setPopover] = useState<{
        parentId: number;
        parentName: string;
        students: PopoverStudent[] | null;
        loading: boolean;
        x: number;
        y: number;
    } | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setPopover(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openStudentsPopover = async (e: React.MouseEvent, item: Guardian) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPopover({
            parentId: item.id,
            parentName: item.name,
            students: null,
            loading: true,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 6,
        });
        try {
            const res = await fetch(`/parents/${item.id}/students`);
            if (res.ok) {
                const data: PopoverStudent[] = await res.json();
                setPopover((prev) => (prev ? { ...prev, students: data, loading: false } : null));
            }
        } catch {
            setPopover((prev) => (prev ? { ...prev, loading: false } : null));
        }
    };

    const canWrite = permissions['parents']?.write;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const openCreate = () => {
        reset({ name: '', relation: 'ayah', phone: '', email: '', occupation: '', address: '' });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: Guardian) => {
        reset({
            name: item.name,
            relation: item.relation,
            phone: item.phone ?? '',
            email: item.email ?? '',
            occupation: item.occupation ?? '',
            address: item.address ?? '',
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const method = editing ? 'put' : 'post';
        const url = editing ? route('parents.update', editing.id) : route('parents.store');

        router[method](url, data, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'Data diperbarui.' : 'Orang tua ditambahkan.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('parents.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Data dihapus.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.delete(route('parents.bulk-destroy'), {
            data: { ids: Array.from(selected) },
            onSuccess: () => {
                setBulkDeleteOpen(false);
                clearSelection();
                toast.success(`${selected.size} item dihapus.`);
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const submitPhoto = () => {
        if (!photoModal.item || !photoFile) return;
        setProcessing(true);
        router.post(route('parents.photo', photoModal.item.id), { photo: photoFile } as never, {
            forceFormData: true,
            onSuccess: () => {
                setPhotoModal({ open: false, item: null });
                setPhotoFile(null);
                toast.success('Foto diperbarui.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('parents.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Master Data' },
                { label: 'Orang Tua / Wali', href: route('parents.index') },
            ]}
        >
            <Head title="Orang Tua / Wali" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Orang Tua / Wali</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Data kontak orang tua dan wali siswa
                        </p>
                    </div>
                    {canWrite && (
                        <div className="flex gap-2">
                            {selected.size > 0 && (
                                <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4" />
                                    Hapus {selected.size} terpilih
                                </Button>
                            )}
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Tambah
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari nama / telepon..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-56"
                            />
                            <Select
                                value={filters.relation ?? ''}
                                onValueChange={(v) => handleFilter('relation', v)}
                                options={[{ value: '', label: 'Semua' }, ...RELATION_OPTIONS]}
                                className="w-36"
                            />
                        </div>
                        <PerPageSelect
                            value={Number(filters.per_page ?? 15)}
                            onChange={(v) => handleFilter('per_page', String(v))}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                            checked={isAllPageSelected(
                                                parents.data.map((i) => i.id),
                                            )}
                                            onChange={() =>
                                                togglePage(parents.data.map((i) => i.id))
                                            }
                                        />
                                    </th>
                                    <th className="w-12 px-4 py-3"></th>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">Hubungan</th>
                                    <th className="px-4 py-3">Telepon</th>
                                    <th className="px-4 py-3">Pekerjaan</th>
                                    <th className="px-4 py-3 text-center">Anak</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {parents.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 8 : 7}>
                                            <EmptyState description="Belum ada data orang tua." />
                                        </td>
                                    </tr>
                                ) : (
                                    parents.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                    checked={selected.has(item.id)}
                                                    onChange={() => toggle(item.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <div
                                                    className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full bg-neutral-100"
                                                    onClick={() =>
                                                        canWrite &&
                                                        setPhotoModal({ open: true, item })
                                                    }
                                                >
                                                    {item.photo_url ? (
                                                        <img
                                                            src={item.photo_url}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                                                            {item.name.charAt(0)}
                                                        </span>
                                                    )}
                                                    {canWrite && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/30">
                                                            <Camera className="h-3 w-3 text-white opacity-0 transition hover:opacity-100" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={relationBadge(item.relation)}>
                                                    {item.relation.charAt(0).toUpperCase() +
                                                        item.relation.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.phone ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.occupation ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={(e) => openStudentsPopover(e, item)}
                                                    className="hover:bg-primary-100 hover:text-primary-700 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 transition-colors"
                                                    title="Lihat daftar siswa"
                                                >
                                                    {item.students_count ?? 0}
                                                </button>
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
                                                                setDeleteModal({ open: true, item })
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
                            meta={parents}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Orang Tua / Wali' : 'Tambah Orang Tua / Wali'}
                className="max-w-xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="p-name">Nama Lengkap</Label>
                            <Input id="p-name" {...register('name')} />
                            <InputError message={errors.name?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Hubungan</Label>
                            <Select
                                value={watch('relation') ?? ''}
                                onValueChange={(v) =>
                                    setValue('relation', v as 'ayah' | 'ibu' | 'wali')
                                }
                                options={RELATION_OPTIONS}
                            />
                            <InputError message={errors.relation?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="p-phone">Telepon</Label>
                            <Input id="p-phone" {...register('phone')} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="p-email">Email</Label>
                            <Input id="p-email" type="email" {...register('email')} />
                            <InputError message={errors.email?.message} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="p-occupation">Pekerjaan</Label>
                            <Input id="p-occupation" {...register('occupation')} />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="p-address">Alamat</Label>
                            <Textarea id="p-address" rows={3} {...register('address')} />
                        </div>
                    </div>

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
                title="Hapus Orang Tua"
                description={`Hapus data "${deleteModal.item?.name}"?`}
                onConfirm={confirmDelete}
                loading={processing}
            />

            <DeleteModal
                open={bulkDeleteOpen}
                onOpenChange={setBulkDeleteOpen}
                title="Hapus Data Terpilih"
                description={`Yakin ingin menghapus ${selected.size} item? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmBulkDelete}
                loading={processing}
            />

            <Dialog
                open={photoModal.open}
                onOpenChange={(open) => {
                    setPhotoModal({ open, item: photoModal.item });
                    setPhotoFile(null);
                }}
                title="Update Foto Orang Tua"
                description={photoModal.item?.name}
            >
                <div className="space-y-4">
                    <div
                        className="hover:border-primary-400 hover:bg-primary-50/30 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 p-8"
                        onClick={() => photoRef.current?.click()}
                    >
                        {photoFile ? (
                            <img
                                src={URL.createObjectURL(photoFile)}
                                alt="preview"
                                className="h-32 w-32 rounded-full object-cover"
                            />
                        ) : (
                            <>
                                <Upload className="mb-2 h-8 w-8 text-neutral-300" />
                                <p className="text-sm text-neutral-500">Klik untuk pilih foto</p>
                                <p className="text-xs text-neutral-400">
                                    JPG, PNG, WebP — maks 2 MB
                                </p>
                            </>
                        )}
                        <input
                            ref={photoRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setPhotoModal({ open: false, item: null })}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitPhoto} disabled={!photoFile || processing}>
                            {processing ? 'Mengupload...' : 'Simpan Foto'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* ── Popover siswa terhubung ── */}
            {popover && (
                <div
                    ref={popoverRef}
                    className="fixed z-50 w-72 rounded-xl border border-neutral-100 bg-white shadow-xl"
                    style={{ left: popover.x, top: popover.y, transform: 'translateX(-50%)' }}
                >
                    <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2.5">
                        <div>
                            <p className="text-xs font-semibold text-neutral-800">
                                {popover.parentName}
                            </p>
                            <p className="text-xs text-neutral-400">Siswa terhubung</p>
                        </div>
                        <button
                            onClick={() => setPopover(null)}
                            className="rounded p-0.5 text-neutral-400 hover:text-neutral-600"
                        >
                            ✕
                        </button>
                    </div>

                    {popover.loading ? (
                        <p className="py-5 text-center text-xs text-neutral-400">Memuat…</p>
                    ) : !popover.students || popover.students.length === 0 ? (
                        <p className="py-5 text-center text-xs text-neutral-400">
                            Belum ada siswa terhubung.
                        </p>
                    ) : (
                        <ul className="max-h-56 divide-y divide-neutral-50 overflow-y-auto">
                            {popover.students.map((s) => (
                                <li key={s.id} className="flex items-center gap-2.5 px-3 py-2">
                                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                                        {s.photo_url ? (
                                            <img
                                                src={s.photo_url}
                                                alt={s.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                                                {s.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-neutral-900">
                                            {s.name}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {s.nis}
                                            {s.class_name ? ` · ${s.class_name}` : ''}
                                        </p>
                                    </div>
                                    <Badge variant={s.gender === 'L' ? 'info' : 'default'}>
                                        {s.gender}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
