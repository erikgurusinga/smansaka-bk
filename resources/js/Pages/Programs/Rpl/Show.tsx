import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { PageProps, RplBk } from '@/types';

interface Props extends PageProps {
    rpl: RplBk;
}

const bidangBadge = (b: string): 'info' | 'success' | 'warning' | 'danger' => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
        pribadi: 'info',
        sosial: 'success',
        belajar: 'warning',
        karier: 'danger',
    };
    return map[b] ?? 'info';
};

export default function RplShow({ rpl }: Props) {
    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Program BK' },
                { label: 'RPL BK', href: route('rpl.index') },
                { label: rpl.title },
            ]}
        >
            <Head title={`RPL — ${rpl.title}`} />

            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('rpl.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">{rpl.title}</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={bidangBadge(rpl.bidang)}>
                                    {rpl.bidang.charAt(0).toUpperCase() + rpl.bidang.slice(1)}
                                </Badge>
                                <Badge variant="neutral">
                                    {rpl.service_type.charAt(0).toUpperCase() +
                                        rpl.service_type.slice(1)}
                                </Badge>
                                <Badge variant={rpl.semester === 'ganjil' ? 'info' : 'warning'}>
                                    {rpl.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <a href={route('rpl.pdf', rpl.id)} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" className="gap-1.5">
                            <FileText className="h-4 w-4" />
                            Cetak PDF
                        </Button>
                    </a>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <Detail label="Konselor" value={rpl.counselor?.name ?? '—'} />
                    <Detail
                        label="Kelas Sasaran"
                        value={
                            rpl.class_level === 'semua' ? 'Semua Kelas' : `Kelas ${rpl.class_level}`
                        }
                    />
                    <Detail label="Durasi" value={`${rpl.duration_minutes} menit`} />
                </div>

                <Section title="Tujuan Layanan">{rpl.objective}</Section>

                {rpl.method && <Section title="Metode / Teknik">{rpl.method}</Section>}
                {rpl.materials && <Section title="Media / Materi">{rpl.materials}</Section>}
                {rpl.activities && <Section title="Langkah Kegiatan">{rpl.activities}</Section>}
                {rpl.evaluation && <Section title="Evaluasi">{rpl.evaluation}</Section>}
            </div>
        </AuthenticatedLayout>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
            <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-800">{value}</p>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                {title}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                {children}
            </p>
        </div>
    );
}
