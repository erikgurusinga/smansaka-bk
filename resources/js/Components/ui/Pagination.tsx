import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaginatedData } from '@/types';

interface PaginationProps {
    meta: Pick<PaginatedData<unknown>, 'current_page' | 'last_page' | 'from' | 'to' | 'total'>;
    onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
    const { current_page, last_page, from, to, total } = meta;

    const pages = buildPages(current_page, last_page);

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-neutral-500">
                {from && to ? (
                    <>
                        Menampilkan{' '}
                        <span className="font-medium">
                            {from}–{to}
                        </span>{' '}
                        dari <span className="font-medium">{total}</span> data
                    </>
                ) : (
                    'Tidak ada data'
                )}
            </p>

            {last_page > 1 && (
                <div className="flex items-center gap-1">
                    <PageBtn
                        onClick={() => onPageChange(current_page - 1)}
                        disabled={current_page === 1}
                        aria-label="Sebelumnya"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </PageBtn>

                    {pages.map((p, i) =>
                        p === '...' ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-neutral-400">
                                …
                            </span>
                        ) : (
                            <PageBtn
                                key={p}
                                onClick={() => onPageChange(p as number)}
                                active={p === current_page}
                            >
                                {p}
                            </PageBtn>
                        ),
                    )}

                    <PageBtn
                        onClick={() => onPageChange(current_page + 1)}
                        disabled={current_page === last_page}
                        aria-label="Berikutnya"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </PageBtn>
                </div>
            )}
        </div>
    );
}

function PageBtn({
    children,
    onClick,
    disabled,
    active,
    ...rest
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    'aria-label'?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition',
                active
                    ? 'bg-primary-600 font-medium text-white'
                    : 'text-neutral-600 hover:bg-neutral-100',
                disabled && 'cursor-not-allowed opacity-40',
            )}
            {...rest}
        >
            {children}
        </button>
    );
}

function buildPages(current: number, last: number): (number | '...')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];

    if (current > 3) pages.push('...');

    for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
        pages.push(i);
    }

    if (current < last - 2) pages.push('...');

    pages.push(last);

    return pages;
}
