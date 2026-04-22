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

export interface CounselingSession {
    id: number;
    type: 'individual' | 'group';
    counselor_id: number;
    academic_year_id: number;
    date: string;
    start_time: string | null;
    duration_minutes: number | null;
    topic: string;
    description: string | null;
    outcome: string | null;
    next_plan: string | null;
    status: 'dijadwalkan' | 'berlangsung' | 'selesai' | 'dibatalkan';
    is_confidential: boolean;
    created_at: string;
    counselor?: User;
    academic_year?: AcademicYear;
    students?: Student[];
    participants_count?: number;
}

export interface ClassicalGuidance {
    id: number;
    counselor_id: number;
    class_id: number;
    academic_year_id: number;
    date: string;
    topic: string;
    description: string | null;
    method: string | null;
    evaluation: string | null;
    duration_minutes: number | null;
    created_at: string;
    counselor?: User;
    school_class?: SchoolClass;
    academic_year?: AcademicYear;
}

export interface HomeVisit {
    id: number;
    student_id: number;
    counselor_id: number;
    academic_year_id: number;
    date: string;
    purpose: string;
    findings: string | null;
    action_plan: string | null;
    signature_student: string | null;
    signature_parent: string | null;
    signature_counselor: string | null;
    status: 'dijadwalkan' | 'selesai';
    created_at: string;
    student?: Student;
    counselor?: User;
    academic_year?: AcademicYear;
}

export interface CaseConferenceParticipant {
    name: string;
    role: string;
}

export interface CaseConference {
    id: number;
    case_id: number | null;
    counselor_id: number;
    academic_year_id: number;
    date: string;
    topic: string;
    participants: CaseConferenceParticipant[] | null;
    notes: string | null;
    outcome: string | null;
    status: 'dijadwalkan' | 'selesai';
    created_at: string;
    case_record?: CaseRecord;
    counselor?: User;
    academic_year?: AcademicYear;
}

export interface Referral {
    id: number;
    student_id: number;
    case_id: number | null;
    counselor_id: number;
    academic_year_id: number;
    referred_to: string;
    reason: string;
    date: string;
    notes: string | null;
    status: 'aktif' | 'diterima' | 'ditolak' | 'selesai';
    created_at: string;
    student?: Student;
    case_record?: CaseRecord;
    counselor?: User;
    academic_year?: AcademicYear;
}

export interface AkpdItem {
    id: number;
    bidang: 'pribadi' | 'sosial' | 'belajar' | 'karier';
    question: string;
    sort_order: number;
    is_active: boolean;
}

export interface DcmItem {
    id: number;
    topic: string;
    topic_order: number;
    question: string;
    sort_order: number;
    is_active: boolean;
}

export interface SociometryCriterion {
    key: string;
    label: string;
    polarity: 'positive' | 'negative';
}

export interface SociometrySession {
    id: number;
    class_id: number;
    academic_year_id: number;
    counselor_id: number;
    title: string;
    description: string | null;
    criteria: SociometryCriterion[];
    max_choices: number;
    date: string;
    status: 'draft' | 'open' | 'closed';
    created_at: string;
    school_class?: SchoolClass;
    academic_year?: AcademicYear;
    counselor?: User;
}

export interface SociometryChoice {
    id: number;
    session_id: number;
    from_student_id: number;
    to_student_id: number;
    criterion_key: string;
    polarity: 'positive' | 'negative';
    rank: number;
}

export interface CareerAssessment {
    id: number;
    student_id: number;
    academic_year_id: number;
    scores: Record<string, number>;
    dominant_codes: string | null;
    recommendations: string | null;
    notes: string | null;
    completed_at: string | null;
    created_at: string;
    student?: Student;
    academic_year?: AcademicYear;
}

export interface RplBk {
    id: number;
    counselor_id: number;
    academic_year_id: number;
    title: string;
    bidang: 'pribadi' | 'sosial' | 'belajar' | 'karier';
    service_type: 'klasikal' | 'kelompok' | 'individual' | 'konsultasi';
    class_level: 'X' | 'XI' | 'XII' | 'semua';
    duration_minutes: number;
    objective: string;
    method: string | null;
    materials: string | null;
    activities: string | null;
    evaluation: string | null;
    semester: 'ganjil' | 'genap';
    created_at: string;
    counselor?: User;
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
