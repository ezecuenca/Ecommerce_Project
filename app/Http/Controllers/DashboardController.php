<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Import DB Facade
use App\Models\Inventory;         // Import Inventory Model
use App\Models\Profile;            // Import Profile Model (or User model)
use App\Models\OrderDetail;        // Import OrderDetail Model
use App\Models\Order;              // Import Order Model
use Illuminate\Support\Facades\Log;  // Import Log Facade

class DashboardController extends Controller
{
    /**
     * Get aggregated analytics data primarily from inventory and users.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getInventoryAnalytics(Request $request)
    {
        try {
            // Calculate aggregates from active inventory items
            $inventoryAggregates = Inventory::where('status', 1) // Assuming 1 is active
                ->selectRaw('SUM(quantity_sold) as total_quantity_sold, SUM(total_amount) as total_gross_revenue, SUM(stocks) as total_current_stock')
                ->first(); // Use first() as SUM will always return one row (even if counts are 0/null)

            // Count total users/profiles
            // Replace Profile::class with User::class if you use Laravel's default User model
            $userCount = Profile::count();

            return response()->json([
                'total_quantity_sold' => (int) ($inventoryAggregates->total_quantity_sold ?? 0), // Cast to int, default 0
                'total_gross_revenue' => (float) ($inventoryAggregates->total_gross_revenue ?? 0.0), // Cast to float, default 0.0
                'total_current_stock' => (int) ($inventoryAggregates->total_current_stock ?? 0), // Cast to int, default 0
                'total_user_count' => $userCount,
            ]);

        } catch (\Exception $e) {
            Log::error("Error fetching inventory analytics: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load dashboard analytics.'], 500);
        }
    }

    /**
     * Get recently sold items (order details).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRecentlySold(Request $request)
    {
        try {
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5); // Match frontend

            // Query OrderDetail, join with Orders for date, join with Products for name/image
            // Order by the Order's date, descending
            $recentSales = OrderDetail::with('product:id,product_name,image_url') // Eager load product info needed
                ->join('orders', 'order_details.order_id', '=', 'orders.id') // Join to get order date
                ->select('order_details.*', 'orders.order_date') // Select needed columns
                ->orderBy('orders.order_date', 'desc') // Order by most recent order date
                ->paginate($perPage, ['*'], 'page', $page);

             // Transform data slightly for frontend if needed (e.g., line total)
             $recentSales->getCollection()->transform(function ($detail) {
                // Calculate line total if not stored directly
                $detail->line_total = $detail->quantity * $detail->price;
                // You might unset the loaded product relation if you only need specific fields
                // to match the frontend expectation exactly, or adjust frontend mapping
                // $productData = $detail->product;
                // unset($detail->product);
                // $detail->product_name = $productData->product_name ?? 'N/A';
                // $detail->image_url = $productData->image_url ?? null;
                return $detail;
            });


            return response()->json($recentSales);

        } catch (\Exception $e) {
            Log::error("Error fetching recently sold items: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load recently sold items.'], 500);
        }
    }
}