<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WristMeasurementController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\CartController; 
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DashboardController;
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


// Wrist Measurements API
Route::get('/wrist_measurements', [WristMeasurementController::class, 'index']);
Route::post('/wrist_measurements', [WristMeasurementController::class, 'store']);
Route::put('/wrist_measurements/archive', [WristMeasurementController::class, 'archive']);
Route::put('/wrist_measurements/restore', [WristMeasurementController::class, 'restore']);
Route::put('/wrist_measurements/{wristmeasurement}', [WristMeasurementController::class, 'update']);
Route::get('/wrist_measurements/{wristmeasurement}', [WristMeasurementController::class, 'show']);

//Inventory API
Route::get('/inventories', [InventoryController::class, 'index']);
Route::put('/inventories/archive', [InventoryController::class, 'archive']);
Route::put('/inventories/restore', [InventoryController::class, 'restore']);
Route::put('/inventories/{id}/stocks', [InventoryController::class, 'updateStocks']);

// Roles API
Route::get('/roles', [RoleController::class, 'index']);
Route::post('/roles', [RoleController::class, 'store']);
Route::put('/roles/archive', [RoleController::class, 'archive']);
Route::put('/roles/restore', [RoleController::class, 'restore']);
Route::put('/roles/{role}', [RoleController::class, 'update']);
Route::get('/roles/{role}', [RoleController::class, 'show']);

// Cart API 
Route::get('/cart/{profileId}', [CartController::class, 'index']); 
Route::post('/cart', [CartController::class, 'store']); 
Route::put('/cart/{cartItemId}', [CartController::class, 'update']); 
Route::delete('/cart/{cartItemId}', [CartController::class, 'destroy']); 

//Payment Method API
Route::get('/payment-methods', [PaymentMethodController::class, 'index']); 

//Reviews API
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);
Route::put('/reviews/archive', [ReviewController::class, 'archive']);
Route::put('/reviews/restore', [ReviewController::class, 'restore']);
Route::put('/reviews/{review}', [ReviewController::class, 'update']);   
Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

// Order API Routes
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']); 
Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
Route::get('/orders/{order}', [OrderController::class, 'show']);
Route::put('/orders/{order}/cancel', [OrderController::class, 'cancel']);
//Route::middleware('auth:sanctum')->group(function () {
Route::put('/orders/{order}/mark-completed', [OrderController::class, 'markCompletedByUser']); 
Route::put('/orders/{order}/request-return', [OrderController::class, 'requestReturnByUser']);
//});

// Dashboard API Routes 
Route::get('/dashboard/inventory-analytics', [DashboardController::class, 'getInventoryAnalytics']);
Route::get('/dashboard/recently-sold', [DashboardController::class, 'getRecentlySold']);