<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: dejavusans, sans-serif; font-size: 9.5pt; color: #1a1a1a; line-height: 1.45; }

    .header-doc { border-bottom: 2.5pt solid #117481; padding-bottom: 8pt; margin-bottom: 12pt; }
    .header-doc h1 { font-size: 13pt; font-weight: bold; color: #117481; }
    .header-doc p { font-size: 9pt; color: #555; }

    .title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.5pt; margin-bottom: 3pt; }
    .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 12pt; }

    .section-label { font-size: 9pt; font-weight: bold; text-transform: uppercase;
                     letter-spacing: 0.5pt; color: #117481; margin-bottom: 5pt;
                     border-bottom: 0.5pt solid #d1fae5; padding-bottom: 2pt; margin-top: 10pt; }

    .grid-4 { display: table; width: 100%; margin-bottom: 10pt; }
    .grid-4 .cell { display: table-cell; width: 25%; padding: 6pt 8pt; border: 0.5pt solid #d1d5db;
                    text-align: center; background: #f9fafb; }
    .grid-4 .cell p { font-size: 8pt; color: #6b7280; }
    .grid-4 .cell strong { font-size: 16pt; color: #1a1a1a; }

    .grid-5 { display: table; width: 100%; margin-bottom: 10pt; }
    .grid-5 .cell { display: table-cell; width: 20%; padding: 6pt 4pt; border: 0.5pt solid #d1d5db;
                    text-align: center; background: #f9fafb; }
    .grid-5 .cell p { font-size: 8pt; color: #6b7280; text-transform: capitalize; }
    .grid-5 .cell strong { font-size: 14pt; color: #1a1a1a; }

    table.data { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8pt; }
    table.data th { background: #117481; color: white; padding: 4pt 5pt; text-align: left;
                    font-weight: bold; font-size: 8.5pt; border: 0.5pt solid #117481; }
    table.data td { padding: 3pt 5pt; border: 0.5pt solid #d1d5db; vertical-align: top; }
    table.data tr:nth-child(even) { background: #f9fafb; }

    .empty-note { padding: 6pt; color: #888; font-style: italic; font-size: 9pt;
                  background: #f9fafb; border: 0.5pt dashed #d1d5db; text-align: center; }

    .ttd-block { margin-top: 24pt; text-align: right; page-break-inside: avoid; }
    .ttd-block .place-date { font-size: 10pt; margin-bottom: 46pt; }
    .ttd-block .name { border-top: 1pt solid #555; display: inline-block; min-width: 150pt;
                       padding-top: 3pt; font-weight: bold; font-size: 10pt; text-align: center; }
    .ttd-block .role { font-size: 9pt; color: #555; text-align: center; }

    .footer-doc { margin-top: 14pt; text-align: center; font-size: 8pt; color: #888;
                  border-top: 0.5pt solid #ddd; padding-top: 4pt; }
</style>
</head>
<body>

<div class="header-doc">
    <h1>SMA Negeri 1 Kabanjahe</h1>
    <p>Jl. Veteran No.1, Kabanjahe, Karo, Sumatera Utara &mdash; Layanan Bimbingan &amp; Konseling</p>
</div>

<div class="title">Laporan Bulanan Layanan BK</div>
<div class="subtitle">
    {{ $start->translatedFormat('F Y') }}
    @if($academic_year)
        &mdash; TA {{ $academic_year->year }} {{ ucfirst($academic_year->semester) }}
    @endif
</div>

<div class="section-label">A. Ringkasan Utama</div>
<div class="grid-4">
    <div class="cell">
        <p>Kasus Baru</p>
        <strong>{{ $summary['cases_total'] }}</strong>
    </div>
    <div class="cell">
        <p>Kasus Selesai</p>
        <strong>{{ $summary['cases_resolved'] }}</strong>
    </div>
    <div class="cell">
        <p>Pelanggaran</p>
        <strong>{{ $summary['violations_total'] }}</strong>
    </div>
    <div class="cell">
        <p>Referral</p>
        <strong>{{ $summary['referrals'] }}</strong>
    </div>
</div>

<div class="section-label">B. Kategori Kasus</div>
<div class="grid-5">
    @foreach($summary['cases_by_category'] as $cat => $val)
        <div class="cell">
            <p>{{ ucfirst($cat) }}</p>
            <strong>{{ $val }}</strong>
        </div>
    @endforeach
</div>

<div class="section-label">C. Layanan Konseling</div>
<div class="grid-4">
    <div class="cell">
        <p>Individual</p>
        <strong>{{ $summary['counseling_individual'] }}</strong>
    </div>
    <div class="cell">
        <p>Kelompok</p>
        <strong>{{ $summary['counseling_group'] }}</strong>
    </div>
    <div class="cell">
        <p>Klasikal</p>
        <strong>{{ $summary['classical'] }}</strong>
    </div>
    <div class="cell">
        <p>Home Visit</p>
        <strong>{{ $summary['home_visits'] }}</strong>
    </div>
</div>

@if(count($details['cases']) > 0)
<div class="section-label">D. Rincian Kasus</div>
<table class="data">
    <thead>
        <tr>
            <th style="width: 70pt;">Tanggal</th>
            <th>Judul Kasus</th>
            <th style="width: 100pt;">Siswa</th>
            <th style="width: 70pt;">Kategori</th>
            <th style="width: 70pt;">Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details['cases'] as $c)
        <tr>
            <td>{{ \Carbon\Carbon::parse($c->created_at)->translatedFormat('d M Y') }}</td>
            <td>{{ $c->title }}</td>
            <td>{{ $c->student->name ?? '—' }}</td>
            <td>{{ ucfirst($c->category) }}</td>
            <td>{{ ucfirst($c->status) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($details['counseling']) > 0)
<div class="section-label">E. Sesi Konseling</div>
<table class="data">
    <thead>
        <tr>
            <th style="width: 70pt;">Tanggal</th>
            <th style="width: 70pt;">Jenis</th>
            <th>Topik</th>
            <th style="width: 110pt;">Konselor</th>
            <th style="width: 70pt;">Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details['counseling'] as $s)
        <tr>
            <td>{{ \Carbon\Carbon::parse($s->date)->translatedFormat('d M Y') }}</td>
            <td>{{ ucfirst($s->type) }}</td>
            <td>{{ $s->topic }}</td>
            <td>{{ $s->counselor->name ?? '—' }}</td>
            <td>{{ ucfirst($s->status) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($details['classical']) > 0)
<div class="section-label">F. Bimbingan Klasikal</div>
<table class="data">
    <thead>
        <tr>
            <th style="width: 70pt;">Tanggal</th>
            <th style="width: 100pt;">Kelas</th>
            <th>Topik</th>
            <th style="width: 60pt;">Durasi</th>
            <th style="width: 110pt;">Guru BK</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details['classical'] as $s)
        <tr>
            <td>{{ \Carbon\Carbon::parse($s->date)->translatedFormat('d M Y') }}</td>
            <td>{{ $s->school_class->name ?? '—' }}</td>
            <td>{{ $s->topic }}</td>
            <td>{{ $s->duration_minutes ?? '—' }} mnt</td>
            <td>{{ $s->counselor->name ?? '—' }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($details['home_visits']) > 0)
<div class="section-label">G. Home Visit</div>
<table class="data">
    <thead>
        <tr>
            <th style="width: 70pt;">Tanggal</th>
            <th style="width: 120pt;">Siswa</th>
            <th>Tujuan</th>
            <th style="width: 70pt;">Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details['home_visits'] as $v)
        <tr>
            <td>{{ \Carbon\Carbon::parse($v->date)->translatedFormat('d M Y') }}</td>
            <td>{{ $v->student->name ?? '—' }}</td>
            <td>{{ $v->purpose }}</td>
            <td>{{ ucfirst($v->status) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($details['violations']) > 0)
<div class="section-label">H. Pelanggaran Siswa</div>
<table class="data">
    <thead>
        <tr>
            <th style="width: 70pt;">Tanggal</th>
            <th style="width: 120pt;">Siswa</th>
            <th>Jenis Pelanggaran</th>
            <th style="width: 50pt;">Poin</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details['violations'] as $v)
        <tr>
            <td>{{ \Carbon\Carbon::parse($v->date)->translatedFormat('d M Y') }}</td>
            <td>{{ $v->student->name ?? '—' }}</td>
            <td>{{ $v->violation->name ?? '—' }}</td>
            <td>{{ $v->violation->points ?? 0 }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($details['referrals']) > 0)
<div class="section-label">I. Referral</div>
<table class="data">
    <thead>
        <tr>
            <th style="width: 70pt;">Tanggal</th>
            <th style="width: 120pt;">Siswa</th>
            <th>Dirujuk Ke</th>
            <th style="width: 70pt;">Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details['referrals'] as $r)
        <tr>
            <td>{{ \Carbon\Carbon::parse($r->date)->translatedFormat('d M Y') }}</td>
            <td>{{ $r->student->name ?? '—' }}</td>
            <td>{{ $r->referred_to }}</td>
            <td>{{ ucfirst($r->status) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if($summary['cases_total'] === 0 && $summary['violations_total'] === 0 && $summary['counseling_individual'] === 0 && $summary['counseling_group'] === 0 && $summary['classical'] === 0 && $summary['home_visits'] === 0 && $summary['referrals'] === 0)
<div class="empty-note">
    Tidak ada aktivitas layanan BK tercatat pada periode {{ $start->translatedFormat('F Y') }}.
</div>
@endif

<div class="ttd-block">
    <div class="place-date">Kabanjahe, {{ now()->translatedFormat('d F Y') }}</div>
    <div class="name">Koordinator BK</div>
    <div class="role">SMA Negeri 1 Kabanjahe</div>
</div>

<div class="footer-doc">
    Dicetak {{ now()->translatedFormat('d F Y, H:i') }} WIB &mdash; Periode {{ $start->translatedFormat('d M Y') }} s.d. {{ $end->translatedFormat('d M Y') }}
</div>

</body>
</html>
