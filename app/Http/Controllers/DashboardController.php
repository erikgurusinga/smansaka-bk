<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard', [
            'stats' => [
                'total_students' => 0,
                'active_cases' => 0,
                'counseling_this_week' => 0,
                'home_visits_this_month' => 0,
            ],
        ]);
    }
}
