import * as RadixDialog from '@radix-ui/react-dialog';
import { X, Download, FileText } from 'lucide-react';

interface Props {
    src: string;
    name: string;
    open: boolean;
    onClose: () => void;
    canDownload?: boolean;
}

export function PdfViewer({ src, name, open, onClose, canDownload = false }: Props) {
    return (
        <RadixDialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                <RadixDialog.Content
                    className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none md:inset-6 lg:inset-10"
                    aria-describedby={undefined}
                >
                    <RadixDialog.Title className="sr-only">{name}</RadixDialog.Title>

                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                            <span className="truncate text-sm font-medium text-neutral-800">
                                {name}
                            </span>
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-2">
                            {canDownload && (
                                <a
                                    href={src}
                                    download
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Unduh
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                aria-label="Tutup"
                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* PDF iframe */}
                    <iframe src={src} title={name} className="h-full w-full flex-1 border-0" />
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}
