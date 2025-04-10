<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Color;
use App\Models\WristMeasurement;
use App\Models\Inventory;
// Make sure Review model is imported if you have one (needed for relationship count/avg)
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
                $query->where('status', 1);
            } elseif ($status === 'archived') {
                $query->where('status', 0);
            } else {
                Log::warning('Invalid status parameter', ['status' => $status]);
                return response()->json(['message' => 'Invalid status parameter'], 400);
            }

            $products = $query->paginate($perPage, ['*'], 'page', $page);

            Log::info('Query executed', ['product_count' => $products->count()]);

            $products->getCollection()->transform(function ($product) {
                return [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->category_name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'created_at' => Carbon::parse($product->created_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::parse($product->updated_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
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
            DB::beginTransaction();

            Log::info('Received product creation request', ['data' => $request->all()]);

            $validated = $request->validate([
                'product_name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'color_id' => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) {
                        $color = \App\Models\Color::where('id', $value)->where('status', 1)->first();
                        if (!$color) { $fail("The selected color is invalid or not active."); }
                    },
                ],
                'category_id' => [
                    'nullable',
                    'integer',
                    function ($attribute, $value, $fail) {
                        if ($value) {
                            $category = \App\Models\Category::where('id', $value)->where('status', 1)->first();
                            if (!$category) { $fail("The selected category is invalid or not active."); }
                        }
                    },
                ],
                'wrist_measurement_id' => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) {
                        $wristMeasurement = \App\Models\WristMeasurement::where('id', $value)->where('status', 1)->first();
                        if (!$wristMeasurement) { $fail("The selected wrist measurement is invalid or not active."); }
                    },
                ],
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            Log::info('Validation passed', ['validated' => $validated]);

            $imageUrl = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('public/images', $imageName);
                if (!$path) { throw new \Exception('Failed to store the image.'); }
                $imageUrl = '/storage/images/' . $imageName;
            }

            $productData = [
                'product_name' => $validated['product_name'],
                'description' => $validated['description'],
                'price' => $validated['price'],
                'image_url' => $imageUrl,
                'color_id' => $validated['color_id'],
                'category_id' => $validated['category_id'],
                'wrist_measurement_id' => $validated['wrist_measurement_id'],
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            Log::info('Attempting to create product with data', ['product_data' => $productData]);

            $product = Product::create($productData);

            Inventory::create([
                'product_id' => $product->id,
                'stocks' => 0,
                'status' => 1,
                'quantity_sold' => 0,
                'total_amount' => 0,
                'profit' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            $product->load(['color', 'category', 'wristMeasurement']);

            Log::info('Product created successfully', ['product' => $product]);

            return response()->json([
                'message' => 'Product created successfully.',
                'product' => [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->category_name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'created_at' => Carbon::parse($product->created_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::parse($product->updated_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollback();
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error creating product', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json(['message' => 'Failed to create product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified product including stock, average rating, and review count.
     */
    public function show(Product $product)
    {
        try {
            // Eager load relationships including inventory and reviews
            // We only need count/avg for reviews, loading the relationship isn't strictly needed here but OK
            $product->load(['color', 'category', 'wristMeasurement', 'inventory']);

            // Safely get stock value, default to 0 if no inventory record exists
            $stock = $product->inventory ? $product->inventory->stocks : 0;

            // Calculate review aggregates directly using the relationship query
            // Filter reviews by status if you only want active/approved reviews counted
            $reviewQuery = $product->reviews(); // ->where('status', 'approved'); // Example filter

            $reviewCount = $reviewQuery->count();
            $averageRating = $reviewCount > 0 ? $reviewQuery->avg('rating') : 0;

            // Return a structured response including stock and review aggregates
            return response()->json([
                'id' => $product->id,
                'product_name' => $product->product_name,
                'description' => $product->description,
                'price' => $product->price,
                'image_url' => $product->image_url,
                'color' => $product->color ? $product->color->color_name : null,
                'category' => $product->category ? $product->category->category_name : null,
                'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                'stock' => $stock,
                'average_rating' => number_format($averageRating, 1), // Format to 1 decimal place
                'review_count' => $reviewCount,
                'created_at' => Carbon::parse($product->created_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::parse($product->updated_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
             Log::error("Product not found for ID: {$product->id}.");
             return response()->json(['message' => 'Product not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching product', ['product_id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch product', 'error' => $e->getMessage()], 500);
        }
    }


    /**
     * Update the specified product in the database.
     */
    public function update(Request $request, Product $product)
    {
        try {
            Log::info('Received product update request', ['data' => $request->all()]);

            $validated = $request->validate([
                'product_name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'color_id' => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) {
                        $color = \App\Models\Color::where('id', $value)->where('status', 1)->first();
                        if (!$color) { $fail("The selected color is invalid or not active."); }
                    },
                ],
                'category_id' => [
                    'nullable',
                    'integer',
                    function ($attribute, $value, $fail) {
                        if ($value) {
                            $category = \App\Models\Category::where('id', $value)->where('status', 1)->first();
                            if (!$category) { $fail("The selected category is invalid or not active."); }
                        }
                    },
                ],
                'wrist_measurement_id' => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) {
                        $wristMeasurement = \App\Models\WristMeasurement::where('id', $value)->where('status', 1)->first();
                        if (!$wristMeasurement) { $fail("The selected wrist measurement is invalid or not active."); }
                    },
                ],
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            Log::info('Validation passed', ['validated' => $validated]);

            $imageUrl = $product->image_url;
            if ($request->hasFile('image')) {
                if ($product->image_url && Storage::exists('public/images/' . basename($product->image_url))) {
                    Storage::delete('public/images/' . basename($product->image_url));
                    Log::info('Deleted old image', ['image_url' => $product->image_url]);
                }

                $image = $request->file('image');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('public/images', $imageName);
                if (!$path) { throw new \Exception('Failed to store the image.'); }
                $imageUrl = '/storage/images/' . $imageName;
                Log::info('New image stored', ['image_url' => $imageUrl]);
            }

            $product->update([
                'product_name' => $validated['product_name'],
                'description' => $validated['description'],
                'price' => $validated['price'],
                'image_url' => $imageUrl,
                'color_id' => $validated['color_id'],
                'category_id' => $validated['category_id'],
                'wrist_measurement_id' => $validated['wrist_measurement_id'],
                'updated_at' => now(),
            ]);

            $product->load(['color', 'category', 'wristMeasurement']);

            Log::info('Product updated successfully', ['product' => $product]);

            // Fetch stock and review data to include in the update response
            $stock = $product->inventory ? $product->inventory->stocks : 0;
            $reviewQuery = $product->reviews(); // ->where('status', 'approved'); // Apply filter if needed
            $reviewCount = $reviewQuery->count();
            $averageRating = $reviewCount > 0 ? $reviewQuery->avg('rating') : 0;


            return response()->json([
                'message' => 'Product updated successfully.',
                'product' => [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->category_name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                   'stock' => $stock, // Include stock in update response
                   'average_rating' => number_format($averageRating, 1), // Include rating
                   'review_count' => $reviewCount, // Include count
                   'created_at' => Carbon::parse($product->created_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::parse($product->updated_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating product', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json(['message' => 'Failed to update product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Archive products (bulk action).
     */
    public function archive(Request $request)
    {
        try {
            Log::info('Archive request received', ['body' => $request->getContent(), 'headers' => $request->headers->all()]);
            $productIds = $request->input('ids', []);
            if (empty($productIds)) {
                Log::error('No product IDs provided to archive');
                return response()->json(['message' => 'No product IDs provided to archive'], 400);
            }
            $updatedCount = Product::whereIn('id', $productIds)->update(['status' => 0]);
            Log::info('Products archived', ['updated_count' => $updatedCount]);
            return response()->json(['message' => 'Products archived successfully.', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error archiving products', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to archive products', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Restore products (bulk action).
     */
    public function restore(Request $request)
    {
        try {
            Log::info('Restore request received', ['body' => $request->getContent(), 'headers' => $request->headers->all()]);
            $productIds = $request->input('ids', []);
            if (empty($productIds)) {
                Log::error('No product IDs provided to restore');
                return response()->json(['message' => 'No product IDs provided to restore'], 400);
            }
            $updatedCount = Product::whereIn('id', $productIds)->update(['status' => 1]);
            Log::info('Products restored', ['updated_count' => $updatedCount]);
            return response()->json(['message' => 'Products restored successfully.', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error restoring products', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to restore products', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Search products.
     */
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
                $productsQuery->where('status', 1);
            } elseif ($status === 'archived') {
                $productsQuery->where('status', 0);
            } else {
                return response()->json(['message' => 'Invalid status parameter'], 400);
            }

            if ($query) {
                $productsQuery->where('product_name', 'LIKE', "%{$query}%");
            }

            $products = $productsQuery->paginate($perPage, ['*'], 'page', $page);

            $products->getCollection()->transform(function ($product) {
                // Calculate review data per product in search results too
                 $reviewQuery = $product->reviews(); // ->where('status', 'approved'); // Optional filter
                 $reviewCount = $reviewQuery->count();
                 $averageRating = $reviewCount > 0 ? $reviewQuery->avg('rating') : 0;
                 $stock = $product->inventory ? $product->inventory->stocks : 0; // Include stock in search too

                return [
                    'id' => $product->id,
                    'product_name' => $product->product_name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'color' => $product->color ? $product->color->color_name : null,
                    'category' => $product->category ? $product->category->category_name : null,
                    'wrist_measurement' => $product->wristMeasurement ? $product->wristMeasurement->measurement : null,
                    'stock' => $stock, // Add stock
                    'average_rating' => number_format($averageRating, 1), // Add rating
                    'review_count' => $reviewCount, // Add count
                    'created_at' => Carbon::parse($product->created_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::parse($product->updated_at)->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
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