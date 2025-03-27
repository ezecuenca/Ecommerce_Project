<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\ProductController;

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

Route::post('/register', [AuthController::class, 'register']);

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

// Products API
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/archive', [ProductController::class, 'archive']);
Route::put('/products/restore', [ProductController::class, 'restore']);
Route::put('/products/{product}', [ProductController::class, 'update']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/products/search', [ProductController::class, 'search']);

Route::get('/colors', [ProductController::class, 'colors']);