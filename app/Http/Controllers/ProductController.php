<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Color;
use App\Models\WristMeasurement;
use App\Models\Inventory;
use App\Models\Review;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     * *** MODIFIED: Added review count and average rating ***
     */
    public function index(Request $request)
    {
        try {
            Log::info('Fetching products', ['query' => $request->query()]);

            $page = $request->query('page', 1);
            // Use a reasonable default, or let frontend dictate completely
            $perPage = $request->query('per_page', 10); // Or use your previous 100 if intended
            $status = $request->query('status', 'active');
            $searchQuery = $request->query('search'); // Added search query handling
            $categoryFilter = $request->query('category'); // Added category query handling

            // Start query and eager load base relationships
            $query = Product::with(['category', 'color', 'wristMeasurement'])
                            // --- ADDED: Eager load review stats ---
                            ->withCount('reviews') // Adds 'reviews_count' attribute
                            ->withAvg('reviews as reviews_avg_rating', 'rating'); // Adds 'reviews_avg_rating' attribute
                            // --- END ADDED ---

            Log::info('Building query', ['status' => $status]);

            // Apply Status Filtering
            if ($status === 'active') {
                $query->where('status', 1);
            } elseif ($status === 'archived') {
                $query->where('status', 0);
            }

            // Apply Category Filtering (Example by name)
            if ($categoryFilter) {
                $query->whereHas('category', function ($q) use ($categoryFilter) {
                    $q->where('category_name', $categoryFilter); // Or filter by ID if needed
                });
            }

            // Apply Search Filtering
            if ($searchQuery) {
                 $query->where(function ($q) use ($searchQuery) {
                     $q->where('product_name', 'LIKE', "%{$searchQuery}%")
                       ->orWhere('description', 'LIKE', "%{$searchQuery}%");
                     // Add orWhereHas for related searches if needed
                 });
            }


            // Execute Paginated Query
            $products = $query->orderBy('created_at', 'desc') // Added example ordering
                              ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Query executed', ['product_count_on_page' => $products->count(), 'total_products' => $products->total()]);
            Log::info('Products fetched successfully', ['products_found' => $products->total()]);

            // --- Return Paginator directly ---
            // The paginator object already includes the loaded relationships
            // AND the calculated 'reviews_count' and 'reviews_avg_rating' attributes.
            // No need for manual transformation here.
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

    // --- store() method remains unchanged ---
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            Log::info('Received product creation request', ['data' => $request->all()]);
            $validated = $request->validate([
                'product_name' => 'required|string|max:255|unique:products,product_name',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'color_id' => ['required', 'integer', 'exists:watch_colors,id,status,1'],
                'category_id' => ['required', 'integer', 'exists:categories,id,status,1'],
                'wrist_measurement_id' => ['required', 'integer', 'exists:wrist_measurements,id,status,1'],
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            Log::info('Validation passed', ['validated' => $validated]);
            $imageUrl = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('images', $imageName, 'public');
                if (!$path) { throw new \Exception('Failed to store the image.'); }
                $imageUrl = Storage::disk('public')->url($path);
                Log::info('Image stored', ['path' => $path, 'url' => $imageUrl]);
            }
            $productData = $validated;
            $productData['image_url'] = $imageUrl;
            $productData['status'] = 1;
            Log::info('Attempting to create product with data', ['product_data' => $productData]);
            $product = Product::create($productData);
            if (!$product) { throw new \Exception('Product model creation returned null.'); }
            Log::info('Product model instance created', ['product_id' => $product->id]);
            Inventory::create([ 'product_id' => $product->id, 'stocks' => 1, 'status' => 1, 'quantity_sold' => 0, 'total_amount' => 0, ]); // Default stock to 1? Or validate?
            Log::info('Inventory created for product ID: ' . $product->id);
            DB::commit();
            Log::info('Transaction committed successfully');
            $product->load(['color', 'category', 'wristMeasurement']);
            return response()->json([ 'message' => 'Product created successfully.', 'product' => $product ], 201);
        } catch (ValidationException $e) {
            DB::rollback(); Log::error('Validation failed during product creation', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollback(); Log::error('Error creating product', [ 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'request_data' => $request->except('image'), ]);
            return response()->json(['message' => 'Failed to create product', 'error' => $e->getMessage()], 500);
        }
    }

    // --- show() method remains unchanged ---
    public function show(Product $product)
    {
        try {
            $product->load(['color', 'category', 'wristMeasurement', 'inventory', 'reviews']);
            $stock = $product->inventory->stocks ?? 0;
            $reviewQuery = $product->reviews(); // Use relationship method
            $reviewCount = $reviewQuery->count();
            $averageRating = $reviewCount > 0 ? $reviewQuery->avg('rating') : 0;
            $productData = $product->toArray();
            $productData['stock'] = $stock;
            $productData['average_rating'] = number_format($averageRating, 1); // Keep formatting if desired
            $productData['review_count'] = $reviewCount;
            return response()->json($productData);
        } catch (ModelNotFoundException $e) {
             Log::warning("Product lookup failed", ['product_id' => $product->id]);
             return response()->json(['message' => 'Product not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching product details', ['product_id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch product details', 'error' => $e->getMessage()], 500);
        }
    }

    // --- update() method remains unchanged ---
    public function update(Request $request, Product $product)
    {
        DB::beginTransaction();
        try {
            Log::info('Received product update request', ['product_id' => $product->id, 'data' => $request->except('image')]);
            $validated = $request->validate([
                'product_name' => ['required','string','max:255', Rule::unique('products')->ignore($product->id)],
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'color_id' => ['required','integer','exists:watch_colors,id,status,1'],
                'category_id' => ['required','integer','exists:categories,id,status,1'],
                'wrist_measurement_id' => ['required','integer','exists:wrist_measurements,id,status,1'],
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            Log::info('Validation passed for update', ['validated' => $validated]);
            $updateData = $validated;
            if ($request->hasFile('image')) {
                 if ($product->image_url) {
                      $oldImagePath = str_replace(Storage::disk('public')->url(''), '', $product->image_url);
                      if (Storage::disk('public')->exists($oldImagePath)) { Storage::disk('public')->delete($oldImagePath); Log::info('Deleted old image during update', ['path' => $oldImagePath]); }
                 }
                 $image = $request->file('image');
                 $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                 $path = $image->storeAs('images', $imageName, 'public');
                 if (!$path) { throw new \Exception('Failed to store the new image.'); }
                 $updateData['image_url'] = Storage::disk('public')->url($path);
                 Log::info('New image stored during update', ['path' => $path, 'url' => $updateData['image_url']]);
            }
            $product->update($updateData);
            Log::info('Product record updated', ['product_id' => $product->id]);
            DB::commit();
            $product->load(['color', 'category', 'wristMeasurement', 'inventory', 'reviews']);
            return response()->json([ 'message' => 'Product updated successfully.', 'product' => $product ]);
        } catch (ValidationException $e) {
            DB::rollback(); Log::error('Validation failed during product update', ['product_id' => $product->id, 'errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollback(); Log::error('Error updating product', [ 'product_id' => $product->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'request_data' => $request->except('image'), ]);
            return response()->json(['message' => 'Failed to update product', 'error' => $e->getMessage()], 500);
        }
    }

    // --- archive() method remains unchanged ---
    public function archive(Request $request)
    {
        try {
            Log::info('Archive request received', ['payload' => $request->all()]);
             // Assuming frontend sends {ids: [...]} based on fixes for other controllers
             $validator = Validator::make($request->input(), [
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:products,id'
            ]);
            if ($validator->fails()) { return response()->json(['message' => 'Validation Failed', 'errors' => $validator->errors()], 422); } // Return 422 on validation failure
            $productIds = $validator->validated()['ids']; // Use validated IDs
            if (empty($productIds)) { return response()->json(['message' => 'No valid IDs provided to archive.'], 200); } // Be more specific
            $updatedCount = Product::whereIn('id', $productIds)->where('status', 1)->update(['status' => 0]);
            Log::info('Products archived', ['ids' => $productIds, 'updated_count' => $updatedCount]);
            return response()->json(['message' => 'Products archived successfully.', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error archiving products', [ 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'ids' => $request->input('ids') ]);
            return response()->json(['message' => 'Failed to archive products', 'error' => $e->getMessage()], 500);
        }
    }

    // --- restore() method remains unchanged ---
    public function restore(Request $request)
    {
        try {
            Log::info('Restore request received', ['payload' => $request->all()]);
             // Assuming frontend sends {ids: [...]}
             $validator = Validator::make($request->input(), [
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:products,id'
            ]);
            if ($validator->fails()) { return response()->json(['message' => 'Validation Failed', 'errors' => $validator->errors()], 422); } // Return 422
            $productIds = $validator->validated()['ids'];
            if (empty($productIds)) { return response()->json(['message' => 'No valid IDs provided to restore.'], 200); }
            $updatedCount = Product::whereIn('id', $productIds)->where('status', 0)->update(['status' => 1]);
            Log::info('Products restored', ['ids' => $productIds, 'updated_count' => $updatedCount]);
            return response()->json(['message' => 'Products restored successfully.', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error restoring products', [ 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'ids' => $request->input('ids') ]);
            return response()->json(['message' => 'Failed to restore products', 'error' => $e->getMessage()], 500);
        }
    }

    // --- search() method remains unchanged ---
    public function search(Request $request)
    {
        try {
            Log::info('Searching products', ['query' => $request->query()]);
            $searchQuery = $request->input('query');
            $status = $request->query('status', 'active');
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $productsQuery = Product::with(['color', 'category', 'wristMeasurement', 'inventory', 'reviews'])
                            // Add review stats here too if search results need them
                            ->withCount('reviews')
                            ->withAvg('reviews as reviews_avg_rating', 'rating');

            if ($status === 'active') { $productsQuery->where('status', 1); }
            elseif ($status === 'archived') { $productsQuery->where('status', 0); }
            if ($searchQuery) {
                 $productsQuery->where(function ($q) use ($searchQuery) {
                     $q->where('product_name', 'LIKE', "%{$searchQuery}%")->orWhere('description', 'LIKE', "%{$searchQuery}%");
                 });
            }
            $products = $productsQuery->paginate($perPage, ['*'], 'page', $page);
            // Keep transformation if you want calculated fields directly in search response
            $products->getCollection()->transform(function ($product) {
                 $reviewQuery = $product->reviews();
                 $reviewCount = $product->reviews_count; // Use eager loaded count
                 $averageRating = $product->reviews_avg_rating ?? 0; // Use eager loaded average
                 $stock = $product->inventory->stocks ?? 0;
                 $productArray = $product->toArray();
                 $productArray['stock'] = $stock;
                 $productArray['average_rating'] = number_format($averageRating, 1);
                 $productArray['review_count'] = $reviewCount;
                 return $productArray;
            });
            Log::info('Products search completed', ['products_found' => $products->total()]);
            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Error searching products', [ 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'query' => $request->input('query'), 'status' => $request->query('status') ]);
            return response()->json(['message' => 'Failed to search products', 'error' => $e->getMessage()], 500);
        }
    }
}