<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Color;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ColorController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Fetching watch colors request', ['query_params' => $request->query()]);
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $statusParam = $request->query('status', 'active');
            $searchQuery = $request->query('search');

            $query = Color::query();

            if ($statusParam === 'active') {
                $query->where('status', 1);
            } elseif ($statusParam === 'archived') {
                $query->where('status', 0);
            } else {
                $query->where('status', 1);
            }

            if ($searchQuery) {
                $query->where('color_name', 'LIKE', "%{$searchQuery}%");
            }

            $colorsPaginator = $query->orderBy('created_at', 'desc')
                                     ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Watch colors fetched successfully', [
                'total' => $colorsPaginator->total(),
                'current_page' => $colorsPaginator->currentPage(),
                'per_page' => $colorsPaginator->perPage(),
                'last_page' => $colorsPaginator->lastPage(),
                'status_applied' => $statusParam
            ]);

            return response()->json($colorsPaginator);

        } catch (\Exception $e) {
            Log::error('Error fetching watch colors', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Failed to fetch watch colors', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'color_name' => 'required|string|max:255|unique:watch_colors,color_name',
            'status' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
             $color = Color::create([
                'color_name' => $request->color_name,
                'status' => $request->input('status', 1)
            ]);
            Log::info('Color stored successfully', ['id' => $color->id]);
            return response()->json(['message' => 'Color created successfully', 'data' => $color], 201);
        } catch (\Exception $e) {
             Log::error('Error storing color', ['error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to store color', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $color = Color::find($id);
        if (!$color) { return response()->json(['message' => 'Color not found'], 404); }
        return response()->json($color);
    }

    public function update(Request $request, $id)
    {
        $color = Color::find($id);
        if (!$color) { return response()->json(['message' => 'Color not found'], 404); }

        $validator = Validator::make($request->all(), [
            'color_name' => ['required','string','max:255', Rule::unique('watch_colors')->ignore($color->id)],
            'status' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) { return response()->json(['errors' => $validator->errors()], 422); }

        try {
            $updateData = ['color_name' => $request->color_name];
            if ($request->has('status')) { $updateData['status'] = $request->boolean('status'); }
            $color->update($updateData);
            Log::info('Color updated successfully', ['id' => $color->id]);
            return response()->json(['message' => 'Color updated successfully', 'data' => $color]);
        } catch (\Exception $e) {
            Log::error('Error updating color', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update color', 'error' => $e->getMessage()], 500);
        }
    }

    public function archive(Request $request)
    {
        Log::info('Archive request received', ['payload' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'data' => 'required|array',
            'data.ids' => 'required|array',
            'data.ids.*' => 'integer|exists:watch_colors,id',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Validation failed (archive)', ['errors' => $errors, 'received_payload' => $request->all()]);
            return response()->json(['errors' => $errors], 422);
        }

        $ids = $request->input('data.ids');
        Log::info('IDs to archive', ['ids' => $ids]);

        if (empty($ids)) {
            Log::warning('No IDs provided to archive (inside data key)');
            return response()->json(['message' => 'No IDs provided to archive.'], 200);
        }

        try {
            $updatedCount = Color::whereIn('id', $ids)
                                ->where('status', 1)
                                ->update(['status' => 0]);
            Log::info('Colors archive attempt finished', ['updated_count' => $updatedCount]);
            return response()->json(['message' => 'Colors archived successfully', 'updated_count' => $updatedCount], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving colors', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to archive colors', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
         Log::info('Restore request received', ['payload' => $request->all()]);

         $validator = Validator::make($request->all(), [
            'data' => 'required|array',
            'data.ids' => 'required|array',
            'data.ids.*' => 'integer|exists:watch_colors,id',
        ]);

         if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Validation failed (restore)', ['errors' => $errors, 'received_payload' => $request->all()]);
            return response()->json(['errors' => $errors], 422);
        }

        $ids = $request->input('data.ids');
        Log::info('IDs to restore', ['ids' => $ids]);

        if (empty($ids)) {
             Log::warning('No IDs provided to restore (inside data key)');
             return response()->json(['message' => 'No IDs provided to restore.'], 200);
        }

        try {
            $updatedCount = Color::whereIn('id', $ids)
                                 ->where('status', 0)
                                 ->update(['status' => 1]);
            Log::info('Colors restore attempt finished', ['updated_count' => $updatedCount]);
            return response()->json(['message' => 'Colors restored successfully', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error restoring colors', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to restore colors', 'error' => $e->getMessage()], 500);
        }
    }
}