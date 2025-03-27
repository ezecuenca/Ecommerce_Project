<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Color;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ColorController extends Controller
{
    /**
     * Display a listing of all colors (active and archived).
     */
    public function index()
    {
        try {
            Log::info('Fetching colors from watch_colors table');

            // Remove the status filter to fetch all colors
            $query = Color::query();
            Log::info('Raw query for colors', ['query' => $query->toSql(), 'bindings' => $query->getBindings()]);

            // Include all necessary fields for the frontend
            $colors = $query->get(['id', 'color_name', 'status', 'created_at', 'updated_at']);

            Log::info('Colors fetched successfully', ['colors' => $colors]);

            if ($colors->isEmpty()) {
                Log::warning('No colors found in watch_colors table');
            }

            return response()->json($colors);
        } catch (\Exception $e) {
            Log::error('Error fetching colors', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Failed to fetch colors', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created color in the database.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'color_name' => 'required|string|max:255|unique:watch_colors',
            'status' => 'nullable|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $color = Color::create([
            'color_name' => $request->color_name,
            'created_at' => now(),
            'updated_at' => now(),
            'status' => $request->input('status', 1)
        ]);

        return response()->json(['message' => 'Color created successfully', 'data' => $color], 201);
    }

    /**
     * Display the specified color.
     */
    public function show($id)
    {
        $color = Color::find($id);

        if (!$color) {
            return response()->json(['message' => 'Color not found'], 404);
        }

        return response()->json($color);
    }

    /**
     * Update the specified color in the database.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'color_name' => 'required|string|max:255|unique:watch_colors,color_name,' . $id,
            'status' => 'nullable|integer|in:0,1',
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

    /**
     * Archive colors (bulk action).
     */
    public function archive(Request $request)
    {
        try {
            Log::info('Archive request received', [
                'body' => $request->getContent(),
                'headers' => $request->headers->all(),
            ]);

            $data = $request->json()->all();
            Log::info('Parsed request data', ['data' => $data]);

            if (empty($data)) {
                Log::error('Request body is empty or not valid JSON');
                return response()->json(['errors' => ['body' => 'Request body is empty or not valid JSON']], 422);
            }

            if (!array_key_exists('ids', $data)) {
                Log::error('The ids field is missing in the request body');
                return response()->json(['errors' => ['ids' => 'The ids field is required.']], 422);
            }

            $validator = Validator::make($data, [
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:watch_colors,id',
            ]);

            if ($validator->fails()) {
                $errors = $validator->errors()->toArray();
                Log::error('Validation failed', ['errors' => $errors]);
                return response()->json(['errors' => $errors], 422);
            }

            $ids = $data['ids'];
            Log::info('IDs to archive', ['ids' => $ids]);

            if (empty($ids)) {
                Log::error('No IDs provided to archive');
                return response()->json(['errors' => ['ids' => 'No IDs provided to archive']], 400);
            }

            $updatedCount = Color::whereIn('id', $ids)->update(['status' => 0]);

            Log::info('Colors archived', ['updated_count' => $updatedCount]);

            return response()->json(['message' => 'Colors archived successfully', 'updated_count' => $updatedCount], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving colors', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to archive colors', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Restore archived colors (bulk action).
     */
    public function restore(Request $request)
    {
        try {
            Log::info('Restore request received', [
                'body' => $request->getContent(),
                'headers' => $request->headers->all(),
            ]);

            $data = $request->json()->all();
            Log::info('Parsed request data', ['data' => $data]);

            if (empty($data)) {
                Log::error('Request body is empty or not valid JSON');
                return response()->json(['errors' => ['body' => 'Request body is empty or not valid JSON']], 422);
            }

            $validator = Validator::make($data, [
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:watch_colors,id',
            ]);

            if ($validator->fails()) {
                $errors = $validator->errors()->toArray();
                Log::error('Validation failed', ['errors' => $errors]);
                return response()->json(['errors' => $errors], 422);
            }

            $ids = $data['ids'];
            Log::info('IDs to restore', ['ids' => $ids]);

            if (empty($ids)) {
                return response()->json(['errors' => ['ids' => 'No IDs provided to restore']], 400);
            }

            $updatedCount = Color::whereIn('id', $ids)->update(['status' => 1]);

            return response()->json(['message' => 'Colors restored successfully', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error restoring colors', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to restore colors', 'error' => $e->getMessage()], 500);
        }
    }
}