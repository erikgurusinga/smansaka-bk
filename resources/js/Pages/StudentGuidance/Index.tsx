import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useSelection } from '@/hooks/useSelection';
import { Plus, Trash2, UserCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Dialog } from '@/Components/ui/Dialog';
import { Lightbox } from '@/Components/ui/Lightbox';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { Select } from '@/Components/ui/Select';
import { Label } from '@/Components/ui/Label';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, User, Student, AcademicYear, PaginatedData } from '@/types';
import { FormErrorModal } from '@/Components/ui/FormErrorModal';
import { useFormError } from '@/hooks/useFormError';

interface GuardianProfile {
    id: number;
    name: string;
    relation: 'ayah' | 'ibu' | 'wali';
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
    gender: 'L' | 'P';
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

interface BkTeacher {
    id: number;
    name: string;
}

interface SimpleClass {
    id: number;
    name: string;
    level: number;
}

interface Assignment {
    student_id: number;
    user_id: number;
    academic_year_id: number;
    student: Student;
    teacher: User;
    teacher_display_name: string;
    academic_year: AcademicYear;
}

interface Props extends PageProps {
    assignments: PaginatedData<Assignment>;
    bk_teachers: BkTeacher[];
    unassigned_students: Student[];
    active_year: AcademicYear | null;
    classes: SimpleClass[];
    filters: { teacher_id?: string; class_id?: string; search?: string; per_page?: string };
}

export default function StudentGuidanceIndex({
    assignments,
    bk_teachers,
    unassigned_students,
    active_year,
    classes,
    filters,
    permissions,
}: Props) {
    const { errorOpen, setErrorOpen, formErrors, handleError } = useFormError();
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Assignment | null }>({
        open: false,
        item: null,
    });
    const [processing, setProcessing] = useState(false);
    const { selected, toggle, togglePage, clearSelection, isAllPageSelected } = useSelection();
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    // ── Profile modal state ──
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

