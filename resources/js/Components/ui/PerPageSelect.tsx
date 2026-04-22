import { Select } from './Select';

interface PerPageSelectProps {
    value: number;
    onChange: (value: number) => void;
}

const options = [10, 15, 25, 50, 100].map((n) => ({ value: String(n), label: `${n} / halaman` }));

export function PerPageSelect({ value, onChange }: PerPageSelectProps) {
    return (
        <Select
            value={String(value)}
            onValueChange={(v) => onChange(Number(v))}
            options={options}
            className="w-36"
        />
    );
}
