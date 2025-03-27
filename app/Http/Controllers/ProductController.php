<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Color;
use App\Models\WristMeasurement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request)
    {
        try {
            Log::info('Fetching products', ['query' => $request->query()]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $status = $request->query('status', 'active');

            $query = Product::with(['color', 'category', 'wristMeasurement']);

            Log::info('Building query', ['status' => $status]);

            if ($status === 'active') {
                $query->where('status', 'active');
            } elseif ($status === 'archived') {
                $query->where('status', 'archived');
            } else {
                Log::warning('Invalid status parameter', ['status' => $status]);
                return response()->json(['message' => 'Invalid status parameter'], 400);
            }

            $products = $query->paginate($perPage, ['*'], 'page', $page);

            Log::info('Query executed', ['product_count' => $products->count()]);

            // Transform the response to match the frontend's expectations
            $products->getCollection()->transform(function ($product) {
                return [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'stock' => $product->stock,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'created_at' => $product->created_at->format('d/m/y'),
                    'updated_at' => $product->updated_at->format('d/m/y'),
                ];
            });

            Log::info('Products fetched successfully', ['products' => $products->items()]);

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Error fetching products', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'query_params' => $request->query(),
            ]);
            return response()->json(['message' => 'Failed to fetch products', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created product in the database.
     */
    public function store(Request $request)
    {
        try {
            Log::info('Received product creation request', ['data' => $request->all()]);

            $validated = $request->validate([
                'product_name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'color_id' => 'required|exists:watch_colors,id',
                'category_id' => 'nullable|exists:categories,id',
                'wrist_measurement' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            Log::info('Validation passed', ['validated' => $validated]);

            $imageUrl = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $image->storeAs('public/images', $imageName);
                $imageUrl = '/storage/images/' . $imageName;
            }

            $product = Product::create([
                'product_name' => $validated['product_name'],
                'description' => $validated['description'],
                'stock' => 0,
                'price' => $validated['price'],
                'image_url' => $imageUrl,
                'color_id' => $validated['color_id'],
                'category_id' => $validated['category_id'],
                'wrist_measurement_id' => null,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($validated['wrist_measurement']) {
                $wristMeasurement = WristMeasurement::firstOrCreate(
                    ['measurement' => $validated['wrist_measurement']],
                    ['created_at' => now(), 'updated_at' => now()]
                );
                $product->wrist_measurement_id = $wristMeasurement->id;
                $product->save();
            }

            $product->load(['color', 'category', 'wristMeasurement']);

            Log::info('Product created successfully', ['product' => $product]);

            return response()->json([
                'message' => 'Product created successfully.',
                'product' => [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'stock' => $product->stock,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'created_at' => $product->created_at->format('d/m/y'),
                    'updated_at' => $product->updated_at->format('d/m/y'),
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating product', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        try {
            $product->load(['color', 'category', 'wristMeasurement']);

            return response()->json([
                'id' => $product->id,
                'product_name' => $product->product_name,
                'description' => $product->description,
                'stock' => $product->stock,
                'price' => $product->price,
                'image_url' => $product->image_url,
                'color' => $product->color ? $product->color->color_name : null,
                'category' => $product->category ? $product->category->name : null,
                'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                'created_at' => $product->created_at->format('d/m/y'),
                'updated_at' => $product->updated_at->format('d/m/y'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching product', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified product in the database.
     */
    public function update(Request $request, Product $product)
    {
        try {
            $validated = $request->validate([
                'product_name' => 'required|string|max:255',
                'description' => 'required|string',
                'stock' => 'required|integer|min:0',
                'price' => 'required|numeric|min:0',
                'image_url' => 'required|string',
                'color_id' => 'required|exists:watch_colors,id',
                'category_id' => 'nullable|exists:categories,id',
                'wrist_measurement_id' => 'nullable|exists:wrist_measurements,id',
            ]);

            $product->update([
                'product_name' => $validated['product_name'],
                'description' => $validated['description'],
                'stock' => $validated['stock'],
                'price' => $validated['price'],
                'image_url' => $validated['image_url'],
                'color_id' => $validated['color_id'],
                'category_id' => $validated['category_id'],
                'wrist_measurement_id' => $validated['wrist_measurement_id'],
                'updated_at' => now(),
            ]);

            $product->load(['color', 'category', 'wristMeasurement']);

            return response()->json([
                'message' => 'Product updated successfully.',
                'product' => [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'stock' => $product->stock,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'created_at' => $product->created_at->format('d/m/y'),
                    'updated_at' => $product->updated_at->format('d/m/y'),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating product', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Archive products (bulk action).
     */
    public function archive(Request $request)
    {
        try {
            Log::info('Archive request received', [
                'body' => $request->getContent(),
                'headers' => $request->headers->all(),
            ]);

            $productIds = $request->input('ids', []);

            if (empty($productIds)) {
                Log::error('No product IDs provided to archive');
                return response()->json(['message' => 'No product IDs provided to archive'], 400);
            }

            $updatedCount = Product::whereIn('id', $productIds)->update(['status' => 'archived']);
            Log::info('Products archived', ['updated_count' => $updatedCount]);

            return response()->json(['message' => 'Products archived successfully.', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error archiving products', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to archive products', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Restore archived products (bulk action).
     */
    public function restore(Request $request)
    {
        try {
            Log::info('Restore request received', [
                'body' => $request->getContent(),
                'headers' => $request->headers->all(),
            ]);

            $productIds = $request->input('ids', []);

            if (empty($productIds)) {
                Log::error('No product IDs provided to restore');
                return response()->json(['message' => 'No product IDs provided to restore'], 400);
            }

            $updatedCount = Product::whereIn('id', $productIds)->update(['status' => 'active']);
            Log::info('Products restored', ['updated_count' => $updatedCount]);

            return response()->json(['message' => 'Products restored successfully.', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error restoring products', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to restore products', 'error' => $e->getMessage()], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            Log::info('Searching products', ['query' => $request->query()]);

            $query = $request->input('query');
            $status = $request->query('status', 'active');
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);

            $productsQuery = Product::with(['color', 'category', 'wristMeasurement']);

            if ($status === 'active') {
                $productsQuery->where('status', 'active');
            } elseif ($status === 'archived') {
                $productsQuery->where('status', 'archived');
            } else {
                return response()->json(['message' => 'Invalid status parameter'], 400);
            }

            if ($query) {
                $productsQuery->where('product_name', 'LIKE', "%{$query}%");
            }

            $products = $productsQuery->paginate($perPage, ['*'], 'page', $page);

            $products->getCollection()->transform(function ($product) {
                return [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'stock' => $product->stock,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'created_at' => $product->created_at->format('d/m/y'),
                    'updated_at' => $product->updated_at->format('d/m/y'),
                ];
            });

            Log::info('Products search completed', ['products' => $products->items()]);

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Error searching products', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to search products', 'error' => $e->getMessage()], 500);
        }
    }
}