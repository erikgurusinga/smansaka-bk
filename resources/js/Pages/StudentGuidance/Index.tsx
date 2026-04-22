import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Dialog } from '@/Components/ui/Dialog';
import { DeleteModal } from '@/Components/ui/DeleteModal';
import { Select } from '@/Components/ui/Select';
import { Label } from '@/Components/ui/Label';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, User, Student, AcademicYear, PaginatedData } from '@/types';

interface Assignment {
    student_id: number;
    user_id: number;
    academic_year_id: number;
    student: Student;
    teacher: User;
    academic_year: AcademicYear;
}

interface Props extends PageProps {
    assignments: PaginatedData<Assignment>;
    bk_teachers: User[];
    unassigned_students: Student[];
    active_year: AcademicYear | null;
    filters: { teacher_id?: string; search?: string; per_page?: string };
}

export default function StudentGuidanceIndex({
    assignments,
    bk_teachers,
    unassigned_students,
    active_year,
    filters,
    permissions,
}: Props) {
    const { flash } = usePage<Props>().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Assignment | null }>({
        open: false,
        item: null,
    });
    const [processing, setProcessing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');

    const canWrite = permissions['students']?.write;

    const teacherOptions = bk_teachers.map((t) => ({ value: String(t.id), label: t.name }));
    const studentOptions = unassigned_students.map((s) => ({
        value: String(s.id),
        label: `${s.name} (${s.nis})`,
    }));

    const submitAssign = () => {
        if (!selectedStudent || !selectedTeacher || !active_year) return;
        setProcessing(true);
        router.post(
            route('student-guidance.store'),
            {
                student_id: Number(selectedStudent),
                user_id: Number(selectedTeacher),
                academic_year_id: active_year.id,
            },
            {
                onSuccess: () => {
                    setDialogOpen(false);
                    setSelectedStudent('');
                    setSelectedTeacher('');
                    toast.success('Siswa berhasil ditugaskan.');
                },
                onError: () => toast.error('Terjadi kesalahan.'),
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

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('student-guidance.index'),
            { ...filters, [key]: value, page: 1 },
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
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Tugaskan Siswa
                        </Button>
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
                                value={filters.teacher_id ?? ''}
                                onValueChange={(v) => handleFilter('teacher_id', v)}
                                options={[{ value: '', label: 'Semua Guru BK' }, ...teacherOptions]}
                                className="w-52"
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
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="px-4 py-3">NIS</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Guru BK</th>
                                    {canWrite && <th className="px-4 py-3 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {assignments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canWrite ? 5 : 4}>
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
                                            className="hover:bg-neutral-50/50"
                                        >
                                            <td className="px-4 py-3 font-medium text-neutral-900">
                                                {item.student?.name}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                                {item.student?.nis}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.student?.school_class?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.teacher?.name}
                                            </td>
                                            {canWrite && (
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end">
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
                            meta={assignments}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>

            {/* Assign Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title="Tugaskan Siswa ke Guru BK"
            >
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Siswa</Label>
                        {studentOptions.length === 0 ? (
                            <p className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-400">
                                Semua siswa aktif sudah memiliki Guru BK.
                            </p>
                        ) : (
                            <Select
                                value={selectedStudent}
                                onValueChange={setSelectedStudent}
                                options={[
                                    { value: '', label: 'Pilih siswa...' },
                                    ...studentOptions,
                                ]}
                            />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Guru BK</Label>
                        <Select
                            value={selectedTeacher}
                            onValueChange={setSelectedTeacher}
                            options={[{ value: '', label: 'Pilih Guru BK...' }, ...teacherOptions]}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={submitAssign}
                            disabled={!selectedStudent || !selectedTeacher || processing}
                        >
                            {processing ? 'Menyimpan...' : 'Tugaskan'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            <DeleteModal
                open={deleteModal.open}
                onOpenChange={(open) => setDeleteModal({ open, item: deleteModal.item })}
                title="Hapus Penugasan"
                description={`Hapus penugasan siswa "${deleteModal.item?.student?.name}" dari Guru BK "${deleteModal.item?.teacher?.name}"?`}
                onConfirm={confirmDelete}
                loading={processing}
            />
        </AuthenticatedLayout>
    );
}
