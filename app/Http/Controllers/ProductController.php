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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // THIS METHOD IS ALREADY CORRECT - It returns the paginator which JSON encodes
        // the products with their eagerly loaded nested relationships. NO CHANGE NEEDED HERE.
        try {
            Log::info('Fetching products', ['query' => $request->query()]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 100); // Keep default or use frontend value e.g., 5
            $status = $request->query('status', 'active');

            // Eager loading is correct
            $query = Product::with(['category', 'color', 'wristMeasurement']);

            Log::info('Building query', ['status' => $status]);

            if ($status === 'active') {
                $query->where('status', 1);
            } elseif ($status === 'archived') {
                $query->where('status', 0);
            }

            $products = $query->paginate($perPage, ['*'], 'page', $page);

            Log::info('Query executed', ['product_count_on_page' => $products->count(), 'total_products' => $products->total()]);
            Log::info('Products fetched successfully', ['products_found' => $products->total()]);

            // Returning the paginator directly sends nested relations correctly
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
                'wrist_measurement_id' => ['required', 'integer', 'exists:wrist_measurements,id,status,1'], // Corrected table name if needed
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

            Inventory::create([
                'product_id' => $product->id, 'stocks' => 0, 'status' => 1, 'quantity_sold' => 0, 'total_amount' => 0,
            ]);
            Log::info('Inventory created for product ID: ' . $product->id);

            DB::commit();
            Log::info('Transaction committed successfully');

            // Load the relationships to include them in the response
            $product->load(['color', 'category', 'wristMeasurement']);

            // --- MODIFIED RESPONSE STRUCTURE ---
            return response()->json([
                'message' => 'Product created successfully.',
                // Return the product object which will be JSON encoded with nested relations
                'product' => $product
            ], 201);
            // Note: Frontend's handleSaveEditOrAdd needs to correctly process this structure if it expects flat fields.
            // However, returning the same structure as index() is more consistent.
            // The current handleSaveEditOrAdd seems okay as it spreads savedProductData.

        } catch (ValidationException $e) {
            DB::rollback();
            Log::error('Validation failed during product creation', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error creating product', [
                'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'request_data' => $request->except('image'),
            ]);
            return response()->json(['message' => 'Failed to create product', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Product $product)
    {
        try {
            // Ensure all necessary relationships are loaded
            $product->load(['color', 'category', 'wristMeasurement', 'inventory', 'reviews']);

            $stock = $product->inventory->stocks ?? 0;
            $reviewQuery = $product->reviews();
            $reviewCount = $reviewQuery->count();
            $averageRating = $reviewCount > 0 ? $reviewQuery->avg('rating') : 0;

            // --- MODIFIED RESPONSE STRUCTURE ---
            // Create an array representation including nested objects and additional fields
            $productData = $product->toArray(); // Includes loaded relations by default
            $productData['stock'] = $stock;
            $productData['average_rating'] = number_format($averageRating, 1);
            $productData['review_count'] = $reviewCount;
            // Note: Timestamps are likely already in the format needed or frontend handles it.

            return response()->json($productData); // Return the enriched array

        } catch (ModelNotFoundException $e) {
             Log::warning("Product lookup failed", ['product_id' => $product->id]);
             return response()->json(['message' => 'Product not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching product details', ['product_id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch product details', 'error' => $e->getMessage()], 500);
        }
    }

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
                'wrist_measurement_id' => ['required','integer','exists:wrist_measurements,id,status,1'], // Corrected table name if needed
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                // remove_image logic seems missing from validation/processing - add if needed
            ]);

            Log::info('Validation passed for update', ['validated' => $validated]);

            $updateData = $validated;

            if ($request->hasFile('image')) {
                 // Handle image update (existing logic seems okay)
                 if ($product->image_url) {
                      $oldImagePath = str_replace(Storage::disk('public')->url(''), '', $product->image_url);
                      if (Storage::disk('public')->exists($oldImagePath)) {
                          Storage::disk('public')->delete($oldImagePath);
                          Log::info('Deleted old image during update', ['path' => $oldImagePath]);
                      }
                 }
                 $image = $request->file('image');
                 $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                 $path = $image->storeAs('images', $imageName, 'public');
                 if (!$path) { throw new \Exception('Failed to store the new image.'); }
                 $updateData['image_url'] = Storage::disk('public')->url($path);
                 Log::info('New image stored during update', ['path' => $path, 'url' => $updateData['image_url']]);
            }
            // Add logic for removing image if 'remove_image' flag is present

            $product->update($updateData);
            Log::info('Product record updated', ['product_id' => $product->id]);

            DB::commit();

            // Reload relationships AFTER update to send fresh data
            $product->load(['color', 'category', 'wristMeasurement', 'inventory', 'reviews']);

            // --- MODIFIED RESPONSE STRUCTURE ---
            return response()->json([
                'message' => 'Product updated successfully.',
                // Return the updated product object which includes nested relations
                'product' => $product
            ]);
            // Again, frontend handleSaveEditOrAdd needs to handle this structure.

        } catch (ValidationException $e) {
            DB::rollback();
            Log::error('Validation failed during product update', ['product_id' => $product->id, 'errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error updating product', [
                'product_id' => $product->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'request_data' => $request->except('image'),
            ]);
            return response()->json(['message' => 'Failed to update product', 'error' => $e->getMessage()], 500);
        }
    }

    public function archive(Request $request)
    {
        // This method doesn't return product data, structure is fine. NO CHANGE NEEDED.
        try {
            Log::info('Archive request received', ['payload' => $request->all()]);
            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:products,id'
            ]);
            $productIds = $validated['ids'];

            $updatedCount = Product::whereIn('id', $productIds)->where('status', 1)->update(['status' => 0]);

            Log::info('Products archived', ['ids' => $productIds, 'updated_count' => $updatedCount]);
            return response()->json(['message' => 'Products archived successfully.', 'updated_count' => $updatedCount]);

        } catch (ValidationException $e) {
             Log::error('Validation failed during product archive', ['errors' => $e->errors()]);
             return response()->json(['message' => 'Invalid input provided.', 'errors' => $e->errors()], 400);
        } catch (\Exception $e) {
            Log::error('Error archiving products', [
                'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'ids' => $request->input('ids')
            ]);
            return response()->json(['message' => 'Failed to archive products', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        // This method doesn't return product data, structure is fine. NO CHANGE NEEDED.
        try {
            Log::info('Restore request received', ['payload' => $request->all()]);
            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:products,id'
            ]);
            $productIds = $validated['ids'];

            $updatedCount = Product::whereIn('id', $productIds)->where('status', 0)->update(['status' => 1]);

            Log::info('Products restored', ['ids' => $productIds, 'updated_count' => $updatedCount]);
            return response()->json(['message' => 'Products restored successfully.', 'updated_count' => $updatedCount]);

        } catch (ValidationException $e) {
             Log::error('Validation failed during product restore', ['errors' => $e->errors()]);
             return response()->json(['message' => 'Invalid input provided.', 'errors' => $e->errors()], 400);
        } catch (\Exception $e) {
            Log::error('Error restoring products', [
                'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'ids' => $request->input('ids')
            ]);
            return response()->json(['message' => 'Failed to restore products', 'error' => $e->getMessage()], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            Log::info('Searching products', ['query' => $request->query()]);

            $searchQuery = $request->input('query');
            $status = $request->query('status', 'active');
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5); // Use frontend value

            // Ensure relationships needed by the frontend AND calculations are loaded
            $productsQuery = Product::with(['color', 'category', 'wristMeasurement', 'inventory', 'reviews']);

            if ($status === 'active') {
                $productsQuery->where('status', 1);
            } elseif ($status === 'archived') {
                $productsQuery->where('status', 0);
            } else {
                // No need for error, just don't filter by status if invalid
                // Log::warning('Invalid status parameter during search', ['status' => $status]);
                // return response()->json(['message' => 'Invalid status parameter'], 400);
            }

            if ($searchQuery) {
                 $productsQuery->where(function ($q) use ($searchQuery) {
                     $q->where('product_name', 'LIKE', "%{$searchQuery}%")
                       ->orWhere('description', 'LIKE', "%{$searchQuery}%");
                       // Add searching on relationship fields if desired
                       // ->orWhereHas('category', fn($q) => $q->where('category_name', 'LIKE', "%{$searchQuery}%"))
                       // ->orWhereHas('color', fn($q) => $q->where('color_name', 'LIKE', "%{$searchQuery}%"))
                       // ->orWhereHas('wristMeasurement', fn($q) => $q->where('measurement', 'LIKE', "%{$searchQuery}%"));
                 });
            }

            $products = $productsQuery->paginate($perPage, ['*'], 'page', $page);

            // --- MODIFIED TRANSFORM ---
            // Keep the transformation if you need calculated fields like stock/rating,
            // but ensure the original nested objects are preserved.
            $products->getCollection()->transform(function ($product) {
                 $reviewQuery = $product->reviews(); // Assumes reviews relationship exists
                 $reviewCount = $reviewQuery->count();
                 $averageRating = $reviewCount > 0 ? $reviewQuery->avg('rating') : 0;
                 $stock = $product->inventory->stocks ?? 0; // Assumes inventory relationship exists

                 // Start with the product model's array representation, which includes loaded relations
                 $productArray = $product->toArray();

                 // Add calculated fields
                 $productArray['stock'] = $stock;
                 $productArray['average_rating'] = number_format($averageRating, 1);
                 $productArray['review_count'] = $reviewCount;
                 // Keep related objects as they are (already included in toArray())
                 // $productArray['category'] = $product->category;
                 // $productArray['color'] = $product->color;
                 // $productArray['wristMeasurement'] = $product->wristMeasurement; // Key matches frontend

                 return $productArray; // Return the modified array with nested relations intact
            });

            Log::info('Products search completed', ['products_found' => $products->total()]);

            // Return the paginator - the transformed collection is automatically used
            return response()->json($products);

        } catch (\Exception $e) {
            Log::error('Error searching products', [
                'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'query' => $request->input('query'), 'status' => $request->query('status')
            ]);
            return response()->json(['message' => 'Failed to search products', 'error' => $e->getMessage()], 500);
        }
    }
}