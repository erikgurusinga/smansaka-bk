import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['vendor/**', 'node_modules/**', 'public/build/**', 'public/sw.js'] },

    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        files: ['resources/js/**/*.{ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        settings: {
            react: { version: '19.0' },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',     // React 17+ tidak perlu import React
            'react/prop-types': 'off',              // Pakai TypeScript untuk type checking
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },

    prettier, // harus paling terakhir — matikan rules yang bentrok dengan Prettier
);
