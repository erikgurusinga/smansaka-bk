<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: dejavusans, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; }

    .header-doc { text-align: center; border-bottom: 2.5pt solid #117481; padding-bottom: 10pt; margin-bottom: 14pt; }
    .header-doc h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1pt; color: #117481; }
    .header-doc p { font-size: 9.5pt; color: #555; }

    .title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase;
             margin-bottom: 16pt; letter-spacing: 0.5pt; }

    table.info { width: 100%; margin-bottom: 12pt; border-collapse: collapse; }
    table.info td { padding: 3pt 0; vertical-align: top; font-size: 10.5pt; }
    table.info td:first-child { width: 38%; color: #555; }
    table.info td:nth-child(2) { width: 4%; }

    .section { margin-bottom: 12pt; }
    .section-label { font-size: 8.5pt; font-weight: bold; text-transform: uppercase;
                     letter-spacing: 0.5pt; color: #117481; margin-bottom: 4pt;
                     border-bottom: 0.5pt solid #d1fae5; padding-bottom: 2pt; }
    .section-body { font-size: 10.5pt; white-space: pre-wrap; color: #1a1a1a; min-height: 24pt; }

    .sig-table { width: 100%; margin-top: 20pt; border-collapse: collapse; }
    .sig-table td { width: 33.33%; text-align: center; vertical-align: top; padding: 6pt 8pt; }
    .sig-label { font-size: 9.5pt; font-weight: bold; margin-bottom: 6pt; }
    .sig-img { height: 60pt; display: block; margin: 0 auto; }
    .sig-line { border-top: 1pt solid #555; margin-top: 64pt; padding-top: 4pt; font-size: 9.5pt; }

    .footer-doc { margin-top: 18pt; text-align: right; font-size: 9pt; color: #888; border-top: 0.5pt solid #ddd; padding-top: 6pt; }
</style>
</head>
<body>

<div class="header-doc">
    <h1>SMA Negeri 1 Kabanjahe</h1>
    <p>Jl. Veteran No.1, Kabanjahe, Karo, Sumatera Utara &mdash; Bimbingan &amp; Konseling</p>
</div>

<div class="title">Berita Acara Kunjungan Rumah (Home Visit)</div>

<table class="info">
    <tr>
        <td>Nama Siswa</td>
        <td>:</td>
        <td><strong>{{ $visit->student->name ?? '—' }}</strong></td>
    </tr>
    <tr>
        <td>Kelas</td>
        <td>:</td>
        <td>{{ $visit->student->school_class->name ?? 'Tanpa Kelas' }}</td>
    </tr>
    <tr>
        <td>Tanggal Kunjungan</td>
        <td>:</td>
        <td>{{ \Carbon\Carbon::parse($visit->date)->translatedFormat('d F Y') }}</td>
    </tr>
    <tr>
        <td>Guru BK</td>
        <td>:</td>
        <td>{{ $visit->counselor->name ?? '—' }}</td>
    </tr>
    <tr>
        <td>Tahun Ajaran</td>
        <td>:</td>
        <td>{{ $visit->academicYear->year ?? '—' }} {{ ucfirst($visit->academicYear->semester ?? '') }}</td>
    </tr>
    <tr>
        <td>Status</td>
        <td>:</td>
        <td>{{ $visit->status === 'selesai' ? 'Selesai' : 'Dijadwalkan' }}</td>
    </tr>
</table>

<div class="section">
    <div class="section-label">Tujuan Kunjungan</div>
    <div class="section-body">{{ $visit->purpose }}</div>
</div>

@if($visit->findings)
<div class="section">
    <div class="section-label">Temuan / Hasil Kunjungan</div>
    <div class="section-body">{{ $visit->findings }}</div>
</div>
@endif

@if($visit->action_plan)
<div class="section">
    <div class="section-label">Rencana Tindak Lanjut</div>
    <div class="section-body">{{ $visit->action_plan }}</div>
</div>
@endif

<div class="section">
    <div class="section-label">Tanda Tangan</div>
    <table class="sig-table">
        <tr>
            <td>
                <div class="sig-label">Siswa</div>
                @if($visit->signature_student)
                    <img src="{{ $visit->signature_student }}" class="sig-img" alt="TTD Siswa">
                @else
                    <div style="height:64pt;"></div>
                @endif
                <div class="sig-line">{{ $visit->student->name ?? '—' }}</div>
            </td>
            <td>
                <div class="sig-label">Orang Tua / Wali</div>
                @if($visit->signature_parent)
                    <img src="{{ $visit->signature_parent }}" class="sig-img" alt="TTD Ortu">
                @else
                    <div style="height:64pt;"></div>
                @endif
                <div class="sig-line">Orang Tua / Wali</div>
            </td>
            <td>
                <div class="sig-label">Guru BK</div>
                @if($visit->signature_counselor)
                    <img src="{{ $visit->signature_counselor }}" class="sig-img" alt="TTD Guru BK">
                @else
                    <div style="height:64pt;"></div>
                @endif
                <div class="sig-line">{{ $visit->counselor->name ?? '—' }}</div>
            </td>
        </tr>
    </table>
</div>

<div class="footer-doc">
    Dicetak {{ now()->translatedFormat('d F Y, H:i') }} WIB &mdash; SMA Negeri 1 Kabanjahe &mdash; Bimbingan &amp; Konseling
</div>

</body>
</html>
