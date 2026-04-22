<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: dejavusans, sans-serif; font-size: 10.5pt; color: #1a1a1a; line-height: 1.55; }

    .header-doc { border-bottom: 2.5pt solid #117481; padding-bottom: 8pt; margin-bottom: 12pt; }
    .header-doc h1 { font-size: 13pt; font-weight: bold; color: #117481; }
    .header-doc p { font-size: 9pt; color: #555; }

    .title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.5pt; margin-bottom: 4pt; }
    .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 14pt; }

    table.meta { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
    table.meta td { padding: 4pt 6pt; border: 0.5pt solid #d1d5db; vertical-align: top; font-size: 10pt; }
    table.meta td.label { width: 30%; background: #f3f4f6; color: #374151; font-weight: bold; }

    .section { margin-bottom: 10pt; page-break-inside: avoid; }
    .section-label { font-size: 8.5pt; font-weight: bold; text-transform: uppercase;
                     letter-spacing: 0.5pt; color: #117481; margin-bottom: 4pt;
                     border-bottom: 0.5pt solid #d1fae5; padding-bottom: 2pt; }
    .section-body { font-size: 10pt; white-space: pre-wrap; color: #1a1a1a; min-height: 16pt; padding: 4pt 0; }

    .ttd-block { margin-top: 24pt; text-align: right; }
    .ttd-block .place-date { font-size: 10pt; margin-bottom: 46pt; }
    .ttd-block .name { border-top: 1pt solid #555; display: inline-block; min-width: 150pt;
                       padding-top: 3pt; font-weight: bold; font-size: 10pt; text-align: center; }
    .ttd-block .role { font-size: 9pt; color: #555; text-align: center; }

    .footer-doc { margin-top: 14pt; text-align: center; font-size: 8.5pt; color: #888;
                  border-top: 0.5pt solid #ddd; padding-top: 5pt; }
</style>
</head>
<body>

<div class="header-doc">
    <h1>SMA Negeri 1 Kabanjahe</h1>
    <p>Jl. Veteran No.1, Kabanjahe, Karo, Sumatera Utara &mdash; Layanan Bimbingan &amp; Konseling</p>
</div>

<div class="title">Rencana Pelaksanaan Layanan (RPL)</div>
<div class="subtitle">{{ $rpl->title }}</div>

<table class="meta">
    <tr>
        <td class="label">Bidang Layanan</td>
        <td>{{ ucfirst($rpl->bidang) }}</td>
        <td class="label">Jenis Layanan</td>
        <td>{{ ucfirst($rpl->service_type) }}</td>
    </tr>
    <tr>
        <td class="label">Kelas Sasaran</td>
        <td>{{ $rpl->class_level === 'semua' ? 'Semua Kelas' : 'Kelas ' . $rpl->class_level }}</td>
        <td class="label">Alokasi Waktu</td>
        <td>{{ $rpl->duration_minutes }} menit</td>
    </tr>
    <tr>
        <td class="label">Semester</td>
        <td>{{ ucfirst($rpl->semester) }}</td>
        <td class="label">Tahun Ajaran</td>
        <td>{{ $rpl->academicYear->year ?? '—' }} {{ ucfirst($rpl->academicYear->semester ?? '') }}</td>
    </tr>
    <tr>
        <td class="label">Guru BK</td>
        <td colspan="3">{{ $rpl->counselor->name ?? '—' }}</td>
    </tr>
</table>

<div class="section">
    <div class="section-label">A. Tujuan Layanan</div>
    <div class="section-body">{{ $rpl->objective }}</div>
</div>

@if($rpl->method)
<div class="section">
    <div class="section-label">B. Metode / Teknik</div>
    <div class="section-body">{{ $rpl->method }}</div>
</div>
@endif

@if($rpl->materials)
<div class="section">
    <div class="section-label">C. Media / Materi</div>
    <div class="section-body">{{ $rpl->materials }}</div>
</div>
@endif

@if($rpl->activities)
<div class="section">
    <div class="section-label">D. Langkah Kegiatan</div>
    <div class="section-body">{{ $rpl->activities }}</div>
</div>
@endif

@if($rpl->evaluation)
<div class="section">
    <div class="section-label">E. Evaluasi</div>
    <div class="section-body">{{ $rpl->evaluation }}</div>
</div>
@endif

<div class="ttd-block">
    <div class="place-date">Kabanjahe, {{ now()->translatedFormat('d F Y') }}</div>
    <div class="name">{{ $rpl->counselor->name ?? '—' }}</div>
    <div class="role">Guru Bimbingan &amp; Konseling</div>
</div>

<div class="footer-doc">
    Dicetak {{ now()->translatedFormat('d F Y, H:i') }} WIB &mdash; SMA Negeri 1 Kabanjahe
</div>

</body>
</html>
