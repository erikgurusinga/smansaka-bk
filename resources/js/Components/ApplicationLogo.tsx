import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends HTMLAttributes<HTMLDivElement> {
    size?: number;
}

export function ApplicationLogo({ size = 48, className, ...props }: Props) {
    return (
        <div
            className={cn(
                'bg-primary-600 inline-flex items-center justify-center rounded-2xl font-bold text-white shadow-md',
                className,
            )}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
            {...props}
        >
            BK
        </div>
    );
}
