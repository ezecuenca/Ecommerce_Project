<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\WatchColorController;
use App\Http\Controllers\WristMeasurementController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/register', [AuthController::class, 'register']);

// Category routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/archive', [CategoryController::class, 'archive']);
Route::put('/categories/restore', [CategoryController::class, 'restore']);
Route::put('/categories/{id}', [CategoryController::class, 'update']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Watch Color routes
Route::get('/watch-colors', [WatchColorController::class, 'index']);
Route::post('/watch-colors', [WatchColorController::class, 'store']);
Route::put('/watch-colors/archive', [WatchColorController::class, 'archive']);
Route::put('/watch-colors/restore', [WatchColorController::class, 'restore']);
Route::put('/watch-colors/{id}', [WatchColorController::class, 'update']);
Route::get('/watch-colors/{watch_color}', [WatchColorController::class, 'show']);
Route::delete('/watch-colors/{id}', [WatchColorController::class, 'destroy']);

// Wrist Measurement routes
Route::get('/wrist-measurements', [WristMeasurementController::class, 'index']);
Route::post('/wrist-measurements', [WristMeasurementController::class, 'store']);
Route::put('/wrist-measurements/{id}', [WristMeasurementController::class, 'update']);
Route::put('/wrist-measurements/archive', [WristMeasurementController::class, 'archive']);
Route::put('/wrist-measurements/restore', [WristMeasurementController::class, 'restore']);
