import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                ref={ref}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors placeholder:text-neutral-400',
                    'focus:border-primary-400 focus:ring-primary-100 focus:ring-4 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-50',
                    className,
                )}
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';
