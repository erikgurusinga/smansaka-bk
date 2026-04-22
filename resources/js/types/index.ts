export interface User {
    id: number;
    username: string;
    name: string;
    email: string | null;
    photo: string | null;
    position: string | null;
    groups: number[] | null;
}

export interface ModulePermission {
    read: boolean;
    write: boolean;
}

export interface Branding {
    site_name: string;
    site_short_name: string;
    logo: string | null;
    favicon: string | null;
}

export interface AcademicYear {
    id: number;
    year: string;
    semester: 'ganjil' | 'genap';
    start_date: string;
    end_date: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    level: 'X' | 'XI' | 'XII';
    academic_year_id: number;
    homeroom_teacher_id: number | null;
    academic_year?: AcademicYear;
    homeroom_teacher?: User;
    students_count?: number;
}

export interface Teacher {
    id: number;
    nip: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    is_bk: boolean;
    user_id: number | null;
    user?: User;
}

export interface Student {
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
    class_id: number | null;
    status: 'aktif' | 'lulus' | 'keluar' | 'pindah';
    school_class?: SchoolClass;
    photo_url?: string | null;
}

export interface Guardian {
    id: number;
    name: string;
    relation: 'ayah' | 'ibu' | 'wali';
    phone: string | null;
    email: string | null;
    occupation: string | null;
    address: string | null;
    students?: Student[];
    students_count?: number;
}

export interface Violation {
    id: number;
    name: string;
    category: 'ringan' | 'sedang' | 'berat';
    points: number;
    description: string | null;
    is_active: boolean;
    student_violations_count?: number;
}

export interface CaseRecord {
    id: number;
    student_id: number;
    reported_by: number;
    academic_year_id: number;
    category: 'akademik' | 'pribadi' | 'sosial' | 'karier' | 'pelanggaran';
    title: string;
    description: string;
    status: 'baru' | 'penanganan' | 'selesai' | 'rujukan';
    is_confidential: boolean;
    visible_to: number[] | null;
    resolved_at: string | null;
    created_at: string;
    student?: Student;
    reporter?: User;
    academic_year?: AcademicYear;
}

export interface StudentViolation {
    id: number;
    student_id: number;
    violation_id: number;
    reported_by: number;
    academic_year_id: number;
    date: string;
    description: string | null;
    status: 'baru' | 'diproses' | 'selesai';
    sp_level: 'SP1' | 'SP2' | 'SP3' | null;
    notes: string | null;
    student?: Student;
    violation?: Violation;
    reporter?: User;
    academic_year?: AcademicYear;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface FlashMessages {
    success?: string;
    error?: string;
    info?: string;
}

export interface PageProps extends Record<string, unknown> {
    auth: {
        user: User | null;
    };
    permissions: Record<string, ModulePermission>;
    branding: Branding;
    academic_year: AcademicYear | null;
    app: {
        name: string;
        url: string;
    };
    flash: FlashMessages;
}
