import { useState } from 'react';

export function useFormError() {
    const [errorOpen, setErrorOpen] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleError = (errors: Record<string, string>) => {
        setFormErrors(errors ?? {});
        setErrorOpen(true);
    };

    return { errorOpen, setErrorOpen, formErrors, handleError };
}
