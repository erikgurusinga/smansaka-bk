import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
}

export function InputError({ message, className, ...props }: Props) {
    if (!message) return null;

    return (
        <p className={cn('text-danger-700 mt-1 text-sm', className)} {...props}>
            {message}
        </p>
    );
}
