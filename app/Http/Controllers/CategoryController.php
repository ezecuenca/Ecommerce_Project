<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        try {
            return Category::all();
        } catch (\Exception $e) {
            \Log::error('Error fetching categories:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch categories'], 500);
        }
    }

    public function show($id)
    {
        try {
            $category = Category::find($id);
            if (!$category) {
                return response()->json(['message' => 'Category not found'], 404);
            }
            return response()->json($category, 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching category:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch category'], 500);
        }
    }

    public function store(Request $request)
    {
        \Log::info('Store request data:', $request->all());

        $request->validate([
            'category_name' => 'required|string|max:255|unique:categories',
            'status' => 'nullable|integer|in:0,1',
            'created_at' => 'nullable|date',
            'updated_at' => 'nullable|date',
        ]);

        $category = Category::create([
            'category_name' => $request->category_name,
            'created_at' => $request->input('created_at', now()),
            'updated_at' => $request->input('updated_at', now()),
            'status' => $request->input('status', 1),
        ]);

        return response()->json(['message' => 'Category created successfully', 'data' => $category], 201);
    }

    public function update(Request $request, $id)
    {
        \Log::info('Update request data:', $request->all());

        $request->validate([
            'category_name' => 'required|string|max:255|unique:categories,category_name,' . $id,
            'status' => 'nullable|integer|in:0,1',
            'updated_at' => 'nullable|date',
        ]);

        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $category->category_name = $request->category_name;
        $category->updated_at = $request->input('updated_at', now());
        $category->status = $request->input('status', $category->status);
        $category->save();

        return response()->json(['message' => 'Category updated successfully', 'data' => $category], 200);
    }

    public function archive(Request $request)
    {
        \Log::info('Archive request data:', $request->all());

        $request->validate([
            'data.ids' => 'required|array',
            'data.ids.*' => 'integer|exists:categories,id',
        ]);

        $ids = $request->input('data.ids');
        Category::whereIn('id', $ids)->update([
            'status' => 0,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Categories archived successfully'], 200);
    }

    public function restore(Request $request)
    {
        \Log::info('Restore request data:', $request->all());

        $request->validate([
            'data.ids' => 'required|array',
            'data.ids.*' => 'integer|exists:categories,id',
        ]);

        $ids = $request->input('data.ids');
        Category::whereIn('id', $ids)->update([
            'status' => 1,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Categories restored successfully'], 200);
    }
}