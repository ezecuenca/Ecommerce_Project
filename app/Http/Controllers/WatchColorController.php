<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WatchColor;

class WatchColorController extends Controller
{
    public function index()
    {
        $watchColors = WatchColor::all();
        return response()->json($watchColors);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'color_name' => 'required|string|max:255|unique:watch_colors,color_name',
        ]);

        $watchColor = WatchColor::create([
            'color_name' => $validated['color_name'],
            'status' => 1,
        ]);

        return response()->json(['message' => 'Watch color created successfully', 'watch_color' => $watchColor], 201);
    }

    public function show($id)
    {
        $watchColor = WatchColor::findOrFail($id);
        return response()->json($watchColor);
    }

    public function update(Request $request, $id)
    {
        $watchColor = WatchColor::findOrFail($id);

        $validated = $request->validate([
            'color_name' => 'required|string|max:255|unique:watch_colors,color_name,' . $id,
        ]);

        $watchColor->update([
            'color_name' => $validated['color_name'],
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Watch color updated successfully', 'watch_color' => $watchColor]);
    }

    public function archive(Request $request)
    {
        $validated = $request->validate([
            'data.ids' => 'required|array',
            'data.ids.*' => 'integer|exists:watch_colors,id',
        ]);

        $ids = $validated['data']['ids'];
        WatchColor::whereIn('id', $ids)->update(['status' => 0, 'updated_at' => now()]);

        return response()->json(['message' => 'Watch colors archived successfully']);
    }

    public function restore(Request $request)
    {
        $validated = $request->validate([
            'data.ids' => 'required|array',
            'data.ids.*' => 'integer|exists:watch_colors,id',
        ]);

        $ids = $validated['data']['ids'];
        WatchColor::whereIn('id', $ids)->update(['status' => 1, 'updated_at' => now()]);

        return response()->json(['message' => 'Watch colors restored successfully']);
    }

    public function destroy($id)
    {
        $watchColor = WatchColor::findOrFail($id);
        $watchColor->delete();

        return response()->json(['message' => 'Watch color deleted successfully']);
    }
}