import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useSelection } from '@/hooks/useSelection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, AlertTriangle, Search, X } from 'lucide-react';
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
import { PageProps, StudentViolation, Violation, AcademicYear, PaginatedData } from '@/types';

interface SchoolClassOption {
    id: number;
    name: string;
    level: string;
}
interface StudentResult {
    id: number;
    nis: string;
    name: string;
    gender: string;
    status: string;
    class_name: string | null;
    photo_url: string;
}
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

const storeSchema = z.object({
    student_id: z.string().min(1, 'Siswa wajib dipilih'),
    violation_id: z.string().min(1, 'Jenis pelanggaran wajib dipilih'),
    academic_year_id: z.string().min(1, 'Tahun ajaran wajib diisi'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().optional(),
    sp_level: z.string().optional(),
});
type StoreData = z.infer<typeof storeSchema>;

const updateSchema = z.object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().optional(),
    status: z.enum(['baru', 'diproses', 'selesai']),
    sp_level: z.string().optional(),
    notes: z.string().optional(),
});
type UpdateData = z.infer<typeof updateSchema>;

interface Props extends PageProps {
    records: PaginatedData<StudentViolation>;
    violations: Violation[];
    classes: SchoolClassOption[];
    academic_years: AcademicYear[];
    active_year: AcademicYear | null;
    point_summary: Record<number, number>;
    filters: {
        search?: string;
        category?: string;
        status?: string;
        sp_level?: string;
        academic_year_id?: string;
        per_page?: string;
    };
}

const CATEGORY_OPTIONS = [
    { value: 'ringan', label: 'Ringan' },
    { value: 'sedang', label: 'Sedang' },
    { value: 'berat', label: 'Berat' },
];

const STATUS_OPTIONS = [
    { value: 'baru', label: 'Baru' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'selesai', label: 'Selesai' },
];

const SP_OPTIONS = [
    { value: 'SP1', label: 'SP1' },
    { value: 'SP2', label: 'SP2' },
    { value: 'SP3', label: 'SP3' },
];

const categoryBadge = (c: string): 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'success' | 'warning' | 'danger'> = {
        ringan: 'success',
        sedang: 'warning',
        berat: 'danger',
    };
    return map[c] ?? 'warning';
};

const statusBadge = (s: string): 'info' | 'warning' | 'success' => {
    const map: Record<string, 'info' | 'warning' | 'success'> = {
        baru: 'info',
        diproses: 'warning',
        selesai: 'success',
    };
    return map[s] ?? 'info';
};

const spColor = (sp: string | null) => {
    if (!sp) return '';
    const map: Record<string, string> = {
        SP1: 'text-amber-700 bg-amber-50',
        SP2: 'text-orange-700 bg-orange-50',
        SP3: 'text-red-700 bg-red-50',
    };
    return map[sp] ?? '';
};

const pointColor = (pts: number) => {
    if (pts >= 75) return 'text-red-700 bg-red-50';
    if (pts >= 50) return 'text-orange-700 bg-orange-50';
    if (pts >= 25) return 'text-amber-700 bg-amber-50';
    return 'text-neutral-700 bg-neutral-100';
};

const formatDate = (d: string) =>
    format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: idLocale });

