<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::all();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_name' => 'required|string|max:255|unique:categories',
            'status' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = Category::create([
            'category_name' => $request->category_name,
            'created_at' => now(),
            'status' => $request->input('status', 1)
        ]);

        return response()->json(['message' => 'Category created successfully', 'data' => $category], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'category_name' => 'required|string|max:255|unique:categories,category_name,' . $id,
            'status' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $category->category_name = $request->category_name;
        $category->updated_at = now();
        $category->status = $request->input('status', $category->status);
        $category->save();

        return response()->json(['message' => 'Category updated successfully', 'data' => $category]);
    }

    public function archive(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data.ids' => 'required|array',
                'data.ids.*' => 'integer',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $ids = $request->input('data.ids');

            Category::whereIn('id', $ids)->update(['status' => 0]);

            return response()->json(['message' => 'Categories archived successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to archive categories', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:categories,id',
        ]);

        $ids = $request->input('ids');
        Category::whereIn('id', $ids)->update(['status' => 1]);

        return response()->json(['message' => 'Categories restored successfully']);
    }
}