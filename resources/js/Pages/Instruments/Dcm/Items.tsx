import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Pagination } from '@/Components/ui/Pagination';
import { PerPageSelect } from '@/Components/ui/PerPageSelect';
import { SearchInput } from '@/Components/ui/SearchInput';
import { Select } from '@/Components/ui/Select';
import { EmptyState } from '@/Components/ui/EmptyState';
import { PageProps, DcmItem, PaginatedData } from '@/types';

interface Props extends PageProps {
    items: PaginatedData<DcmItem>;
    topics: string[];
    filters: { topic?: string; search?: string; per_page?: string };
}

export default function DcmItems({ items, topics, filters }: Props) {
    const { flash } = usePage<Props>().props;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('dcm.items'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: 'Instrumen BK' },
                { label: 'DCM — Butir', href: route('dcm.items') },
            ]}
        >
            <Head title="DCM — Butir" />

            {flash.success && toast.success(flash.success, { id: 'flash' })}

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900">
                            DCM — Daftar Cek Masalah
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            240 butir, terbagi dalam 12 topik masalah
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => router.get(route('dcm.responses'))}>
                        Lihat Respons Siswa
                    </Button>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            <SearchInput
                                placeholder="Cari pertanyaan..."
                                defaultValue={filters.search}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="w-64"
                            />
                            <Select
                                value={filters.topic ?? ''}
                                onValueChange={(v) => handleFilter('topic', v)}
                                options={[
                                    { value: '', label: 'Semua Topik' },
                                    ...topics.map((t) => ({ value: t, label: t })),
                                ]}
                                className="w-60"
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
                                    <th className="w-16 px-4 py-3">#</th>
                                    <th className="px-4 py-3">Topik</th>
                                    <th className="px-4 py-3">Pertanyaan</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {items.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>
                                            <EmptyState description="Belum ada butir DCM." />
                                        </td>
                                    </tr>
                                ) : (
                                    items.data.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/50">
                                            <td className="px-4 py-3 text-neutral-500">
                                                {(items.current_page - 1) * items.per_page +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600">
                                                {item.topic_order}. {item.topic}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700">
                                                {item.question}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={item.is_active ? 'success' : 'neutral'}
                                                >
                                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-neutral-100 p-4">
                        <Pagination
                            meta={items}
                            onPageChange={(p) => handleFilter('page', String(p))}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
