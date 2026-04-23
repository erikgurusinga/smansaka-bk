import { useState, useCallback } from 'react';

export function useSelection() {
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const toggle = useCallback((id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const togglePage = useCallback((ids: number[]) => {
        setSelected((prev) => {
            const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
            if (allSelected) {
                const next = new Set(prev);
                ids.forEach((id) => next.delete(id));
                return next;
            }
            return new Set([...prev, ...ids]);
        });
    }, []);

    const clearSelection = useCallback(() => setSelected(new Set()), []);

    const isAllPageSelected = useCallback(
        (ids: number[]) => ids.length > 0 && ids.every((id) => selected.has(id)),
        [selected],
    );

    return { selected, toggle, togglePage, clearSelection, isAllPageSelected };
}