    const openProfile = async (studentId: number) => {
        setProfile(null);
        setProfileLoading(true);
        setProfileOpen(true);
        try {
            const res = await fetch(`/students/${studentId}/profile`);
            if (res.ok) setProfile(await res.json());
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Assign modal state ──
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [classFilter, setClassFilter] = useState('');

    const canWrite = permissions['students']?.write;

    const teacherOptions = bk_teachers.map((t) => ({ value: String(t.id), label: t.name }));
    const classOptions = classes.map((c) => ({ value: String(c.id), label: c.name }));

    // Classes that actually have unassigned students (for modal filter)
    const modalClassOptions = useMemo(() => {
        const ids = new Set(unassigned_students.map((s) => s.class_id).filter(Boolean));
        return classes
            .filter((c) => ids.has(c.id))
            .map((c) => ({ value: String(c.id), label: c.name }));
    }, [unassigned_students, classes]);

    // Students shown in the checklist based on class filter
    const filteredStudents = useMemo(
        () =>
            classFilter
                ? unassigned_students.filter((s) => String(s.class_id) === classFilter)
                : unassigned_students,
        [unassigned_students, classFilter],
    );

    const allFilteredSelected =
        filteredStudents.length > 0 &&
        filteredStudents.every((s) => selectedStudents.includes(s.id));

    const someFilteredSelected =
        filteredStudents.some((s) => selectedStudents.includes(s.id)) && !allFilteredSelected;

    const toggleStudent = (id: number) =>
        setSelectedStudents((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );

    const toggleAllFiltered = () => {
        const ids = filteredStudents.map((s) => s.id);
        if (allFilteredSelected) {
            setSelectedStudents((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            setSelectedStudents((prev) => [...new Set([...prev, ...ids])]);
        }
    };

    const openDialog = () => {
        setSelectedStudents([]);
        setSelectedTeacher('');
        setClassFilter('');
        setDialogOpen(true);
    };

    const submitAssign = () => {
        if (selectedStudents.length === 0 || !selectedTeacher || !active_year) return;
        setProcessing(true);
        router.post(
            route('student-guidance.store'),
            {
                student_ids: selectedStudents,
                user_id: Number(selectedTeacher),
                academic_year_id: active_year.id,
            },
            {
                onSuccess: () => {
                    setDialogOpen(false);
                    setSelectedStudents([]);
                    setSelectedTeacher('');
                    setClassFilter('');
                    toast.success(
                        selectedStudents.length === 1
                            ? 'Siswa berhasil ditugaskan.'
                            : `${selectedStudents.length} siswa berhasil ditugaskan.`,
                    );
                },
                onError: handleError,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteModal.item) return;
        setProcessing(true);
        const { student_id, user_id, academic_year_id } = deleteModal.item;
        router.delete(route('student-guidance.destroy'), {
            data: { student_id, user_id, academic_year_id },
            onSuccess: () => {
                setDeleteModal({ open: false, item: null });
                toast.success('Penugasan dihapus.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const confirmBulkDelete = () => {
        const count = selected.size;
        setProcessing(true);
        router.delete(route('student-guidance.bulk-destroy'), {
            data: {
                student_ids: Array.from(selected),
                academic_year_id: active_year?.id,
            },
            onSuccess: () => {
                setBulkDeleteOpen(false);
                clearSelection();
                toast.success(`${count} penugasan berhasil dihapus.`);
            },
            onError: handleError,
            onFinish: () => setProcessing(false),
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('student-guidance.index'),
            { ...filters, [key]: value, ...(key !== 'page' && { page: 1 }) },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Master Data' },
                { label: 'Siswa Asuh / Penugasan', href: route('student-guidance.index') },
            ]}
        >
            <Head title="Penugasan Siswa Asuh" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            Penugasan Siswa Asuh
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            {active_year
                                ? `TA ${active_year.year} ${active_year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}`
                                : 'Tidak ada tahun ajaran aktif'}
                        </p>
                    </div>
                    {canWrite && active_year && (
                        <div className="flex gap-2">
                            {selected.size > 0 && (
                                <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4" />
                                    Hapus {selected.size} terpilih
                                </Button>
                            )}
                            <Button onClick={openDialog}>
                                <Plus className="h-4 w-4" />
                                Tugaskan Siswa
                            </Button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari siswa / NIS..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-56"
                            />
                            <Select
                                value={filters.class_id ?? ''}
                                onValueChange={(v) => handleFilter('class_id', v)}
                                options={[{ value: '', label: 'Semua Kelas' }, ...classOptions]}
                                className="w-44"
                            />
                            <Select
                                value={filters.teacher_id ?? ''}
                                onValueChange={(v) => handleFilter('teacher_id', v)}
                                options={[{ value: '', label: 'Semua Guru BK' }, ...teacherOptions]}
                                className="w-56"
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
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                            checked={isAllPageSelected(
                                                assignments.data.map((i) => i.student?.id ?? 0),
                                            )}
                                            onChange={() =>
                                                togglePage(
                                                    assignments.data.map((i) => i.student?.id ?? 0),
                                                )
                                            }
                                        />
                                    </th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="px-4 py-3">NIS</th>
                                    <th className="px-4 py-3">Guru BK</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {assignments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState
                                                icon={<UserCheck className="h-12 w-12" />}
                                                title="Belum ada penugasan"
                                                description="Klik 'Tugaskan Siswa' untuk menetapkan Guru BK ke siswa."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    assignments.data.map((item) => (
                                        <tr
                                            key={`${item.student_id}-${item.user_id}`}
                                            className="hover:bg-neutral-50"
                                        >
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                                    checked={selected.has(item.student?.id ?? 0)}
                                                    onChange={() => toggle(item.student?.id ?? 0)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.student?.school_class?.name ?? (
                                                    <span className="text-neutral-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.student?.name}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                                {item.student?.nis}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.teacher_display_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openProfile(item.student_id)}
                                                        className="hover:bg-primary-50 hover:text-primary-600 rounded-lg p-1.5 text-neutral-400"
                                                        title="Lihat Profil"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {canWrite && (
                                                        <button
                                                            onClick={() =>
                                                                setDeleteModal({ open: true, item })
                                                            }
                                                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={assignments}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            {/* Assign Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedStudents([]);
                        setSelectedTeacher('');
                        setClassFilter('');
                    }
                    setDialogOpen(open);
                }}
                title="Tugaskan Siswa ke Guru BK"
                className="max-w-xl"
            >
                <div className="space-y-4">
                    {/* Guru BK */}
                    <div className="space-y-1.5">
                        <Label>Guru BK</Label>
                        <Select
                            value={selectedTeacher}
                            onValueChange={setSelectedTeacher}
                            options={[{ value: '', label: 'Pilih Guru BK...' }, ...teacherOptions]}
                        />
                    </div>

                    {/* Student checklist */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Pilih Siswa</Label>
                            {unassigned_students.length > 0 && (
                                <span className="text-xs text-neutral-400">
                                    {selectedStudents.length} dipilih dari{' '}
                                    {unassigned_students.length} siswa belum ditugaskan
                                </span>
                            )}
                        </div>

                        {unassigned_students.length === 0 ? (
                            <p className="rounded-xl border border-neutral-200 px-3 py-3 text-center text-sm text-neutral-400">
                                Semua siswa aktif sudah memiliki Guru BK.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-neutral-200">
                                {/* Filter kelas + Pilih Semua */}
                                <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
                                    <Select
                                        value={classFilter}
                                        onValueChange={(v) => {
                                            setClassFilter(v);
                                        }}
                                        options={[
                                            { value: '', label: 'Semua Kelas' },
                                            ...modalClassOptions,
                                        ]}
                                        className="w-44 text-xs"
                                    />
                                    <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
                                        <input
                                            type="checkbox"
                                            checked={allFilteredSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = someFilteredSelected;
                                            }}
                                            onChange={toggleAllFiltered}
                                            className="text-primary-600 h-4 w-4 rounded border-neutral-300"
                                        />
                                        Pilih Semua
                                        {classFilter ? ' Kelas Ini' : ''}
                                    </label>
                                </div>

                                {/* Scrollable student list */}
                                <div className="max-h-72 divide-y divide-neutral-50 overflow-y-auto">
                                    {filteredStudents.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-neutral-400">
                                            Tidak ada siswa belum ditugaskan di kelas ini.
                                        </p>
                                    ) : (
                                        filteredStudents.map((s) => (
                                            <label
                                                key={s.id}
                                                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-neutral-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(s.id)}
                                                    onChange={() => toggleStudent(s.id)}
                                                    className="text-primary-600 h-4 w-4 shrink-0 rounded border-neutral-300"
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-neutral-900">
                                                        {s.name}
                                                    </span>
                                                    <span className="font-mono text-xs text-neutral-400">
                                                        {s.nis}
                                                    </span>
                                                </span>
                                                {!classFilter && s.school_class && (
                                                    <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                                                        {s.school_class.name}
                                                    </span>
                                                )}
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={submitAssign}
                            disabled={
                                selectedStudents.length === 0 || !selectedTeacher || processing
                            }
                        >
                            {processing
                                ? 'Menyimpan...'
                                : selectedStudents.length > 0
                                  ? `Tugaskan ${selectedStudents.length} Siswa`
                                  : 'Tugaskan'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Penugasan"
                description={`Hapus penugasan siswa "${deleteModal.item?.student?.name}" dari Guru BK "${deleteModal.item?.teacher_display_name}"?`}
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

            {/* ── Modal Profil Siswa ── */}
            <Dialog
                open={profileOpen}
                onOpenChange={(open) => {
                    setProfileOpen(open);
                    if (!open) setProfile(null);
                }}
                title={profile?.name ?? 'Profil Siswa'}
                description={
                    profile
                        ? `NIS ${profile.nis}${profile.class_name ? ' · ' + profile.class_name : ''}`
                        : undefined
                }
                className="max-w-2xl"
            >
                {profileLoading ? (
                    <div className="py-14 text-center text-sm text-neutral-400">
                        Memuat data siswa…
                    </div>
                ) : profile ? (
                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="flex gap-5">
                            <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                                {profile.photo_url ? (
                                    <img
                                        src={profile.photo_url}
                                        alt={profile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-300">
                                        {profile.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                                <ProfileDetail label="NIS" value={profile.nis} />
                                <ProfileDetail label="NISN" value={profile.nisn ?? '—'} />
                                <ProfileDetail label="Kelas" value={profile.class_name ?? '—'} />
                                <ProfileDetail
                                    label="Jenis Kelamin"
                                    value={profile.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                />
                                <ProfileDetail
                                    label="Tempat Lahir"
                                    value={profile.birth_place ?? '—'}
                                />
                                <ProfileDetail
                                    label="Tanggal Lahir"
                                    value={
                                        profile.birth_date
                                            ? format(new Date(profile.birth_date), 'd MMMM yyyy', {
                                                  locale: idLocale,
                                              })
                                            : '—'
                                    }
                                />
                                <ProfileDetail label="Agama" value={profile.religion ?? '—'} />
                                <ProfileDetail label="Telepon" value={profile.phone ?? '—'} />
                                <div className="col-span-2">
                                    <ProfileDetail
                                        label="Status"
                                        value={
                                            profile.status.charAt(0).toUpperCase() +
                                            profile.status.slice(1)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {profile.address && (
                            <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
                                <p className="mb-0.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                                    Alamat
                                </p>
                                <p className="text-neutral-700">{profile.address}</p>
                            </div>
                        )}

                        {profile.guardians.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-3 text-sm font-semibold text-neutral-700">
                                    Orang Tua / Wali
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {profile.guardians.map((g) => (
                                        <div
                                            key={g.id}
                                            className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                                        >
                                            <div
                                                className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200 transition ${g.photo_url ? 'hover:ring-primary-400 cursor-zoom-in hover:ring-2 hover:ring-offset-1' : ''}`}
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
                                                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-400">
                                                        {g.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="text-sm font-medium text-neutral-900">
                                                        {g.name}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            g.relation === 'ayah'
                                                                ? 'default'
                                                                : g.relation === 'ibu'
                                                                  ? 'info'
                                                                  : 'neutral'
                                                        }
                                                    >
                                                        {g.relation.charAt(0).toUpperCase() +
                                                            g.relation.slice(1)}
                                                    </Badge>
                                                </div>
                                                {g.occupation && (
                                                    <p className="mt-0.5 text-xs text-neutral-500">
                                                        {g.occupation}
                                                    </p>
                                                )}
                                                {g.phone && (
                                                    <p className="text-xs text-neutral-500">
                                                        {g.phone}
                                                    </p>
                                                )}
                                                {g.email && (
                                                    <p className="truncate text-xs text-neutral-500">
                                                        {g.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {profile.guardians.some((g) => g.address) && (
                                    <div className="mt-3 space-y-2">
                                        {profile.guardians
                                            .filter((g) => g.address)
                                            .map((g) => (
                                                <div
                                                    key={g.id}
                                                    className="rounded-xl bg-neutral-50 px-4 py-2.5 text-sm"
                                                >
                                                    <p className="mb-0.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                                                        Alamat{' '}
                                                        {g.relation.charAt(0).toUpperCase() +
                                                            g.relation.slice(1)}
                                                    </p>
                                                    <p className="text-neutral-700">{g.address}</p>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}
            </Dialog>

            <Lightbox src={enlargedPhoto} onClose={() => setEnlargedPhoto(null)} />
            <FormErrorModal open={errorOpen} onOpenChange={setErrorOpen} errors={formErrors} />
        </AuthenticatedLayout>
    );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="font-medium text-neutral-800">{value}</p>
        </div>
    );
}
