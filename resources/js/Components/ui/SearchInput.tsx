import { Search } from 'lucide-react';
import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
                type="search"
                className={cn(
                    'h-10 w-full rounded-xl border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm',
                    'placeholder:text-neutral-400',
                    'focus:border-primary-400 focus:ring-primary-100 focus:ring-2 focus:outline-none',
                    className,
                )}
                {...props}
            />
        </div>
    );
}
