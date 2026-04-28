<?php

use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\AkpdController;
use App\Http\Controllers\AnnualProgramController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\CaseConferenceController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\ClassicalGuidanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DcmController;
use App\Http\Controllers\GroupCounselingController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\HomeVisitController;
use App\Http\Controllers\IndividualCounselingController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RplBkController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\SemesterProgramController;
use App\Http\Controllers\SociometryController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentGuidanceController;
use App\Http\Controllers\StudentViolationController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\ViolationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::post('logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| Authenticated
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->middleware('module:dashboard,read')
        ->name('dashboard');

    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    /*
    |----------------------------------------------------------------------
    | Master Data
    |----------------------------------------------------------------------
    */
    Route::middleware('module:classes,read')->group(function () {
        Route::get('classes', [ClassController::class, 'index'])->name('classes.index');
    });
    Route::middleware('module:classes,write')->group(function () {
        Route::post('classes', [ClassController::class, 'store'])->name('classes.store');
        Route::put('classes/{class}', [ClassController::class, 'update'])->name('classes.update');
        Route::delete('classes/bulk', [ClassController::class, 'destroyBulk'])->name('classes.bulk-destroy');
        Route::delete('classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    });

    Route::middleware('module:classes,read')->group(function () {
        Route::get('teachers', [TeacherController::class, 'index'])->name('teachers.index');
    });
    Route::middleware('module:classes,write')->group(function () {
        Route::post('teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::put('teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
        Route::post('teachers/{teacher}/photo', [TeacherController::class, 'updatePhoto'])->name('teachers.photo');
        Route::delete('teachers/bulk', [TeacherController::class, 'destroyBulk'])->name('teachers.bulk-destroy');
        Route::delete('teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    });

    Route::middleware('module:students,read')->group(function () {
        Route::get('students', [StudentController::class, 'index'])->name('students.index');
        Route::get('students/lookup', [StudentController::class, 'lookup'])->name('students.lookup');
        Route::get('students/{student}/profile', [StudentController::class, 'profile'])->name('students.profile');
        Route::get('students/{student}/parents', [StudentController::class, 'listParents'])->name('students.parents.list');
    });
    Route::middleware('module:students,write')->group(function () {
        Route::post('students', [StudentController::class, 'store'])->name('students.store');
        Route::put('students/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::delete('students/bulk', [StudentController::class, 'destroyBulk'])->name('students.bulk-destroy');
        Route::delete('students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
        Route::post('students/{student}/photo', [StudentController::class, 'updatePhoto'])->name('students.photo');
        Route::post('students/{student}/parents/attach', [StudentController::class, 'attachParent'])->name('students.parents.attach');
        Route::post('students/{student}/parents/create', [StudentController::class, 'createAndAttachParent'])->name('students.parents.create');
        Route::delete('students/{student}/parents/{parent}', [StudentController::class, 'detachParent'])->name('students.parents.detach');
        Route::post('students/import', [StudentController::class, 'import'])->name('students.import');
    });

    Route::middleware('module:parents,read')->group(function () {
        Route::get('parents', [GuardianController::class, 'index'])->name('parents.index');
        Route::get('parents/lookup', [GuardianController::class, 'lookup'])->name('parents.lookup');
        Route::get('parents/{parent}/students', [GuardianController::class, 'linkedStudents'])->name('parents.students');
    });
    Route::middleware('module:parents,write')->group(function () {
        Route::post('parents', [GuardianController::class, 'store'])->name('parents.store');
        Route::put('parents/{parent}', [GuardianController::class, 'update'])->name('parents.update');
        Route::post('parents/{parent}/photo', [GuardianController::class, 'updatePhoto'])->name('parents.photo');
        Route::delete('parents/bulk', [GuardianController::class, 'destroyBulk'])->name('parents.bulk-destroy');
        Route::delete('parents/{parent}', [GuardianController::class, 'destroy'])->name('parents.destroy');
    });

    Route::middleware('module:academic_years,read')->group(function () {
        Route::get('academic-years', [AcademicYearController::class, 'index'])->name('academic-years.index');
    });
    Route::middleware('module:academic_years,write')->group(function () {
        Route::post('academic-years', [AcademicYearController::class, 'store'])->name('academic-years.store');
        Route::put('academic-years/{academicYear}', [AcademicYearController::class, 'update'])->name('academic-years.update');
        Route::post('academic-years/{academicYear}/activate', [AcademicYearController::class, 'activate'])->name('academic-years.activate');
        Route::delete('academic-years/{academicYear}', [AcademicYearController::class, 'destroy'])->name('academic-years.destroy');
    });

    Route::middleware('module:students,read')->group(function () {
        Route::get('student-guidance', [StudentGuidanceController::class, 'index'])->name('student-guidance.index');
    });
    Route::middleware('module:students,write')->group(function () {
        Route::post('student-guidance', [StudentGuidanceController::class, 'store'])->name('student-guidance.store');
        Route::delete('student-guidance/bulk', [StudentGuidanceController::class, 'destroyBulk'])->name('student-guidance.bulk-destroy');
        Route::delete('student-guidance', [StudentGuidanceController::class, 'destroy'])->name('student-guidance.destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Fase 3 — Kasus & Pelanggaran
    |----------------------------------------------------------------------
    */
    Route::middleware('module:cases,read')->group(function () {
        Route::get('cases', [CaseController::class, 'index'])->name('cases.index');
    });
    Route::middleware('module:cases,write')->group(function () {
        Route::get('cases/create', [CaseController::class, 'create'])->name('cases.create');
        Route::post('cases', [CaseController::class, 'store'])->name('cases.store');
        Route::get('cases/{case}/edit', [CaseController::class, 'edit'])->name('cases.edit');
        Route::put('cases/{case}', [CaseController::class, 'update'])->name('cases.update');
        Route::delete('cases/bulk', [CaseController::class, 'destroyBulk'])->name('cases.bulk-destroy');
        Route::delete('cases/{case}', [CaseController::class, 'destroy'])->name('cases.destroy');
    });
    Route::middleware('module:cases,read')->group(function () {
        Route::get('cases/{case}', [CaseController::class, 'show'])->name('cases.show');
    });

    Route::middleware('module:violations,read')->group(function () {
        Route::get('violations', [ViolationController::class, 'index'])->name('violations.index');
    });
    Route::middleware('module:violations,write')->group(function () {
        Route::post('violations', [ViolationController::class, 'store'])->name('violations.store');
        Route::put('violations/{violation}', [ViolationController::class, 'update'])->name('violations.update');
        Route::delete('violations/bulk', [ViolationController::class, 'destroyBulk'])->name('violations.bulk-destroy');
        Route::delete('violations/{violation}', [ViolationController::class, 'destroy'])->name('violations.destroy');
    });

    Route::middleware('module:violations,read')->group(function () {
        Route::get('student-violations', [StudentViolationController::class, 'index'])->name('student-violations.index');
    });
    Route::middleware('module:violations,write')->group(function () {
        Route::post('student-violations', [StudentViolationController::class, 'store'])->name('student-violations.store');
        Route::put('student-violations/{studentViolation}', [StudentViolationController::class, 'update'])->name('student-violations.update');
        Route::delete('student-violations/bulk', [StudentViolationController::class, 'destroyBulk'])->name('student-violations.bulk-destroy');
        Route::delete('student-violations/{studentViolation}', [StudentViolationController::class, 'destroy'])->name('student-violations.destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Fase 4 — Layanan BK
    |----------------------------------------------------------------------
    */

    // Konseling Individual
    Route::middleware('module:counseling_individual,read')->group(function () {
        Route::get('counseling/individual', [IndividualCounselingController::class, 'index'])->name('counseling.individual.index');
    });
    Route::middleware('module:counseling_individual,write')->group(function () {
        Route::get('counseling/individual/create', [IndividualCounselingController::class, 'create'])->name('counseling.individual.create');
        Route::post('counseling/individual', [IndividualCounselingController::class, 'store'])->name('counseling.individual.store');
        Route::get('counseling/individual/{session}/edit', [IndividualCounselingController::class, 'edit'])->name('counseling.individual.edit');
        Route::put('counseling/individual/{session}', [IndividualCounselingController::class, 'update'])->name('counseling.individual.update');
        Route::delete('counseling/individual/bulk', [IndividualCounselingController::class, 'destroyBulk'])->name('counseling.individual.bulk-destroy');
        Route::delete('counseling/individual/{session}', [IndividualCounselingController::class, 'destroy'])->name('counseling.individual.destroy');
    });
    Route::middleware('module:counseling_individual,read')->group(function () {
        Route::get('counseling/individual/{session}', [IndividualCounselingController::class, 'show'])->name('counseling.individual.show');
    });

    // Konseling Kelompok
    Route::middleware('module:counseling_group,read')->group(function () {
        Route::get('counseling/group', [GroupCounselingController::class, 'index'])->name('counseling.group.index');
    });
    Route::middleware('module:counseling_group,write')->group(function () {
        Route::get('counseling/group/create', [GroupCounselingController::class, 'create'])->name('counseling.group.create');
        Route::post('counseling/group', [GroupCounselingController::class, 'store'])->name('counseling.group.store');
        Route::get('counseling/group/{session}/edit', [GroupCounselingController::class, 'edit'])->name('counseling.group.edit');
        Route::put('counseling/group/{session}', [GroupCounselingController::class, 'update'])->name('counseling.group.update');
        Route::delete('counseling/group/bulk', [GroupCounselingController::class, 'destroyBulk'])->name('counseling.group.bulk-destroy');
        Route::delete('counseling/group/{session}', [GroupCounselingController::class, 'destroy'])->name('counseling.group.destroy');
    });
    Route::middleware('module:counseling_group,read')->group(function () {
        Route::get('counseling/group/{session}', [GroupCounselingController::class, 'show'])->name('counseling.group.show');
    });

    // Bimbingan Klasikal
    Route::middleware('module:counseling_classical,write')->group(function () {
        Route::get('counseling/classical/create', [ClassicalGuidanceController::class, 'create'])->name('counseling.classical.create');
        Route::get('counseling/classical/{classicalGuidance}/edit', [ClassicalGuidanceController::class, 'edit'])->name('counseling.classical.edit');
        Route::post('counseling/classical', [ClassicalGuidanceController::class, 'store'])->name('counseling.classical.store');
        Route::put('counseling/classical/{classicalGuidance}', [ClassicalGuidanceController::class, 'update'])->name('counseling.classical.update');
        Route::delete('counseling/classical/bulk', [ClassicalGuidanceController::class, 'destroyBulk'])->name('counseling.classical.bulk-destroy');
        Route::delete('counseling/classical/{classicalGuidance}', [ClassicalGuidanceController::class, 'destroy'])->name('counseling.classical.destroy');
    });
    Route::middleware('module:counseling_classical,read')->group(function () {
        Route::get('counseling/classical', [ClassicalGuidanceController::class, 'index'])->name('counseling.classical.index');
        Route::get('counseling/classical/{classicalGuidance}', [ClassicalGuidanceController::class, 'show'])->name('counseling.classical.show');
    });

    // Home Visit
    Route::middleware('module:home_visit,read')->group(function () {
        Route::get('counseling/home-visit', [HomeVisitController::class, 'index'])->name('home-visits.index');
    });
    Route::middleware('module:home_visit,write')->group(function () {
        Route::get('counseling/home-visit/create', [HomeVisitController::class, 'create'])->name('home-visits.create');
        Route::get('counseling/home-visit/{homeVisit}/edit', [HomeVisitController::class, 'edit'])->name('home-visits.edit');
        Route::post('counseling/home-visit', [HomeVisitController::class, 'store'])->name('home-visits.store');
        Route::put('counseling/home-visit/{homeVisit}', [HomeVisitController::class, 'update'])->name('home-visits.update');
        Route::delete('counseling/home-visit/bulk', [HomeVisitController::class, 'destroyBulk'])->name('home-visits.bulk-destroy');
        Route::delete('counseling/home-visit/{homeVisit}', [HomeVisitController::class, 'destroy'])->name('home-visits.destroy');
    });
    Route::middleware('module:home_visit,read')->group(function () {
        Route::get('counseling/home-visit/{homeVisit}', [HomeVisitController::class, 'show'])->name('home-visits.show');
        Route::get('counseling/home-visit/{homeVisit}/pdf', [HomeVisitController::class, 'pdf'])->name('home-visits.pdf');
    });

    // Konferensi Kasus
    Route::middleware('module:case_conferences,read')->group(function () {
        Route::get('case-conferences', [CaseConferenceController::class, 'index'])->name('case-conferences.index');
    });
    Route::middleware('module:case_conferences,write')->group(function () {
        Route::get('case-conferences/create', [CaseConferenceController::class, 'create'])->name('case-conferences.create');
        Route::get('case-conferences/{caseConference}/edit', [CaseConferenceController::class, 'edit'])->name('case-conferences.edit');
        Route::post('case-conferences', [CaseConferenceController::class, 'store'])->name('case-conferences.store');
        Route::put('case-conferences/{caseConference}', [CaseConferenceController::class, 'update'])->name('case-conferences.update');
        Route::delete('case-conferences/bulk', [CaseConferenceController::class, 'destroyBulk'])->name('case-conferences.bulk-destroy');
        Route::delete('case-conferences/{caseConference}', [CaseConferenceController::class, 'destroy'])->name('case-conferences.destroy');
    });
    Route::middleware('module:case_conferences,read')->group(function () {
        Route::get('case-conferences/{caseConference}', [CaseConferenceController::class, 'show'])->name('case-conferences.show');
    });

    // Referral
    Route::middleware('module:referrals,read')->group(function () {
        Route::get('referrals', [ReferralController::class, 'index'])->name('referrals.index');
    });
    Route::middleware('module:referrals,write')->group(function () {
        Route::get('referrals/create', [ReferralController::class, 'create'])->name('referrals.create');
        Route::get('referrals/{referral}/edit', [ReferralController::class, 'edit'])->name('referrals.edit');
        Route::post('referrals', [ReferralController::class, 'store'])->name('referrals.store');
        Route::put('referrals/{referral}', [ReferralController::class, 'update'])->name('referrals.update');
        Route::delete('referrals/bulk', [ReferralController::class, 'destroyBulk'])->name('referrals.bulk-destroy');
        Route::delete('referrals/{referral}', [ReferralController::class, 'destroy'])->name('referrals.destroy');
    });
    Route::middleware('module:referrals,read')->group(function () {
        Route::get('referrals/{referral}', [ReferralController::class, 'show'])->name('referrals.show');
        Route::get('referrals/{referral}/pdf', [ReferralController::class, 'pdf'])->name('referrals.pdf');
    });

    /*
    |----------------------------------------------------------------------
    | Fase 5 — Instrumen BK
    |----------------------------------------------------------------------
    */

    // AKPD
    Route::middleware('module:instrument_akpd,read')->group(function () {
        Route::get('instruments/akpd/items', [AkpdController::class, 'items'])->name('akpd.items');
        Route::get('instruments/akpd/responses', [AkpdController::class, 'responses'])->name('akpd.responses');
        Route::get('instruments/akpd/{student}/fill', [AkpdController::class, 'fill'])->name('akpd.fill');
        Route::get('instruments/akpd/{student}/result', [AkpdController::class, 'result'])->name('akpd.result');
    });
    Route::middleware('module:instrument_akpd,write')->group(function () {
        Route::post('instruments/akpd/items', [AkpdController::class, 'storeItem'])->name('akpd.items.store');
        Route::put('instruments/akpd/items/{item}', [AkpdController::class, 'updateItem'])->name('akpd.items.update');
        Route::delete('instruments/akpd/items/{item}', [AkpdController::class, 'destroyItem'])->name('akpd.items.destroy');
        Route::post('instruments/akpd/{student}/submit', [AkpdController::class, 'submit'])->name('akpd.submit');
    });

    // DCM
    Route::middleware('module:instrument_dcm,read')->group(function () {
        Route::get('instruments/dcm/items', [DcmController::class, 'items'])->name('dcm.items');
        Route::get('instruments/dcm/responses', [DcmController::class, 'responses'])->name('dcm.responses');
        Route::get('instruments/dcm/{student}/fill', [DcmController::class, 'fill'])->name('dcm.fill');
        Route::get('instruments/dcm/{student}/result', [DcmController::class, 'result'])->name('dcm.result');
    });
    Route::middleware('module:instrument_dcm,write')->group(function () {
        Route::post('instruments/dcm/items', [DcmController::class, 'storeItem'])->name('dcm.items.store');
        Route::put('instruments/dcm/items/{item}', [DcmController::class, 'updateItem'])->name('dcm.items.update');
        Route::delete('instruments/dcm/items/{item}', [DcmController::class, 'destroyItem'])->name('dcm.items.destroy');
        Route::post('instruments/dcm/{student}/submit', [DcmController::class, 'submit'])->name('dcm.submit');
    });

    // Sosiometri
    Route::middleware('module:instrument_sociometry,read')->group(function () {
        Route::get('instruments/sociometry', [SociometryController::class, 'index'])->name('sociometry.index');
    });
    Route::middleware('module:instrument_sociometry,write')->group(function () {
        Route::get('instruments/sociometry/create', [SociometryController::class, 'create'])->name('sociometry.create');
        Route::post('instruments/sociometry', [SociometryController::class, 'store'])->name('sociometry.store');
        Route::get('instruments/sociometry/{session}/fill/{student}', [SociometryController::class, 'fill'])->name('sociometry.fill');
        Route::post('instruments/sociometry/{session}/fill/{student}', [SociometryController::class, 'submit'])->name('sociometry.submit');
        Route::delete('instruments/sociometry/bulk', [SociometryController::class, 'destroyBulk'])->name('sociometry.bulk-destroy');
        Route::delete('instruments/sociometry/{session}', [SociometryController::class, 'destroy'])->name('sociometry.destroy');
    });
    Route::middleware('module:instrument_sociometry,read')->group(function () {
        Route::get('instruments/sociometry/{session}', [SociometryController::class, 'show'])->name('sociometry.show');
    });

    // Karier / RIASEC
    Route::middleware('module:instrument_career,read')->group(function () {
        Route::get('instruments/career', [CareerController::class, 'index'])->name('career.index');
        Route::get('instruments/career/{student}/fill', [CareerController::class, 'fill'])->name('career.fill');
        Route::get('instruments/career/{student}/result', [CareerController::class, 'result'])->name('career.result');
    });
    Route::middleware('module:instrument_career,write')->group(function () {
        Route::post('instruments/career/{student}/submit', [CareerController::class, 'submit'])->name('career.submit');
    });

    /*
    |----------------------------------------------------------------------
    | Fase 6 — Program BK & Laporan
    |----------------------------------------------------------------------
    */

    // RPL BK
    Route::middleware('module:program_rpl,read')->group(function () {
        Route::get('programs/rpl', [RplBkController::class, 'index'])->name('rpl.index');
    });
    Route::middleware('module:program_rpl,write')->group(function () {
        Route::post('programs/rpl', [RplBkController::class, 'store'])->name('rpl.store');
        Route::put('programs/rpl/{rpl}', [RplBkController::class, 'update'])->name('rpl.update');
        Route::delete('programs/rpl/bulk', [RplBkController::class, 'destroyBulk'])->name('rpl.bulk-destroy');
        Route::delete('programs/rpl/{rpl}', [RplBkController::class, 'destroy'])->name('rpl.destroy');
    });
    Route::middleware('module:program_rpl,read')->group(function () {
        Route::get('programs/rpl/{rpl}', [RplBkController::class, 'show'])->name('rpl.show');
        Route::get('programs/rpl/{rpl}/pdf', [RplBkController::class, 'pdf'])->name('rpl.pdf');
    });

    // Program Tahunan
    Route::middleware('module:program_annual,read')->group(function () {
        Route::get('programs/annual', [AnnualProgramController::class, 'index'])->name('annual.index');
    });
    Route::middleware('module:program_annual,write')->group(function () {
        Route::get('programs/annual/create', [AnnualProgramController::class, 'create'])->name('annual.create');
        Route::post('programs/annual', [AnnualProgramController::class, 'store'])->name('annual.store');
        Route::get('programs/annual/{annual}/edit', [AnnualProgramController::class, 'edit'])->name('annual.edit');
        Route::put('programs/annual/{annual}', [AnnualProgramController::class, 'update'])->name('annual.update');
        Route::delete('programs/annual/bulk', [AnnualProgramController::class, 'destroyBulk'])->name('annual.bulk-destroy');
        Route::delete('programs/annual/{annual}', [AnnualProgramController::class, 'destroy'])->name('annual.destroy');
    });
    Route::middleware('module:program_annual,read')->group(function () {
        Route::get('programs/annual/{annual}', [AnnualProgramController::class, 'show'])->name('annual.show');
    });

    // Program Semesteran
    Route::middleware('module:program_semester,read')->group(function () {
        Route::get('programs/semester', [SemesterProgramController::class, 'index'])->name('semester.index');
    });
    Route::middleware('module:program_semester,write')->group(function () {
        Route::get('programs/semester/create', [SemesterProgramController::class, 'create'])->name('semester.create');
        Route::post('programs/semester', [SemesterProgramController::class, 'store'])->name('semester.store');
        Route::delete('programs/semester/{semester}', [SemesterProgramController::class, 'destroy'])->name('semester.destroy');
    });
    Route::middleware('module:program_semester,read')->group(function () {
        Route::get('programs/semester/{semester}', [SemesterProgramController::class, 'show'])->name('semester.show');
    });

    // Laporan
    Route::middleware('module:reports,read')->group(function () {
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/pdf', [ReportController::class, 'pdf'])->name('reports.pdf');
        Route::get('reports/excel', [ReportController::class, 'excel'])->name('reports.excel');
    });

    /*
    |----------------------------------------------------------------------
    | Sistem
    |----------------------------------------------------------------------
    */
    Route::middleware('module:system,read')->group(function () {
        Route::get('system', [SystemController::class, 'index'])->name('system.index');
    });
    Route::middleware('module:system,write')->group(function () {
        Route::post('system/users', [SystemController::class, 'storeUser'])->name('system.users.store');
        Route::put('system/users/{user}', [SystemController::class, 'updateUser'])->name('system.users.update');
        Route::delete('system/users/{user}', [SystemController::class, 'destroyUser'])->name('system.users.destroy');
        Route::put('system/groups/{group}/access', [SystemController::class, 'updateGroupAccess'])->name('system.groups.access');
        Route::post('system/branding', [SystemController::class, 'updateBranding'])->name('system.branding.update');
    });
});
