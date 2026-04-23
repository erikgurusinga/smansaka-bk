import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const EMPTY_SENTINEL = '__empty__';

export function Select({
    value,
    onValueChange,
    options,
    placeholder = 'Pilih...',
    disabled,
    className,
}: SelectProps) {
    const toInternal = (v: string) => (v === '' ? EMPTY_SENTINEL : v);
    const toExternal = (v: string) => (v === EMPTY_SENTINEL ? '' : v);

    return (
        <RadixSelect.Root
            value={toInternal(value)}
            onValueChange={(v) => onValueChange(toExternal(v))}
            disabled={disabled}
        >
            <RadixSelect.Trigger
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm',
                    'focus:border-primary-400 focus:ring-primary-100 focus:ring-2 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'data-[placeholder]:text-neutral-400',
                    className,
                )}
            >
                <RadixSelect.Value placeholder={placeholder} />
                <RadixSelect.Icon>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                </RadixSelect.Icon>
            </RadixSelect.Trigger>

            <RadixSelect.Portal>
                <RadixSelect.Content
                    className="z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
                    position="popper"
                    sideOffset={4}
                >
                    <RadixSelect.Viewport className="p-1">
                        {options.map((opt) => (
                            <RadixSelect.Item
                                key={opt.value}
                                value={toInternal(opt.value)}
                                className={cn(
                                    'relative flex cursor-pointer items-center rounded-lg px-8 py-2 text-sm outline-none',
                                    'hover:bg-primary-50 hover:text-primary-700',
                                    'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700',
                                    'data-[state=checked]:font-medium',
                                )}
                            >
                                <RadixSelect.ItemIndicator className="absolute left-2 flex items-center">
                                    <Check className="text-primary-600 h-3.5 w-3.5" />
                                </RadixSelect.ItemIndicator>
                                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                            </RadixSelect.Item>
                        ))}
                    </RadixSelect.Viewport>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    );
}
