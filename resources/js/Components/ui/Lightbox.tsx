import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface LightboxProps {
    src: string | null;
    onClose: () => void;
}

export function Lightbox({ src, onClose }: LightboxProps) {
    return (
        <RadixDialog.Root open={!!src} onOpenChange={(open) => !open && onClose()}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay
                    className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
                    onClick={onClose}
                />
                <RadixDialog.Content
                    className="fixed inset-0 z-[70] flex items-center justify-center focus:outline-none"
                    onPointerDownOutside={onClose}
                >
                    <RadixDialog.Title className="sr-only">Foto</RadixDialog.Title>
                    <RadixDialog.Close
                        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
                        aria-label="Tutup"
                    >
                        <X className="h-5 w-5" />
                    </RadixDialog.Close>
                    {src && (
                        <img
                            src={src}
                            alt=""
                            className="h-auto max-h-[80vh] w-auto max-w-[80vw] cursor-zoom-out rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
                            onClick={onClose}
                        />
                    )}
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}