export default function StudentViolationsIndex({
    records,
    violations,
    classes,
    academic_years,
    active_year,
    point_summary,
    filters,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [createOpen, setCreateOpen] = useState(false);

    // Combobox state for create dialog
    const [svClassFilter, setSvClassFilter] = useState('');
    const [svQuery, setSvQuery] = useState('');
    const [svResults, setSvResults] = useState<StudentResult[]>([]);
    const [svShowDropdown, setSvShowDropdown] = useState(false);
    const [svSelectedStudent, setSvSelectedStudent] = useState<StudentResult | null>(null);
    const svComboRef = useRef<HTMLDivElement>(null);

    const resetCombo = () => {
        setSvClassFilter('');
        setSvQuery('');
        setSvResults([]);
        setSvShowDropdown(false);
        setSvSelectedStudent(null);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (svComboRef.current && !svComboRef.current.contains(e.target as Node))
                setSvShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (svQuery.length < 2) {
            setSvResults([]);
            setSvShowDropdown(false);
            return;
        }
        const timer = setTimeout(async () => {
            const params = new URLSearchParams({ q: svQuery });
            if (svClassFilter) params.set('class_id', svClassFilter);
            const res = await fetch(`/students/lookup?${params}`);
            setSvResults(await res.json());
            setSvShowDropdown(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [svQuery, svClassFilter]);

    const svSelectStudent = (s: StudentResult) => {
        setSvSelectedStudent(s);
        createForm.setValue('student_id', String(s.id));
        setSvQuery('');
        setSvShowDropdown(false);
    };
    const [editModal, setEditModal] = useState<{ open: boolean; item: StudentViolation | null }>({
        open: false,
        item: null,
    });
    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        item: StudentViolation | null;
    }>({
        open: false,
        item: null,
    });
    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const canWrite = permissions['violations']?.write;

    const svClassOptions = [
        { value: '', label: 'Semua Kelas' },
        ...classes.map((c) => ({ value: String(c.id), label: `${c.level} – ${c.name}` })),
    ];

    const violationOptions = [
        { value: '', label: '— Pilih Jenis Pelanggaran —' },
        ...violations.map((v) => ({
            value: String(v.id),
            label: `${v.name} (${v.points} poin)`,
        })),
    ];

    const createForm = useForm<StoreData>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            student_id: '',
            violation_id: '',
            academic_year_id: active_year ? String(active_year.id) : '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            sp_level: '',
        },
    });

    const updateForm = useForm<UpdateData>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            date: '',
            description: '',
            status: 'baru',
            sp_level: '',
            notes: '',
        },
    });

    const openEdit = (item: StudentViolation) => {
        updateForm.reset({
            date: item.date,
            description: item.description ?? '',
            status: item.status,
            sp_level: item.sp_level ?? '',
            notes: item.notes ?? '',
        });
        setEditModal({ open: true, item });
    };

    const onStore = (data: StoreData) => {
        setProcessing(true);
        router.post(route('student-violations.store'), data, {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                resetCombo();
                toast.success('Pelanggaran berhasil dicatat.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const onUpdate = (data: UpdateData) => {
        if (!editModal.item) return;
        setProcessing(true);
        router.put(route('student-violations.update', editModal.item.id), data, {
            onSuccess: () => {
                setEditModal({ open: false, item: null });
                toast.success('Data pelanggaran diperbarui.');
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        router.delete(route('student-violations.destroy', deleteModal.item.id), {
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Catatan pelanggaran dihapus.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.delete(route('student-violations.bulk-destroy'), {
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

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('student-violations.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Kasus & Pelanggaran' },
                { label: 'Poin Pelanggaran', href: route('student-violations.index') },
            ]}
        >
            <Head title="Poin Pelanggaran Siswa" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}
            {flash.error && toast.error(flash.error, { id: 'flash-err' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">Poin Pelanggaran</h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            Catatan pelanggaran siswa dan akumulasi poin
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
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="h-4 w-4" />
                                Catat Pelanggaran
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari nama / NIS siswa..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-56"
                            />
                            <Select
                                value={filters.category ?? ''}
                                onValueChange={(v) => handleFilter('category', v)}
                                options={[
                                    { value: '', label: 'Semua Kategori' },
                                    ...CATEGORY_OPTIONS,
                                ]}
                                className="w-36"
                            />
                            <Select
                                value={filters.status ?? ''}
                                onValueChange={(v) => handleFilter('status', v)}
                                options={[{ value: '', label: 'Semua Status' }, ...STATUS_OPTIONS]}
                                className="w-36"
                            />
                            <Select
                                value={filters.sp_level ?? ''}
                                onValueChange={(v) => handleFilter('sp_level', v)}
                                options={[{ value: '', label: 'Semua SP' }, ...SP_OPTIONS]}
                                className="w-28"
                            />
                            <Select
                                value={filters.academic_year_id ?? ''}
                                onValueChange={(v) => handleFilter('academic_year_id', v)}
                                options={[
                                    { value: '', label: 'Semua TA' },
                                    ...academic_years.map((ay) => ({
                                        value: String(ay.id),
                                        label: `${ay.year} ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`,
                                    })),
                                ]}
                                className="w-44"
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
                                                records.data.map((i) => i.id),
                                            )}
                                            onChange={() =>
                                                togglePage(records.data.map((i) => i.id))
                                            }
                                        />
                                    </th>
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="px-4 py-3">Jenis Pelanggaran</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Poin</th>
                                    <th className="px-4 py-3">Total TA</th>
                                    <th className="px-4 py-3">SP</th>
                                    <th className="px-4 py-3">Status</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {records.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 9 : 8}>
                                            <EmptyState description="Belum ada catatan pelanggaran." />
                                        </td>
                                    </tr>
                                ) : (
                                    records.data.map((item) => {
                                        const totalPts = point_summary[item.student_id] ?? 0;
                                        return (
                                            <tr key={item.id} className="hover:bg-neutral-50/50">
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                        checked={selected.has(item.id)}
                                                        onChange={() => toggle(item.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-neutral-900">
                                                        {item.student?.name ?? '—'}
                                                    </p>
                                                    <p className="text-xs text-neutral-400">
                                                        {item.student?.school_class?.name ??
                                                            'Tanpa Kelas'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-neutral-800">
                                                        {item.violation?.name ?? '—'}
                                                    </p>
                                                    {item.violation && (
                                                        <Badge
                                                            variant={categoryBadge(
                                                                item.violation.category,
                                                            )}
                                                            className="mt-0.5"
                                                        >
                                                            {item.violation.category
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                item.violation.category.slice(1)}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600">
                                                    {formatDate(item.date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-neutral-800">
                                                        {item.violation?.points ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${pointColor(totalPts)}`}
                                                    >
                                                        {totalPts >= 75 && (
                                                            <AlertTriangle className="h-3 w-3" />
                                                        )}
                                                        {totalPts} poin
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.sp_level ? (
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${spColor(item.sp_level)}`}
                                                        >
                                                            {item.sp_level}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-300">—</span>
                                                    )}
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={records}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog
                open={createOpen}
                onOpenChange={(open) => {
                    if (!open) resetCombo();
                    setCreateOpen(open);
                }}
                title="Catat Pelanggaran Siswa"
                className="max-w-lg"
            >
                <form onSubmit={createForm.handleSubmit(onStore)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Siswa</Label>
                        {svSelectedStudent ? (
                            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                                {svSelectedStudent.photo_url ? (
                                    <img
                                        src={svSelectedStudent.photo_url}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="bg-primary-100 text-primary-700 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                                        {svSelectedStudent.name[0]}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-neutral-900">
                                        {svSelectedStudent.name}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {svSelectedStudent.nis}
                                        {svSelectedStudent.class_name &&
                                            ` · ${svSelectedStudent.class_name}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSvSelectedStudent(null);
                                        createForm.setValue('student_id', '');
                                        setSvQuery('');
                                    }}
                                    className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div ref={svComboRef} className="space-y-2">
                                <div className="flex gap-2">
                                    <Select
                                        value={svClassFilter}
                                        onValueChange={(v) => {
                                            setSvClassFilter(v);
                                            setSvResults([]);
                                            setSvShowDropdown(false);
                                        }}
                                        options={svClassOptions}
                                        className="w-40 shrink-0"
                                    />
                                    <div className="relative flex-1">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <Input
                                            placeholder="Ketik nama atau NIS..."
                                            value={svQuery}
                                            onChange={(e) => setSvQuery(e.target.value)}
                                            onFocus={() =>
                                                svResults.length > 0 && setSvShowDropdown(true)
                                            }
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                {svShowDropdown && (
                                    <div className="rounded-xl border border-neutral-200 bg-white shadow-lg">
                                        {svResults.length === 0 ? (
                                            <p className="px-4 py-3 text-sm text-neutral-500">
                                                Siswa tidak ditemukan.
                                            </p>
                                        ) : (
                                            <ul className="max-h-48 divide-y divide-neutral-50 overflow-y-auto">
                                                {svResults.map((s) => (
                                                    <li key={s.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => svSelectStudent(s)}
                                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
                                                        >
                                                            {s.photo_url ? (
                                                                <img
                                                                    src={s.photo_url}
                                                                    alt=""
                                                                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="bg-primary-100 text-primary-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                                    {s.name[0]}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-neutral-900">
                                                                    {s.name}
                                                                </p>
                                                                <p className="text-xs text-neutral-500">
                                                                    {s.nis}
                                                                    {s.class_name &&
                                                                        ` · ${s.class_name}`}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <InputError message={createForm.formState.errors.student_id?.message} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Jenis Pelanggaran</Label>
                        <Select
                            value={createForm.watch('violation_id') ?? ''}
                            onValueChange={(v) => createForm.setValue('violation_id', v)}
                            options={violationOptions}
                        />
                        <InputError message={createForm.formState.errors.violation_id?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-date">Tanggal Kejadian</Label>
                            <Input id="sv-date" type="date" {...createForm.register('date')} />
                            <InputError message={createForm.formState.errors.date?.message} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Level SP (Opsional)</Label>
                            <Select
                                value={createForm.watch('sp_level') ?? ''}
                                onValueChange={(v) => createForm.setValue('sp_level', v)}
                                options={[{ value: '', label: '— Tanpa SP —' }, ...SP_OPTIONS]}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sv-desc">Keterangan</Label>
                        <Textarea
                            id="sv-desc"
                            rows={2}
                            placeholder="Opsional — kronologi singkat, saksi, dll."
                            {...createForm.register('description')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setCreateOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Catat Pelanggaran'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editModal.open}
                onOpenChange={(open) => setEditModal({ open, item: editModal.item })}
                title="Edit Catatan Pelanggaran"
                description={`${editModal.item?.student?.name ?? ''} — ${editModal.item?.violation?.name ?? ''}`}
                className="max-w-lg"
            >
                <form onSubmit={updateForm.handleSubmit(onUpdate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="eu-date">Tanggal Kejadian</Label>
                            <Input id="eu-date" type="date" {...updateForm.register('date')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Level SP</Label>
                            <Select
                                value={updateForm.watch('sp_level') ?? ''}
                                onValueChange={(v) => updateForm.setValue('sp_level', v)}
                                options={[{ value: '', label: '— Tanpa SP —' }, ...SP_OPTIONS]}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Status Penanganan</Label>
                        <Select
                            value={updateForm.watch('status') ?? 'baru'}
                            onValueChange={(v) =>
                                updateForm.setValue('status', v as 'baru' | 'diproses' | 'selesai')
                            }
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="eu-desc">Keterangan Kejadian</Label>
                        <Textarea id="eu-desc" rows={2} {...updateForm.register('description')} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="eu-notes">Catatan Penanganan</Label>
                        <Textarea
                            id="eu-notes"
                            rows={2}
                            placeholder="Tindak lanjut yang sudah dilakukan..."
                            {...updateForm.register('notes')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditModal({ open: false, item: null })}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Catatan Pelanggaran"
                description={`Hapus catatan pelanggaran "${deleteModal.item?.violation?.name}" untuk ${deleteModal.item?.student?.name}?`}
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
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}
