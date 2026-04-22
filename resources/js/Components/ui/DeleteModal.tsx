import { Dialog } from './Dialog';
import { Button } from './Button';

interface DeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirm: () => void;
    loading?: boolean;
}

export function DeleteModal({
    open,
    onOpenChange,
    title = 'Hapus Data',
    description = 'Tindakan ini tidak dapat dibatalkan.',
    onConfirm,
    loading,
}: DeleteModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
                    Batal
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={loading}>
                    {loading ? 'Menghapus...' : 'Hapus'}
                </Button>
            </div>
        </Dialog>
    );
}
