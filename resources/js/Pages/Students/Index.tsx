import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useSelection } from '@/hooks/useSelection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Plus,
    Pencil,
    Trash2,
    Upload,
    Camera,
    FileSpreadsheet,
    Users,
    X,
    Search,
    UserPlus,
} from 'lucide-react';
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
import { Lightbox } from '@/Components/ui/Lightbox';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, Student, SchoolClass, PaginatedData } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface ParentItem {
    id: number;
    name: string;
    relation: 'ayah' | 'ibu' | 'wali';
    phone: string | null;
    photo_url: string;
}

interface GuardianProfile {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
    email: string | null;
    occupation: string | null;
    address: string | null;
    photo_url: string;
}

interface StudentProfile {
    id: number;
    nis: string;
    nisn: string | null;
    name: string;
    gender: string;
    birth_place: string | null;
    birth_date: string | null;
    address: string | null;
    phone: string | null;
    religion: string | null;
    status: string;
    class_name: string | null;
    photo_url: string;
    guardians: GuardianProfile[];
}
interface GuardianSuggestion {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
}

const RELATION_OPTS = [
    { value: 'ayah', label: 'Ayah' },
    { value: 'ibu', label: 'Ibu' },
    { value: 'wali', label: 'Wali' },
];
const relationBadgeVariant = (r: string): 'default' | 'info' | 'neutral' =>
    r === 'ayah' ? 'default' : r === 'ibu' ? 'info' : 'neutral';

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
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
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
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    // ── Profile modal state ──
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const importRef = useRef<HTMLInputElement>(null);
    const photoRef = useRef<HTMLInputElement>(null);

    // ── Parents modal state ──
    const [parentsModal, setParentsModal] = useState<{
        open: boolean;
        student: Student | null;
        parents: ParentItem[];
        loading: boolean;
    }>({ open: false, student: null, parents: [], loading: false });
    const [addMode, setAddMode] = useState<'search' | 'create'>('search');
    const [parentSearch, setParentSearch] = useState('');
    const [parentSuggestions, setParentSuggestions] = useState<GuardianSuggestion[]>([]);
    const [parentSuggestOpen, setParentSuggestOpen] = useState(false);
    const [parentSearching, setParentSearching] = useState(false);
    const [newGuardian, setNewGuardian] = useState({
        name: '',
        relation: 'ayah' as 'ayah' | 'ibu' | 'wali',
        phone: '',
    });
    const [parentProcessing, setParentProcessing] = useState(false);
    const parentSearchRef = useRef<HTMLDivElement>(null);
    const parentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (parentSearchRef.current && !parentSearchRef.current.contains(e.target as Node)) {
                setParentSuggestOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openProfile = async (id: number) => {
        setProfile(null);
        setProfileOpen(true);
        setProfileLoading(true);
        try {
            const res = await fetch(`/students/${id}/profile`);
            if (res.ok) setProfile(await res.json());
        } finally {
            setProfileLoading(false);
        }
    };

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
            onError: handleError,
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

    const confirmBulkDelete = () => {
        const count = selected.size;
        setProcessing(true);
        router.delete(route('students.bulk-destroy'), {
            data: { ids: Array.from(selected) },
            onSuccess: () => {
                setBulkDeleteOpen(false);
                clearSelection();
                toast.success(`${count} siswa berhasil dihapus.`);
            },
            onError: handleError,
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
            onError: handleError,
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
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('students.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    // ── Parents modal handlers ──
    const refreshParentList = async (studentId: number) => {
        const res = await fetch(`/students/${studentId}/parents`);
        if (res.ok) {
            const data: ParentItem[] = await res.json();
            setParentsModal((prev) => ({ ...prev, parents: data }));
        }
    };

    const openParentsModal = async (student: Student) => {
        setParentsModal({ open: true, student, parents: [], loading: true });
        setAddMode('search');
        setParentSearch('');
        setParentSuggestions([]);
        setParentSuggestOpen(false);
        setNewGuardian({ name: '', relation: 'ayah', phone: '' });
        const res = await fetch(`/students/${student.id}/parents`);
        if (res.ok) {
            const data: ParentItem[] = await res.json();
            setParentsModal((prev) => ({ ...prev, parents: data, loading: false }));
        } else {
            setParentsModal((prev) => ({ ...prev, loading: false }));
        }
    };

    const handleParentSearch = (value: string) => {
        setParentSearch(value);
        if (parentDebounceRef.current) clearTimeout(parentDebounceRef.current);
        if (value.trim().length < 2) {
            setParentSuggestions([]);
            setParentSuggestOpen(false);
            return;
        }
        parentDebounceRef.current = setTimeout(async () => {
            setParentSearching(true);
            try {
                const res = await fetch(`/parents/lookup?q=${encodeURIComponent(value.trim())}`);
                if (res.ok) {
                    setParentSuggestions(await res.json());
                    setParentSuggestOpen(true);
                }
            } finally {
                setParentSearching(false);
            }
        }, 300);
    };

    const doAttachParent = (parentId: number) => {
        if (!parentsModal.student) return;
        setParentProcessing(true);
        router.post(
            route('students.parents.attach', parentsModal.student.id),
            { parent_id: parentId },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setParentSearch('');
                    setParentSuggestions([]);
                    setParentSuggestOpen(false);
                    refreshParentList(parentsModal.student!.id);
                    toast.success('Orang tua dihubungkan.');
                },
                onError: handleError,
                onFinish: () => setParentProcessing(false),
            },
        );
    };

    const doCreateAndAttach = () => {
        if (!parentsModal.student || !newGuardian.name.trim()) return;
        setParentProcessing(true);
        router.post(route('students.parents.create', parentsModal.student.id), newGuardian, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setNewGuardian({ name: '', relation: 'ayah', phone: '' });
                setAddMode('search');
                refreshParentList(parentsModal.student!.id);
                toast.success('Orang tua baru berhasil ditambahkan dan dihubungkan.');
            },
            onError: handleError,
            onFinish: () => setParentProcessing(false),
        });
    };

    const doDetachParent = (parentId: number) => {
        if (!parentsModal.student) return;
        setParentProcessing(true);
        router.delete(
            route('students.parents.detach', {
                student: parentsModal.student.id,
                parent: parentId,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    refreshParentList(parentsModal.student!.id);
                    toast.success('Hubungan orang tua dihapus.');
                },
                onError: handleError,
                onFinish: () => setParentProcessing(false),
            },
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
                            {selected.size > 0 && (
                                <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4" />
                                    Hapus {selected.size} terpilih
                                </Button>
                            )}
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
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                            checked={isAllPageSelected(
                                                students.data.map((i) => i.id),
                                            )}
                                            onChange={() =>
                                                togglePage(students.data.map((i) => i.id))
                                            }
                                        />
                                    </th>
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
                                        <td colSpan={canWrite ? 8 : 7}>
                                            <EmptyState description="Belum ada data siswa." />
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-primary-50/30 cursor-pointer"
                                            onClick={() => openProfile(item.id)}
                                        >
                                            <td
                                                className="px-4 py-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                    checked={selected.has(item.id)}
                                                    onChange={() => toggle(item.id)}
                                                />
                                            </td>
                                            <td
                                                className="px-4 py-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
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
                                                <td
                                                    className="px-4 py-3"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openParentsModal(item)}
                                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-emerald-50 hover:text-emerald-600"
                                                            title="Kelola Orang Tua"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(item)}
                                                            className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setDeleteModal({ open: true, item })
                                                            }
                                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
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

            <DeleteModal
                open={bulkDeleteOpen}
                onOpenChange={setBulkDeleteOpen}
                title="Hapus Data Terpilih"
                description={`Yakin ingin menghapus ${selected.size} item? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmBulkDelete}
                loading={processing}
            />

            {/* Profile Modal */}
            <Dialog
                open={profileOpen}
                onOpenChange={(open) => {
                    setProfileOpen(open);
                    if (!open) setEnlargedPhoto(null);
                }}
                title="Profil Siswa"
                className="max-w-lg"
            >
                {profileLoading ? (
                    <p className="py-8 text-center text-sm text-neutral-400">Memuat...</p>
                ) : profile ? (
                    <div className="space-y-4">
                        {/* Header: foto + nama + kelas */}
                        <div className="flex items-center gap-4">
                            <div
                                className="ring-primary-100 h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full bg-neutral-100 ring-2"
                                onClick={() =>
                                    profile.photo_url && setEnlargedPhoto(profile.photo_url)
                                }
                            >
                                {profile.photo_url ? (
                                    <img
                                        src={profile.photo_url}
                                        alt={profile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-400">
                                        {profile.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">
                                    {profile.name}
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {profile.class_name ?? 'Tanpa Kelas'}
                                </p>
                                <div className="mt-1 flex gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${profile.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}
                                    >
                                        {profile.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${profile.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}
                                    >
                                        {profile.status.charAt(0).toUpperCase() +
                                            profile.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Detail siswa */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
                            <ProfileDetail label="NIS" value={profile.nis} />
                            <ProfileDetail label="NISN" value={profile.nisn} />
                            <ProfileDetail label="Tempat Lahir" value={profile.birth_place} />
                            <ProfileDetail
                                label="Tanggal Lahir"
                                value={
                                    profile.birth_date
                                        ? format(new Date(profile.birth_date), 'd MMMM yyyy', {
                                              locale: idLocale,
                                          })
                                        : null
                                }
                            />
                            <ProfileDetail label="Telepon" value={profile.phone} />
                            <ProfileDetail label="Agama" value={profile.religion} />
                            <div className="col-span-2">
                                <ProfileDetail label="Alamat" value={profile.address} />
                            </div>
                        </div>

                        {/* Orang tua */}
                        {profile.guardians.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-neutral-700">
                                    Orang Tua / Wali
                                </p>
                                <div className="space-y-2">
                                    {profile.guardians.map((g) => (
                                        <div
                                            key={g.id}
                                            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2"
                                        >
                                            <div
                                                className={`h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200 ${g.photo_url ? 'cursor-pointer' : ''}`}
                                                onClick={() =>
                                                    g.photo_url && setEnlargedPhoto(g.photo_url)
                                                }
                                            >
                                                {g.photo_url ? (
                                                    <img
                                                        src={g.photo_url}
                                                        alt={g.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                                                        {g.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-neutral-900">
                                                    {g.name}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {g.phone ?? '—'}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${g.relation === 'ayah' ? 'bg-primary-100 text-primary-700' : g.relation === 'ibu' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}`}
                                            >
                                                {g.relation.charAt(0).toUpperCase() +
                                                    g.relation.slice(1)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="py-8 text-center text-sm text-neutral-400">
                        Data tidak ditemukan.
                    </p>
                )}
            </Dialog>

            <Lightbox src={enlargedPhoto} onClose={() => setEnlargedPhoto(null)} />

            {/* Parents Modal */}
            <Dialog
                open={parentsModal.open}
                onOpenChange={(open) => {
                    if (!open)
                        setParentsModal({
                            open: false,
                            student: null,
                            parents: [],
                            loading: false,
                        });
                }}
                title="Kelola Orang Tua / Wali"
                description={parentsModal.student?.name}
                className="max-w-lg"
            >
                <div className="space-y-4">
                    {/* Current linked parents */}
                    <div>
                        <p className="mb-2 text-sm font-medium text-neutral-700">
                            Orang Tua Terhubung
                        </p>
                        {parentsModal.loading ? (
                            <p className="text-sm text-neutral-400">Memuat...</p>
                        ) : parentsModal.parents.length === 0 ? (
                            <p className="rounded-lg bg-neutral-50 py-4 text-center text-sm text-neutral-400">
                                Belum ada orang tua terhubung.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {parentsModal.parents.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2"
                                    >
                                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                                            {p.photo_url ? (
                                                <img
                                                    src={p.photo_url}
                                                    alt={p.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                                                    {p.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-neutral-900">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {p.phone ?? '—'}
                                            </p>
                                        </div>
                                        <Badge variant={relationBadgeVariant(p.relation)}>
                                            {p.relation.charAt(0).toUpperCase() +
                                                p.relation.slice(1)}
                                        </Badge>
                                        {canWrite && (
                                            <button
                                                onClick={() => doDetachParent(p.id)}
                                                disabled={parentProcessing}
                                                className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                                title="Hapus hubungan"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {canWrite && (
                        <>
                            {/* Tab toggle */}
                            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
                                <button
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition ${
                                        addMode === 'search'
                                            ? 'bg-white text-neutral-900 shadow-sm'
                                            : 'text-neutral-500 hover:text-neutral-700'
                                    }`}
                                    onClick={() => setAddMode('search')}
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    Cari yang ada
                                </button>
                                <button
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition ${
                                        addMode === 'create'
                                            ? 'bg-white text-neutral-900 shadow-sm'
                                            : 'text-neutral-500 hover:text-neutral-700'
                                    }`}
                                    onClick={() => setAddMode('create')}
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Buat baru
                                </button>
                            </div>

                            {addMode === 'search' ? (
                                <div ref={parentSearchRef} className="relative">
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={parentSearch}
                                            onChange={(e) => handleParentSearch(e.target.value)}
                                            placeholder="Ketik nama orang tua..."
                                            className="focus:border-primary-400 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
                                        />
                                        {parentSearching && (
                                            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-neutral-400">
                                                Mencari...
                                            </span>
                                        )}
                                    </div>
                                    {parentSuggestOpen && parentSuggestions.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg">
                                            {parentSuggestions.map((s) => (
                                                <button
                                                    key={s.id}
                                                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-neutral-50 disabled:opacity-50"
                                                    onClick={() => doAttachParent(s.id)}
                                                    disabled={parentProcessing}
                                                >
                                                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">
                                                        {s.name}
                                                    </span>
                                                    <Badge
                                                        variant={relationBadgeVariant(s.relation)}
                                                    >
                                                        {s.relation.charAt(0).toUpperCase() +
                                                            s.relation.slice(1)}
                                                    </Badge>
                                                    <span className="text-xs text-neutral-400">
                                                        {s.phone ?? ''}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {parentSuggestOpen &&
                                        parentSuggestions.length === 0 &&
                                        !parentSearching &&
                                        parentSearch.trim().length >= 2 && (
                                            <div className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-100 bg-white px-3 py-3 text-sm text-neutral-400 shadow-lg">
                                                Tidak ditemukan.
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ng-name">Nama</Label>
                                        <Input
                                            id="ng-name"
                                            value={newGuardian.name}
                                            onChange={(e) =>
                                                setNewGuardian((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="Nama lengkap"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Hubungan</Label>
                                            <Select
                                                value={newGuardian.relation}
                                                onValueChange={(v) =>
                                                    setNewGuardian((prev) => ({
                                                        ...prev,
                                                        relation: v as 'ayah' | 'ibu' | 'wali',
                                                    }))
                                                }
                                                options={RELATION_OPTS}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="ng-phone">Telepon</Label>
                                            <Input
                                                id="ng-phone"
                                                value={newGuardian.phone}
                                                onChange={(e) =>
                                                    setNewGuardian((prev) => ({
                                                        ...prev,
                                                        phone: e.target.value,
                                                    }))
                                                }
                                                placeholder="Opsional"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={doCreateAndAttach}
                                        disabled={!newGuardian.name.trim() || parentProcessing}
                                        className="w-full"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {parentProcessing ? 'Menyimpan...' : 'Simpan & Hubungkan'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Dialog>
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}

function ProfileDetail({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="font-medium text-neutral-800">{value || '—'}</p>
        </div>
    );
}
