import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, TrendingUp } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import {
    PageProps,
    SociometrySession,
    SociometryChoice,
    Student,
    SociometryCriterion,
} from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props extends PageProps {
    session: SociometrySession;
    students: Student[];
    choices: SociometryChoice[];
    stats: Record<string, Record<number, number>>;
    answered_student_ids: number[];
}

const fmt = (d: string) => format(new Date(d), 'd MMMM yyyy', { locale: idLocale });

interface Node {
    id: number;
    label: string;
    x: number;
    y: number;
    received: number;
}

function layoutCircle(
    students: Student[],
    stats: Record<number, number> | undefined,
    cx: number,
    cy: number,
    r: number,
): Node[] {
    const n = students.length;
    if (n === 0) return [];
    return students.map((s, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        return {
            id: s.id,
            label: s.name ?? '',
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
            received: stats?.[s.id] ?? 0,
        };
    });
}

function Sociogram({
    students,
    choices,
    stats,
    criterion,
}: {
    students: Student[];
    choices: SociometryChoice[];
    stats: Record<number, number> | undefined;
    criterion: SociometryCriterion;
}) {
    const W = 720;
    const H = 560;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2 - 60;

    const nodes = useMemo(
        () => layoutCircle(students, stats, cx, cy, r),
        [students, stats, cx, cy, r],
    );
    const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

    const maxReceived = Math.max(1, ...nodes.map((n) => n.received));

    const relevantChoices = choices.filter((c) => c.criterion_key === criterion.key);

    const strokeColor = criterion.polarity === 'positive' ? '#0ea5e9' : '#e11d48';

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
            <defs>
                <marker
                    id={`arrow-${criterion.key}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
                </marker>
            </defs>

            {relevantChoices.map((c) => {
                const from = nodeMap.get(c.from_student_id);
                const to = nodeMap.get(c.to_student_id);
                if (!from || !to) return null;
                return (
                    <line
                        key={`${c.from_student_id}-${c.to_student_id}-${c.criterion_key}-${c.rank}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={strokeColor}
                        strokeOpacity={0.45}
                        strokeWidth={1.2}
                        markerEnd={`url(#arrow-${criterion.key})`}
                    />
                );
            })}

            {nodes.map((n) => {
                const size = 12 + (n.received / maxReceived) * 16;
                const isPopular = n.received >= 3;
                return (
                    <g key={n.id}>
                        <circle
                            cx={n.x}
                            cy={n.y}
                            r={size}
                            fill={isPopular ? '#0f766e' : '#ffffff'}
                            stroke="#0f766e"
                            strokeWidth={2}
                        />
                        <text
                            x={n.x}
                            y={n.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="10"
                            fontWeight="600"
                            fill={isPopular ? '#ffffff' : '#0f766e'}
                        >
                            {n.received}
                        </text>
                        <text
                            x={n.x}
                            y={n.y + size + 12}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#475569"
                        >
                            {n.label.length > 16 ? n.label.slice(0, 14) + '…' : n.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function SociometryShow({
    session,
    students,
    choices,
    stats,
    answered_student_ids,
    permissions,
}: Props) {
    const canWrite = permissions['instrument_sociometry']?.write;
    const criteria = session.criteria ?? [];
    const [activeKey, setActiveKey] = useState<string>(criteria[0]?.key ?? '');
    const activeCriterion = criteria.find((c) => c.key === activeKey) ?? criteria[0];

    const sortedByReceived = useMemo(() => {
        if (!activeCriterion) return [];
        const statForKey = stats[activeCriterion.key] ?? {};
        return [...students]
            .map((s) => ({ ...s, received: statForKey[s.id] ?? 0 }))
            .sort((a, b) => b.received - a.received);
    }, [activeCriterion, stats, students]);

    const totalFilled = answered_student_ids.length;
    const totalStudents = students.length;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'Sosiometri', href: route('sociometry.index') },
                { label: session.title },
            ]}
        >
            <Head title={`Sosiometri — ${session.title}`} />

            <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('sociometry.index')}>
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-neutral-900">
                                {session.title}
                            </h1>
                            <p className="text-sm text-neutral-500">
                                {session.school_class?.name ?? '—'} · {fmt(session.date)} ·{' '}
                                {totalFilled}/{totalStudents} siswa mengisi
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {criteria.map((c) => (
                                <button
                                    key={c.key}
                                    onClick={() => setActiveKey(c.key)}
                                    className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
                                        activeKey === c.key
                                            ? c.polarity === 'positive'
                                                ? 'bg-sky-100 text-sky-800'
                                                : 'bg-rose-100 text-rose-800'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        {activeCriterion && students.length > 0 ? (
                            <Sociogram
                                students={students}
                                choices={choices}
                                stats={stats[activeCriterion.key]}
                                criterion={activeCriterion}
                            />
                        ) : (
                            <p className="py-20 text-center text-sm text-neutral-400">
                                Belum ada data untuk divisualisasikan.
                            </p>
                        )}

                        <p className="mt-3 text-xs text-neutral-400">
                            Lingkaran = siswa. Ukuran lingkaran = jumlah suara yang diterima. Garis
                            = pilihan (mengarah dari pemilih ke yang dipilih).
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                            <div className="mb-3 flex items-center gap-2">
                                <TrendingUp className="text-primary-600 h-4 w-4" />
                                <h2 className="text-sm font-semibold text-neutral-700">
                                    Peringkat per Kriteria
                                </h2>
                            </div>
                            <ol className="space-y-1.5 text-sm">
                                {sortedByReceived.slice(0, 10).map((s, i) => (
                                    <li
                                        key={s.id}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500">
                                                {i + 1}
                                            </span>
                                            <span
                                                className={
                                                    i === 0
                                                        ? 'font-semibold text-neutral-900'
                                                        : 'text-neutral-700'
                                                }
                                            >
                                                {s.name}
                                            </span>
                                        </span>
                                        <Badge
                                            variant={
                                                s.received === 0
                                                    ? 'neutral'
                                                    : i === 0
                                                      ? 'success'
                                                      : 'info'
                                            }
                                        >
                                            {s.received}
                                        </Badge>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                                <ClipboardList className="text-primary-600 h-4 w-4" />
                                Pengisian Siswa
                            </h2>
                            <div className="max-h-80 space-y-1 overflow-y-auto text-sm">
                                {students.map((s) => {
                                    const answered = answered_student_ids.includes(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                                        >
                                            <span className="flex-1 truncate text-neutral-700">
                                                {s.name}
                                            </span>
                                            {canWrite &&
                                                session.status !== 'closed' &&
                                                (answered ? (
                                                    <Link
                                                        href={route('sociometry.fill', [
                                                            session.id,
                                                            s.id,
                                                        ])}
                                                        className="text-primary-600 text-xs hover:underline"
                                                    >
                                                        Ubah
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={route('sociometry.fill', [
                                                            session.id,
                                                            s.id,
                                                        ])}
                                                        className="hover:text-primary-600 text-xs text-neutral-400"
                                                    >
                                                        Isi
                                                    </Link>
                                                ))}
                                            {answered && <Badge variant="success">✓</Badge>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
