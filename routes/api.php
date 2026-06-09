<?php

use App\Http\Controllers\Api\ReportSummaryController;
use Illuminate\Support\Facades\Route;

Route::get('/reports/summary', ReportSummaryController::class);
