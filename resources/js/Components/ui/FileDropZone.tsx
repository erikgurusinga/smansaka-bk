import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
    accept?: string;
    maxSizeMb?: number;
    currentUrl?: string | null;
    shape?: 'square' | 'circle' | 'wide';
    onFile: (file: File) => void;
    onRemove?: () => void;
    label?: string;
    hint?: string;
    className?: string;
    uploading?: boolean;
}

export function FileDropZone({
    accept = 'image/*',
    maxSizeMb = 2,
    currentUrl,
    shape = 'square',
    onFile,
    onRemove,
    label = 'Klik atau seret file ke sini',
    hint,
    className,
    uploading = false,
}: FileDropZoneProps) {
    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            setError(null);
            if (file.size > maxSizeMb * 1024 * 1024) {
                setError(`Ukuran file maksimal ${maxSizeMb} MB`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
            onFile(file);
        },
        [maxSizeMb, onFile],
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const displayUrl = preview ?? currentUrl;

    const isCircle = shape === 'circle';
    const isWide = shape === 'wide';

    return (
        <div className={cn('space-y-1.5', className)}>
            <div
                onClick={() => !uploading && inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all',
                    dragOver
                        ? 'border-primary-400 bg-primary-50 scale-[0.98]'
                        : 'hover:border-primary-300 hover:bg-primary-50/60 border-neutral-200 bg-neutral-50',
                    uploading && 'cursor-wait opacity-60',
                    isCircle ? 'h-24 w-24 rounded-full' : isWide ? 'h-36 w-full' : 'h-32 w-32',
                )}
            >
                {displayUrl ? (
                    <>
                        <img
                            src={displayUrl}
                            alt="Preview"
                            className={cn(
                                'object-contain',
                                isCircle
                                    ? 'h-full w-full rounded-full object-cover'
                                    : 'max-h-28 max-w-full p-2',
                            )}
                        />
                        {onRemove && !uploading && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreview(null);
                                    onRemove();
                                }}
                                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        {/* Overlay saat hover */}
                        <div
                            className={cn(
                                'absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all group-hover:opacity-100 hover:bg-black/20 hover:opacity-100',
                                isCircle && 'rounded-full',
                            )}
                        >
                            <Upload className="h-5 w-5 text-white drop-shadow" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-200">
                            <ImageIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="px-3 text-center text-xs leading-tight text-neutral-500">
                            {uploading ? 'Mengunggah...' : label}
                        </p>
                    </>
                )}
            </div>

            {hint && <p className="text-xs text-neutral-400">{hint}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                }}
            />
        </div>
    );
}
