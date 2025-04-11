<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Fetching categories request', ['query_params' => $request->query()]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $statusParam = $request->query('status', 'active');
            $searchQuery = $request->query('search');

            $query = Category::query();

            if ($statusParam === 'active') {
                Log::info('Applying active filter (status = 1)');
                $query->where('status', 1);
            } elseif ($statusParam === 'archived') {
                Log::info('Applying archived filter (status = 0)');
                $query->where('status', 0);
            } else {
                Log::warning('Invalid status param received, defaulting to active.', ['status' => $statusParam]);
                $query->where('status', 1);
            }

            if ($searchQuery) {
                Log::info('Applying category search filter', ['search' => $searchQuery]);
                $query->where('category_name', 'LIKE', "%{$searchQuery}%");
            }

            $categoriesPaginator = $query->orderBy('created_at', 'desc')
                                          ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Categories fetched successfully', [
                'total' => $categoriesPaginator->total(),
                'current_page' => $categoriesPaginator->currentPage(),
                'per_page' => $categoriesPaginator->perPage(),
                'last_page' => $categoriesPaginator->lastPage(),
                'status_applied' => $statusParam
            ]);

            return response()->json($categoriesPaginator);

        } catch (\Exception $e) {
            Log::error('Error fetching categories', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch categories', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_name' => 'required|string|max:255|unique:categories,category_name',
            'status' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
             $category = Category::create([
                'category_name' => $request->category_name,
                'status' => $request->input('status', 1),
            ]);

            Log::info('Category created successfully', ['id' => $category->id]);
            return response()->json(['message' => 'Category created successfully', 'data' => $category], 201);

        } catch (\Exception $e) {
            Log::error('Error storing category', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create category', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
         $category = Category::find($id);
         if (!$category) {
             return response()->json(['message' => 'Category not found'], 404);
         }

         $validator = Validator::make($request->all(), [
            'category_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories')->ignore($category->id),
            ],
            'status' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $updateData = [
                'category_name' => $request->category_name,
            ];
            if ($request->has('status')) {
                $updateData['status'] = $request->boolean('status');
            }

            $category->update($updateData);

            Log::info('Category updated successfully', ['id' => $category->id]);
            return response()->json(['message' => 'Category updated successfully', 'data' => $category]);

        } catch (\Exception $e) {
            Log::error('Error updating category', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update category', 'error' => $e->getMessage()], 500);
        }
    }

    public function archive(Request $request)
    {
        Log::info('Received category archive request', ['payload' => $request->all()]);
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.ids' => 'required|array',
                'data.ids.*' => 'integer|exists:categories,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $ids = $request->input('data.ids');

            $updatedCount = Category::whereIn('id', $ids)
                                    ->where('status', 1)
                                    ->update(['status' => 0]);

            Log::info('Categories archived attempt', ['ids' => $ids, 'updated_count' => $updatedCount]);

            if ($updatedCount > 0) {
                return response()->json(['message' => 'Categories archived successfully', 'updated_count' => $updatedCount], 200);
            } else {
                 return response()->json(['message' => 'No active categories found matching the provided IDs to archive.', 'updated_count' => 0], 200);
            }

        } catch (ValidationException $e) {
             Log::error('Validation failed during category archive', ['errors' => $e->errors()]);
             return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error archiving categories', [ 'error' => $e->getMessage(), 'payload' => $request->all()]);
            return response()->json(['message' => 'Failed to archive categories', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        Log::info('Received category restore request', ['payload' => $request->all()]);
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.ids' => 'required|array',
                'data.ids.*' => 'integer|exists:categories,id',
            ]);

             if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $ids = $request->input('data.ids');

            $updatedCount = Category::whereIn('id', $ids)
                                    ->where('status', 0)
                                    ->update(['status' => 1]);

            Log::info('Categories restore attempt', ['ids' => $ids, 'updated_count' => $updatedCount]);

            if ($updatedCount > 0) {
                 return response()->json(['message' => 'Categories restored successfully', 'updated_count' => $updatedCount], 200);
            } else {
                 return response()->json(['message' => 'No archived categories found matching the provided IDs to restore.', 'updated_count' => 0], 200);
            }

        } catch (ValidationException $e) {
             Log::error('Validation failed during category restore', ['errors' => $e->errors()]);
             return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error restoring categories', [ 'error' => $e->getMessage(), 'payload' => $request->all()]);
            return response()->json(['message' => 'Failed to restore categories', 'error' => $e->getMessage()], 500);
        }
    }
}