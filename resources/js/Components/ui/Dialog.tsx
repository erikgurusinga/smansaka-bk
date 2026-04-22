import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function Dialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
}: DialogProps) {
    return (
        <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
                <RadixDialog.Content
                    className={cn(
                        'fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
                        'rounded-2xl bg-white shadow-xl ring-1 ring-neutral-100',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        className,
                    )}
                >
                    <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                        <div>
                            <RadixDialog.Title className="text-base font-semibold text-neutral-900">
                                {title}
                            </RadixDialog.Title>
                            {description && (
                                <RadixDialog.Description className="mt-0.5 text-sm text-neutral-500">
                                    {description}
                                </RadixDialog.Description>
                            )}
                        </div>
                        <RadixDialog.Close className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
                            <X className="h-4 w-4" />
                        </RadixDialog.Close>
                    </div>
                    <div className="px-6 py-5">{children}</div>
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}
