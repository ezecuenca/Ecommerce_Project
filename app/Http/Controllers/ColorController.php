<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Color;
use Illuminate\Support\Facades\Validator;

class ColorController extends Controller
{
    public function index()
    {
        return Color::all();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'color_name' => 'required|string|max:255|unique:watch_colors',
            'status' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $color = Color::create([
            'color_name' => $request->color_name,
            'created_at' => now(),
            'status' => $request->input('status', 1)
        ]);

        return response()->json(['message' => 'Color created successfully', 'data' => $color], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'color_name' => 'required|string|max:255|unique:watch_colors,color_name,' . $id,
            'status' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $color = Color::find($id);
        if (!$color) {
            return response()->json(['message' => 'Color not found'], 404);
        }

        $color->color_name = $request->color_name;
        $color->updated_at = now();
        $color->status = $request->input('status', $color->status);
        $color->save();

        return response()->json(['message' => 'Color updated successfully', 'data' => $color]);
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

            Color::whereIn('id', $ids)->update(['status' => 0]);

            return response()->json(['message' => 'Colors archived successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to archive colors', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:watch_colors,id',
        ]);

        $ids = $request->input('ids');
        Color::whereIn('id', $ids)->update(['status' => 1]);

        return response()->json(['message' => 'Colors restored successfully']);
    }
}