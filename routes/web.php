<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuardianController;
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

    Route::get('profile', fn () => Inertia::render('Profile/Edit'))
        ->name('profile.edit');

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
        Route::delete('classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    });

    Route::middleware('module:classes,read')->group(function () {
        Route::get('teachers', [TeacherController::class, 'index'])->name('teachers.index');
    });
    Route::middleware('module:classes,write')->group(function () {
        Route::post('teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::put('teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
        Route::delete('teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    });

    Route::middleware('module:students,read')->group(function () {
        Route::get('students', [StudentController::class, 'index'])->name('students.index');
    });
    Route::middleware('module:students,write')->group(function () {
        Route::post('students', [StudentController::class, 'store'])->name('students.store');
        Route::put('students/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::delete('students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
        Route::post('students/{student}/photo', [StudentController::class, 'updatePhoto'])->name('students.photo');
        Route::post('students/import', [StudentController::class, 'import'])->name('students.import');
    });

    Route::middleware('module:parents,read')->group(function () {
        Route::get('parents', [GuardianController::class, 'index'])->name('parents.index');
    });
    Route::middleware('module:parents,write')->group(function () {
        Route::post('parents', [GuardianController::class, 'store'])->name('parents.store');
        Route::put('parents/{parent}', [GuardianController::class, 'update'])->name('parents.update');
        Route::delete('parents/{parent}', [GuardianController::class, 'destroy'])->name('parents.destroy');
    });

    Route::middleware('module:students,read')->group(function () {
        Route::get('student-guidance', [StudentGuidanceController::class, 'index'])->name('student-guidance.index');
    });
    Route::middleware('module:students,write')->group(function () {
        Route::post('student-guidance', [StudentGuidanceController::class, 'store'])->name('student-guidance.store');
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
        Route::delete('violations/{violation}', [ViolationController::class, 'destroy'])->name('violations.destroy');
    });

    Route::middleware('module:violations,read')->group(function () {
        Route::get('student-violations', [StudentViolationController::class, 'index'])->name('student-violations.index');
    });
    Route::middleware('module:violations,write')->group(function () {
        Route::post('student-violations', [StudentViolationController::class, 'store'])->name('student-violations.store');
        Route::put('student-violations/{studentViolation}', [StudentViolationController::class, 'update'])->name('student-violations.update');
        Route::delete('student-violations/{studentViolation}', [StudentViolationController::class, 'destroy'])->name('student-violations.destroy');
    });
});
