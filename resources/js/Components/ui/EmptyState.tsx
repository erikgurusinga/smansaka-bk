import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export function EmptyState({
    title = 'Tidak ada data',
    description = 'Belum ada data yang tersedia.',
    icon,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-neutral-300">{icon ?? <Inbox className="h-12 w-12" />}</div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="mt-1 text-xs text-neutral-400">{description}</p>
        </div>
    );
}
