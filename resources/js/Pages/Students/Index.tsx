import { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Upload, Camera, FileSpreadsheet } from 'lucide-react';
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
import { PageProps, Student, SchoolClass, PaginatedData } from '@/types';

const schema = z.object({
    nis: z.string().min(1, 'NIS wajib diisi'),
    nisn: z.string().optional(),
    name: z.string().min(1, 'Nama wajib diisi'),
    gender: z.enum(['L', 'P'], { required_error: 'Jenis kelamin wajib dipilih' }),
    birth_place: z.string().optional(),
    birth_date: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    religion: z.string().optional(),
    class_id: z.string().optional(),
    status: z.enum(['aktif', 'lulus', 'keluar', 'pindah']),
});
type FormData = z.infer<typeof schema>;

interface Props extends PageProps {
    students: PaginatedData<Student>;
    classes: SchoolClass[];
    filters: {
        search?: string;
        class_id?: string;
        status?: string;
        gender?: string;
        per_page?: string;
    };
}

const STATUS_OPTIONS = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'lulus', label: 'Lulus' },
    { value: 'keluar', label: 'Keluar' },
    { value: 'pindah', label: 'Pindah' },
];

const statusBadge = (s: string): 'success' | 'neutral' | 'danger' | 'warning' => {
    const map: Record<string, 'success' | 'neutral' | 'danger' | 'warning'> = {
        aktif: 'success',
        lulus: 'neutral',
        keluar: 'danger',
        pindah: 'warning',
    };
    return map[s] ?? 'neutral';
};

const RELIGION_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map(
    (r) => ({ value: r, label: r }),
);

