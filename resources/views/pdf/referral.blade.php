<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: dejavusans, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; }

    .header-doc { display: table; width: 100%; border-bottom: 2.5pt solid #117481; padding-bottom: 10pt; margin-bottom: 14pt; }
    .header-logo { display: table-cell; width: 60pt; vertical-align: middle; }
    .header-text { display: table-cell; vertical-align: middle; padding-left: 10pt; }
    .header-text h1 { font-size: 13pt; font-weight: bold; color: #117481; }
    .header-text p { font-size: 9pt; color: #555; }

    .title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase;
             margin-bottom: 4pt; letter-spacing: 0.5pt; }
    .nomor { text-align: center; font-size: 9.5pt; color: #555; margin-bottom: 16pt; }

    table.info { width: 100%; margin-bottom: 14pt; border-collapse: collapse; }
    table.info td { padding: 3pt 0; vertical-align: top; font-size: 10.5pt; }
    table.info td:first-child { width: 38%; color: #555; }
    table.info td:nth-child(2) { width: 4%; }

    .section { margin-bottom: 12pt; }
    .section-label { font-size: 8.5pt; font-weight: bold; text-transform: uppercase;
                     letter-spacing: 0.5pt; color: #117481; margin-bottom: 4pt;
                     border-bottom: 0.5pt solid #d1fae5; padding-bottom: 2pt; }
    .section-body { font-size: 10.5pt; white-space: pre-wrap; color: #1a1a1a; min-height: 20pt; }

    .status-badge { display: inline-block; padding: 2pt 8pt; border-radius: 4pt; font-size: 9.5pt; font-weight: bold; }
    .status-aktif { background: #dbeafe; color: #1d4ed8; }
    .status-diterima { background: #fef9c3; color: #92400e; }
    .status-selesai { background: #d1fae5; color: #065f46; }
    .status-ditolak { background: #f3f4f6; color: #374151; }

    .ttd-block { margin-top: 24pt; text-align: right; }
    .ttd-block .place-date { font-size: 10.5pt; margin-bottom: 50pt; }
    .ttd-block .name { border-top: 1pt solid #555; display: inline-block; min-width: 160pt;
                       padding-top: 4pt; font-weight: bold; font-size: 10.5pt; text-align: center; }
    .ttd-block .role { font-size: 9.5pt; color: #555; text-align: center; }

    .footer-doc { margin-top: 18pt; text-align: center; font-size: 9pt; color: #888; border-top: 0.5pt solid #ddd; padding-top: 6pt; }
</style>
</head>
<body>

<div class="header-doc">
    <div class="header-text">
        <h1>SMA Negeri 1 Kabanjahe</h1>
        <p>Jl. Veteran No.1, Kabanjahe, Karo, Sumatera Utara</p>
        <p>Layanan Bimbingan &amp; Konseling</p>
    </div>
</div>

<div class="title">Surat Rujukan (Referral)</div>
<div class="nomor">Diterbitkan: {{ \Carbon\Carbon::parse($referral->date)->translatedFormat('d F Y') }}</div>

<div class="section">
    <div class="section-label">Data Siswa yang Dirujuk</div>
    <table class="info">
        <tr>
            <td>Nama Siswa</td>
            <td>:</td>
            <td><strong>{{ $referral->student->name ?? '—' }}</strong></td>
        </tr>
        <tr>
            <td>Kelas</td>
            <td>:</td>
            <td>{{ $referral->student->school_class->name ?? 'Tanpa Kelas' }}</td>
        </tr>
        <tr>
            <td>Tahun Ajaran</td>
            <td>:</td>
            <td>{{ $referral->academicYear->year ?? '—' }} {{ ucfirst($referral->academicYear->semester ?? '') }}</td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-label">Detail Rujukan</div>
    <table class="info">
        <tr>
            <td>Dirujuk Ke</td>
            <td>:</td>
            <td><strong>{{ $referral->referred_to }}</strong></td>
        </tr>
        <tr>
            <td>Tanggal Rujukan</td>
            <td>:</td>
            <td>{{ \Carbon\Carbon::parse($referral->date)->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <td>Status</td>
            <td>:</td>
            <td>
                @php
                    $statusMap = ['aktif' => ['label' => 'Aktif', 'class' => 'status-aktif'],
                                  'diterima' => ['label' => 'Diterima', 'class' => 'status-diterima'],
                                  'selesai' => ['label' => 'Selesai', 'class' => 'status-selesai'],
                                  'ditolak' => ['label' => 'Ditolak', 'class' => 'status-ditolak']];
                    $st = $statusMap[$referral->status] ?? ['label' => $referral->status, 'class' => 'status-aktif'];
                @endphp
                <span class="status-badge {{ $st['class'] }}">{{ $st['label'] }}</span>
            </td>
        </tr>
        @if($referral->case_record)
        <tr>
            <td>Terkait Kasus</td>
            <td>:</td>
            <td>{{ $referral->case_record->title }}</td>
        </tr>
        @endif
    </table>
</div>

<div class="section">
    <div class="section-label">Alasan / Dasar Rujukan</div>
    <div class="section-body">{{ $referral->reason }}</div>
</div>

@if($referral->notes)
<div class="section">
    <div class="section-label">Catatan Tambahan</div>
    <div class="section-body">{{ $referral->notes }}</div>
</div>
@endif

<div class="ttd-block">
    <div class="place-date">Kabanjahe, {{ \Carbon\Carbon::parse($referral->date)->translatedFormat('d F Y') }}</div>
    <div class="name">{{ $referral->counselor->name ?? '—' }}</div>
    <div class="role">Guru Bimbingan &amp; Konseling</div>
    <div class="role">SMA Negeri 1 Kabanjahe</div>
</div>

<div class="footer-doc">
    Dicetak {{ now()->translatedFormat('d F Y, H:i') }} WIB &mdash; SMA Negeri 1 Kabanjahe &mdash; Bimbingan &amp; Konseling
</div>

</body>
</html>
