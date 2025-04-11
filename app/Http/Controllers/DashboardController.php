<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Inventory;
use App\Models\Profile;
use App\Models\OrderDetail;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function getInventoryAnalytics(Request $request)
    {
        try {
            $inventoryAggregates = Inventory::where('status', 1)
                ->selectRaw('SUM(quantity_sold) as total_quantity_sold, SUM(total_amount) as total_gross_revenue, SUM(stocks) as total_current_stock')
                ->first();

            $userCount = Profile::count();

            return response()->json([
                'total_quantity_sold' => (int) ($inventoryAggregates->total_quantity_sold ?? 0),
                'total_gross_revenue' => (float) ($inventoryAggregates->total_gross_revenue ?? 0.0),
                'total_current_stock' => (int) ($inventoryAggregates->total_current_stock ?? 0),
                'total_user_count' => $userCount,
            ]);

        } catch (\Exception $e) {
            Log::error("Error fetching inventory analytics: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load dashboard analytics.'], 500);
        }
    }

    public function getRecentlySold(Request $request)
    {
        try {
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);

            $recentSales = OrderDetail::with('product:id,product_name,image_url')
                ->join('orders', 'order_details.order_id', '=', 'orders.id')
                ->select('order_details.*', 'orders.order_date')
                ->orderBy('orders.order_date', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            $recentSales->getCollection()->transform(function ($detail) {
                $detail->line_total = $detail->quantity * $detail->price;
                return $detail;
            });

            return response()->json($recentSales);

        } catch (\Exception $e) {
            Log::error("Error fetching recently sold items: " . $e->getMessage());
            return response()->json(['message' => 'Failed to load recently sold items.'], 500);
        }
    }
}