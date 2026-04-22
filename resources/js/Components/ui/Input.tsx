import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                ref={ref}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors placeholder:text-neutral-400',
                    'focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
                    className,
                )}
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';