export default function StudentsIndex({ students, classes, filters, permissions }: Props) {
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Student | null }>({
        open: false,
        item: null,
    });
    const [photoModal, setPhotoModal] = useState<{ open: boolean; item: Student | null }>({
        open: false,
        item: null,
    });
    const [editing, setEditing] = useState<Student | null>(null);
    const [processing, setProcessing] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const importRef = useRef<HTMLInputElement>(null);
    const photoRef = useRef<HTMLInputElement>(null);

    const canWrite = permissions['students']?.write;

    const classOptions = [
        { value: '', label: '— Tanpa Kelas —' },
        ...classes.map((c) => ({ value: String(c.id), label: `${c.name}` })),
    ];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { status: 'aktif', gender: 'L' },
    });

    const openCreate = () => {
        reset({
            nis: '',
            nisn: '',
            name: '',
            gender: 'L',
            birth_place: '',
            birth_date: '',
            address: '',
            phone: '',
            religion: '',
            class_id: '',
            status: 'aktif',
        });
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (item: Student) => {
        reset({
            nis: item.nis,
            nisn: item.nisn ?? '',
            name: item.name,
            gender: item.gender,
            birth_place: item.birth_place ?? '',
            birth_date: item.birth_date ?? '',
            address: item.address ?? '',
            phone: item.phone ?? '',
            religion: item.religion ?? '',
            class_id: item.class_id ? String(item.class_id) : '',
            status: item.status,
        });
        setEditing(item);
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        const payload = { ...data, class_id: data.class_id ? Number(data.class_id) : null };
        const method = editing ? 'put' : 'post';
        const url = editing ? route('students.update', editing.id) : route('students.store');

        router[method](url, payload, {
            onSuccess: () => {
                setDialogOpen(false);
                toast.success(editing ? 'Data siswa diperbarui.' : 'Siswa ditambahkan.');
            },
            onError: () => toast.error('Terjadi kesalahan.'),
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('students.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Siswa dihapus.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const submitPhoto = () => {
        if (!photoModal.item || !photoFile) return;
        setProcessing(true);
        router.post(route('students.photo', photoModal.item.id), { photo: photoFile } as never, {
            forceFormData: true,
            onSuccess: () => {
                setPhotoModal({ open: false, item: null });
                setPhotoFile(null);
                toast.success('Foto diperbarui.');
            },
            onError: () => toast.error('Gagal upload foto.'),
            onFinish: () => setProcessing(false),
        });
    };

    const submitImport = () => {
        if (!importFile) return;
        setProcessing(true);
        router.post(route('students.import'), { file: importFile } as never, {
            forceFormData: true,
            onSuccess: () => {
                setImportOpen(false);
                setImportFile(null);
                toast.success('Import berhasil.');
            },
            onError: () => toast.error('Import gagal.'),
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('students.index'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Master Data' },
                { label: 'Siswa Asuh', href: route('students.index') },
            ]}
        >
            <Head title="Siswa Asuh" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Siswa Asuh</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Data siswa yang ditangani Guru BK
                        </p>
                    </div>
                    {canWrite && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setImportOpen(true)}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Import Excel
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Tambah Siswa
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari nama / NIS / NISN..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-64"
                            />
                            <Select
                                value={filters.class_id ?? ''}
                                onValueChange={(v) => handleFilter('class_id', v)}
                                options={[
                                    { value: '', label: 'Semua Kelas' },
                                    ...classOptions.slice(1),
                                ]}
                                className="w-48"
                            />
                            <Select
                                value={filters.status ?? ''}
                                onValueChange={(v) => handleFilter('status', v)}
                                options={[{ value: '', label: 'Semua Status' }, ...STATUS_OPTIONS]}
                                className="w-36"
                            />
                            <Select
                                value={filters.gender ?? ''}
                                onValueChange={(v) => handleFilter('gender', v)}
                                options={[
                                    { value: '', label: 'Semua JK' },
                                    { value: 'L', label: 'Laki-laki' },
                                    { value: 'P', label: 'Perempuan' },
                                ]}
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
                                    <th className="px-4 py-3">Foto</th>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">NIS</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">JK</th>
                                    <th className="px-4 py-3">Status</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 7 : 6}>
                                            <EmptyState description="Belum ada data siswa." />
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
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
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                                {item.nis}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.school_class?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        item.gender === 'L' ? 'info' : 'default'
                                                    }
                                                >
                                                    {item.gender === 'L' ? 'L' : 'P'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={statusBadge(item.status)}>
                                                    {item.status.charAt(0).toUpperCase() +
                                                        item.status.slice(1)}
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
                            meta={students}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={editing ? 'Edit Siswa' : 'Tambah Siswa'}
                className="max-w-2xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="s-nis">NIS</Label>
                            <Input id="s-nis" {...register('nis')} />
                            <InputError message={errors.nis?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="s-nisn">NISN</Label>
                            <Input id="s-nisn" placeholder="Opsional" {...register('nisn')} />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="s-name">Nama Lengkap</Label>
                            <Input id="s-name" {...register('name')} />
                            <InputError message={errors.name?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Jenis Kelamin</Label>
                            <Select
                                value={watch('gender') ?? 'L'}
                                onValueChange={(v) => setValue('gender', v as 'L' | 'P')}
                                options={[
                                    { value: 'L', label: 'Laki-laki' },
                                    { value: 'P', label: 'Perempuan' },
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Agama</Label>
                            <Select
                                value={watch('religion') ?? ''}
                                onValueChange={(v) => setValue('religion', v)}
                                options={[{ value: '', label: 'Pilih Agama' }, ...RELIGION_OPTIONS]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="s-bplace">Tempat Lahir</Label>
                            <Input id="s-bplace" {...register('birth_place')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="s-bdate">Tanggal Lahir</Label>
                            <Input id="s-bdate" type="date" {...register('birth_date')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="s-phone">Telepon</Label>
                            <Input id="s-phone" {...register('phone')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kelas</Label>
                            <Select
                                value={watch('class_id') ?? ''}
                                onValueChange={(v) => setValue('class_id', v)}
                                options={classOptions}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select
                                value={watch('status') ?? 'aktif'}
                                onValueChange={(v) =>
                                    setValue('status', v as 'aktif' | 'lulus' | 'keluar' | 'pindah')
                                }
                                options={STATUS_OPTIONS}
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="s-address">Alamat</Label>
                            <Textarea id="s-address" rows={2} {...register('address')} />
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

            {/* Photo Modal */}
            <Dialog
                open={photoModal.open}
                onOpenChange={(open) => {
                    setPhotoModal({ open, item: photoModal.item });
                    setPhotoFile(null);
                }}
                title="Update Foto Siswa"
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

            {/* Import Excel Modal */}
            <Dialog open={importOpen} onOpenChange={setImportOpen} title="Import Siswa dari Excel">
                <div className="space-y-4">
                    <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        <p className="font-medium">Format kolom yang diperlukan:</p>
                        <p className="mt-1 font-mono text-xs">
                            nis | nisn | nama | jk | tempat_lahir | tanggal_lahir | alamat | telepon
                            | agama | kelas
                        </p>
                    </div>

                    <div
                        className="hover:border-primary-400 hover:bg-primary-50/30 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 p-8"
                        onClick={() => importRef.current?.click()}
                    >
                        <FileSpreadsheet className="mb-2 h-8 w-8 text-neutral-300" />
                        {importFile ? (
                            <p className="text-sm font-medium text-neutral-700">
                                {importFile.name}
                            </p>
                        ) : (
                            <>
                                <p className="text-sm text-neutral-500">
                                    Klik untuk pilih file Excel
                                </p>
                                <p className="text-xs text-neutral-400">
                                    .xlsx, .xls, .csv — maks 5 MB
                                </p>
                            </>
                        )}
                        <input
                            ref={importRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setImportOpen(false);
                                setImportFile(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitImport} disabled={!importFile || processing}>
                            {processing ? 'Mengimport...' : 'Import'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Siswa"
                description={`Hapus data siswa "${deleteModal.item?.name}" (NIS: ${deleteModal.item?.nis})?`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
