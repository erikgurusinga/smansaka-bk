import { PageProps as AppPageProps } from './index';
import { AxiosInstance } from 'axios';

declare module '@inertiajs/core' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageProps extends AppPageProps {}
}

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    /* Ziggy route() helper — diinject oleh @routes di Blade */
    function route(
        name?: string,
        params?: Record<string, unknown> | (string | number),
        absolute?: boolean,
    ): string;
}

export {};
