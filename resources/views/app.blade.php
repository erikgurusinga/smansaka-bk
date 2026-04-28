<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title inertia>{{ config('app.name', 'BK SMANSAKA') }}</title>

        @php $faviconPath = \App\Models\Setting::where('key','favicon')->value('value'); @endphp
        <link rel="icon" type="image/x-icon" href="{{ $faviconPath ? asset('storage/'.$faviconPath) : asset('favicon.ico') }}" />
        <link rel="manifest" href="{{ asset('manifest.webmanifest') }}" />
        <meta name="theme-color" content="#117481" />

        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
            href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap"
            rel="stylesheet"
        />

        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="h-full font-sans antialiased">
        @inertia
    </body>
</html>
