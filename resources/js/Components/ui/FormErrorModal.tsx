import { AlertTriangle } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errors: Record<string, string>;
    title?: string;
}

export function FormErrorModal({
    open,
    onOpenChange,
    errors,
    title = 'Gagal Menyimpan Data',
}: Props) {
    const messages = Object.entries(errors);

    return (
        <Dialog open={open} onOpenChange={onOpenChange} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">
                        {messages.length > 0
                            ? 'Perbaiki kesalahan berikut sebelum menyimpan data:'
                            : 'Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator.'}
                    </p>
                </div>

                {messages.length > 0 && (
                    <ul className="space-y-2">
                        {messages.map(([field, msg]) => (
                            <li key={field} className="flex items-start gap-2.5 text-sm">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                <span className="text-neutral-700">{msg}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex justify-end pt-1">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
