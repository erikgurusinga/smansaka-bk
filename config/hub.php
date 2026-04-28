<?php

/*
|--------------------------------------------------------------------------
| Smansaka Admin Hub Configuration
|--------------------------------------------------------------------------
|
| Konfigurasi koneksi ke aplikasi pusat smansaka-admin (data master sekolah).
| Token didapat dari hub via UI: /system/tokens (login sebagai super_admin).
|
*/

return [
    'url'     => rtrim(env('HUB_URL', ''), '/'),
    'token'   => env('HUB_TOKEN', ''),
    'timeout' => (int) env('HUB_TIMEOUT', 15),
];
