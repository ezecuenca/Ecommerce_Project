<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->query('per_page', 5);
            $page = $request->query('page', 1);
            $status = $request->query('status', 'active');

            $statusValue = $status === 'active' ? 1 : 0;

            Log::info('Fetching inventories', [
                'status' => $status,
                'statusValue' => $statusValue,
                'perPage' => $perPage,
                'page' => $page,
            ]);

            $inventories = Inventory::where('inventories.status', $statusValue)
                ->join('products', 'inventories.product_id', '=', 'products.id')
                ->where('products.status', 1)
                ->select('inventories.*')
                ->with(['product' => function ($query) {
                    $query->select('id', 'product_name', 'price', 'image_url');
                }])
                ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Raw inventory data', [
                'inventories' => $inventories->toArray(),
            ]);

            if ($inventories->isEmpty()) {
                Log::warning('No inventories found with the given status and active products', [
                    'statusValue' => $statusValue,
                ]);
                return response()->json($inventories);
            }

            $inventories->getCollection()->transform(function ($inventory) {
                Log::info('Transforming inventory record', [
                    'inventory_id' => $inventory->id,
                    'product_id' => $inventory->product_id,
                    'product' => $inventory->product ? $inventory->product->toArray() : null,
                    'product_name' => $inventory->product ? $inventory->product->product_name : 'N/A',
                    'price' => $inventory->product ? $inventory->product->price : 0,
                ]);

                return [
                    'id' => $inventory->id,
                    'product_name' => $inventory->product ? $inventory->product->product_name : 'N/A',
                    'stocks' => $inventory->stocks,
                    'price' => $inventory->product ? $inventory->product->price : 0,
                    'quantity_sold' => $inventory->quantity_sold,
                    'total_amount' => $inventory->total_amount,
                    'profit' => $inventory->profit,
                    'status' => $inventory->status,
                    'created_at' => $inventory->created_at->format('Y-m-d H:i:s'), 
                    'updated_at' => $inventory->updated_at->format('Y-m-d H:i:s'), 
                    'product' => $inventory->product, 
                ];
            });

            Log::info('Final inventory response', [
                'response' => $inventories->toArray(),
            ]);

            return response()->json($inventories);
        } catch (\Exception $e) {
            Log::error('Error fetching inventory', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'query_params' => $request->query(),
            ]);
            return response()->json([
                'message' => 'Failed to fetch inventory',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateStocks(Request $request, $id)
    {
        try {
            $request->validate([
                'stocks' => 'required|integer|min:0',
            ]);

            $inventory = Inventory::findOrFail($id);

            $inventory->stocks = $request->input('stocks');
            $inventory->save();

            Log::info('Stocks updated', [
                'inventory_id' => $inventory->id,
                'new_stocks' => $inventory->stocks,
            ]);

            return response()->json([
                'message' => 'Stocks updated successfully',
                'inventory' => $inventory,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating stocks', [
                'inventory_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to update stocks',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function archive(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:inventories,id',
            ]);

            $ids = $request->input('ids');

            Inventory::whereIn('id', $ids)->update(['status' => 0]);

            Log::info('Inventories archived', [
                'ids' => $ids,
            ]);

            return response()->json([
                'message' => 'Inventories archived successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving inventories', [
                'ids' => $request->input('ids', []),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to archive inventories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function restore(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:inventories,id',
            ]);

            $ids = $request->input('ids');

            Inventory::whereIn('id', $ids)->update(['status' => 1]);

            Log::info('Inventories restored', [
                'ids' => $ids,
            ]);

            return response()->json([
                'message' => 'Inventories restored successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error restoring inventories', [
                'ids' => $request->input('ids', []),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to restore inventories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}