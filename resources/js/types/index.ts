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
