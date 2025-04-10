<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\WristMeasurementController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Register & Login API
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:api')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:api')->get('/me', [AuthController::class, 'me']);
Route::get('/admin', function () {return view('AdminDashboard');})->middleware('auth');

// Categories API
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/archive', [CategoryController::class, 'archive']);
Route::put('/categories/restore', [CategoryController::class, 'restore']);
Route::put('/categories/{category}', [CategoryController::class, 'update']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Colors API
Route::get('/watch_colors', [ColorController::class, 'index']);
Route::post('/watch_colors', [ColorController::class, 'store']);
Route::put('/watch_colors/archive', [ColorController::class, 'archive']);
Route::put('/watch_colors/restore', [ColorController::class, 'restore']);
Route::put('/watch_colors/{watchcolor}', [ColorController::class, 'update']);
Route::get('/watch_colors/{watchcolor}', [ColorController::class, 'show']);

// Wrist Measurements API
Route::get('/wrist_measurements', [WristMeasurementController::class, 'index']);
Route::post('/wrist_measurements', [WristMeasurementController::class, 'store']);
Route::put('/wrist_measurements/archive', [WristMeasurementController::class, 'archive']);
Route::put('/wrist_measurements/restore', [WristMeasurementController::class, 'restore']);
Route::put('/wrist_measurements/{wristmeasurement}', [WristMeasurementController::class, 'update']);
Route::get('/wrist_measurements/{wristmeasurement}', [WristMeasurementController::class, 'show']);