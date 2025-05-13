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
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserProfileController; 
use App\Http\Controllers\AddressController;         
use App\Http\Controllers\ChatboxController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PasswordResetController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Public Authentication Routes ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/direct-reset-password', [PasswordResetController::class, 'directResetPassword']);


// --- Publicly Accessible Read Routes ---
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/watch_colors', [ColorController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/wrist_measurements', [WristMeasurementController::class, 'index']);
Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index.public');
Route::get('/reviews/stats', [ReviewController::class, 'getStats']);


// --- Authenticated Routes ---
Route::middleware('auth:api')->group(function () { // Or 'auth:sanctum'

    // --- User/Auth Management ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/me', [AuthController::class, 'me']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']); // <-- Route for Password Update EXISTS
    Route::delete('/user/account', [AuthController::class, 'deleteAccount']); // <-- Route for Account Deletion EXISTS

    // --- User Profile & Address Routes ---
    Route::get('/user/profile', [UserProfileController::class, 'show']);         // <-- Route for Fetching Profile EXISTS
    Route::put('/user/profile', [UserProfileController::class, 'update']);        // <-- Route for Updating Profile EXISTS

    Route::post('/user/addresses', [AddressController::class, 'store']);       // <-- Route for Adding Address EXISTS
    Route::put('/user/addresses/{address}', [AddressController::class, 'update']); // <-- Route for Updating Address EXISTS (Handles default toggle)
    Route::delete('/user/addresses/{address}', [AddressController::class, 'destroy']);// <-- Route for Deleting Address EXISTS
    Route::put('/user/addresses/{address}/set-default', [AddressController::class, 'setDefault']); // <-- This specific route is NOT NEEDED if update handles toggle
    // --- END: User Profile & Address Routes ---


    // --- ADD USER LISTING ROUTE ---
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/archive', [UserController::class, 'archive']);
    Route::put('/users/restore', [UserController::class, 'restore']);
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    // Optional: Route::get('/users/{user}', [UserController::class, 'show']);

    // --- Cart Management ---
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{cartItemId}', [CartController::class, 'update']);
    Route::delete('/cart/{cartItemId}', [CartController::class, 'destroy']);

    // --- Review Management ---
    Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store'); // Create review
    Route::put('/reviews/{review}', [ReviewController::class, 'update'])->name('reviews.update'); // Edit review
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy'); // Archive review
    Route::put('/reviews/{reviewId}/restore', [ReviewController::class, 'restore'])->name('reviews.restore'); // Restore review

    // --- Order Management (Customer & Admin) ---
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::put('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::put('/orders/{order}/mark-completed', [OrderController::class, 'markCompletedByUser']);
    Route::put('/orders/{order}/request-return', [OrderController::class, 'requestReturnByUser']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // --- Customer Chat Routes --- ADDED HERE ---
Route::prefix('customer/chat')->group(function () {
    Route::get('/', [ChatboxController::class, 'customerGetConversation'])->name('customer.chat.index');
    Route::post('/', [ChatboxController::class, 'storeMessage'])->name('customer.chat.store'); // Customer sending
});
// --- END: Customer Chat Routes ---

  // --- CUSTOMER NOTIFICATION ROUTES --- ADDED HERE ---
  Route::prefix('customer/notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index'])->name('customer.notifications.index');
    Route::put('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('customer.notifications.markAllRead');
});
// --- END: CUSTOMER NOTIFICATION ROUTES --
    

    // --- Admin Only Routes (Controllers must verify role internally for now) ---
    Route::get('/dashboard/inventory-analytics', [DashboardController::class, 'getInventoryAnalytics']);
    Route::get('/dashboard/recently-sold', [DashboardController::class, 'getRecentlySold']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/archive', [CategoryController::class, 'archive']);
    Route::put('/categories/restore', [CategoryController::class, 'restore']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::post('/watch_colors', [ColorController::class, 'store']);
    Route::put('/watch_colors/archive', [ColorController::class, 'archive']);
    Route::put('/watch_colors/restore', [ColorController::class, 'restore']);
    Route::put('/watch_colors/{watchcolor}', [ColorController::class, 'update']);
    Route::get('/watch_colors/{watchcolor}', [ColorController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/archive', [ProductController::class, 'archive']);
    Route::put('/products/restore', [ProductController::class, 'restore']);
    Route::patch('/products/{product}', [ProductController::class, 'update']);
    Route::post('/wrist_measurements', [WristMeasurementController::class, 'store']);
    Route::put('/wrist_measurements/archive', [WristMeasurementController::class, 'archive']);
    Route::put('/wrist_measurements/restore', [WristMeasurementController::class, 'restore']);
    Route::put('/wrist_measurements/{wristmeasurement}', [WristMeasurementController::class, 'update']);
    Route::get('/wrist_measurements/{wristmeasurement}', [WristMeasurementController::class, 'show']);
    Route::get('/inventories', [InventoryController::class, 'index']);
    Route::put('/inventories/archive', [InventoryController::class, 'archive']);
    Route::put('/inventories/restore', [InventoryController::class, 'restore']);
    Route::put('/inventories/{id}/stocks', [InventoryController::class, 'updateStocks']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::put('/roles/archive', [RoleController::class, 'archive']);
    Route::put('/roles/restore', [RoleController::class, 'restore']);
    Route::put('/roles/{role}', [RoleController::class, 'update']);
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/reviews/archive', [ReviewController::class, 'archive']);
    Route::put('/reviews/restore', [ReviewController::class, 'restore']);

    // --- Admin Chat Routes --- ADDED HERE ---
// Apply admin middleware if available: ->middleware('admin')
Route::prefix('admin/chat')->group(function () {
    Route::get('/inbox', [ChatboxController::class, 'adminInbox'])->name('admin.chat.inbox');
    Route::get('/{profile_id}', [ChatboxController::class, 'adminGetConversation'])->where('profile_id', '[0-9]+')->name('admin.chat.conversation');
    Route::post('/', [ChatboxController::class, 'storeMessage'])->name('admin.chat.store'); // Admin sending
});
// --- END: Admin Chat Routes ---

});