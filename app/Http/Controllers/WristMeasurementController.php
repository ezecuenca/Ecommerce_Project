<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WristMeasurement;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class WristMeasurementController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Fetching wrist measurements request', ['query_params' => $request->query()]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $statusParam = $request->query('status', 'active');
            $searchQuery = $request->query('search');

            $query = WristMeasurement::query();

            if ($statusParam === 'active') {
                $query->where('status', 1);
            } elseif ($statusParam === 'archived') {
                $query->where('status', 0);
            } else {
                $query->where('status', 1);
            }

            if ($searchQuery) {
                $query->where('measurement', 'LIKE', "%{$searchQuery}%");
            }

            $measurementsPaginator = $query->orderBy('created_at', 'desc')
                                           ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Wrist measurements fetched successfully', [
                'total' => $measurementsPaginator->total(),
                'current_page' => $measurementsPaginator->currentPage(),
                'per_page' => $measurementsPaginator->perPage(),
                'last_page' => $measurementsPaginator->lastPage(),
                'status_applied' => $statusParam
            ]);

            return response()->json($measurementsPaginator);

        } catch (\Exception $e) {
            Log::error('Error fetching wrist measurements', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to fetch wrist measurements', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'measurement' => 'required|string|max:255|unique:wrist_measurements,measurement',
            'status' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $wristMeasurement = WristMeasurement::create([
                'measurement' => $request->measurement,
                'status' => $request->input('status', 1)
            ]);
            Log::info('Wrist measurement created', ['id' => $wristMeasurement->id]);
            return response()->json(['message' => 'Wrist measurement created successfully', 'data' => $wristMeasurement], 201);
        } catch (\Exception $e) {
             Log::error('Error storing wrist measurement', ['error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to store wrist measurement', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $measurement = WristMeasurement::find($id);
        if (!$measurement) { return response()->json(['message' => 'Wrist measurement not found'], 404); }
        return response()->json($measurement);
    }

    public function update(Request $request, $id)
    {
        $wristMeasurement = WristMeasurement::find($id);
        if (!$wristMeasurement) {
            return response()->json(['message' => 'Wrist measurement not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'measurement' => [
                'required',
                'string',
                'max:255',
                Rule::unique('wrist_measurements')->ignore($wristMeasurement->id),
             ],
            'status' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $updateData = ['measurement' => $request->measurement];
            if ($request->has('status')) { $updateData['status'] = $request->boolean('status'); }
            $wristMeasurement->update($updateData);

            Log::info('Wrist measurement updated', ['id' => $wristMeasurement->id]);
            return response()->json(['message' => 'Wrist measurement updated successfully', 'data' => $wristMeasurement]);
        } catch (\Exception $e) {
            Log::error('Error updating wrist measurement', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update wrist measurement', 'error' => $e->getMessage()], 500);
        }
    }

    public function archive(Request $request)
    {
        $validator = Validator::make($request->input(), [
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:wrist_measurements,id',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Validation failed (archive measurements)', ['errors' => $errors]);
            return response()->json(['errors' => $errors], 422);
        }

        $ids = $request->input('ids');
        Log::info('IDs to archive', ['ids' => $ids]);

        if (empty($ids)) {
            return response()->json(['message' => 'No IDs provided to archive.'], 200);
        }

        try {
            $updatedCount = WristMeasurement::whereIn('id', $ids)
                                            ->where('status', 1)
                                            ->update(['status' => 0]);
            Log::info('Measurements archive attempt finished', ['updated_count' => $updatedCount]);
            return response()->json(['message' => 'Wrist measurements archived successfully', 'updated_count' => $updatedCount], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving measurements', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to archive wrist measurements', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        $validator = Validator::make($request->input(), [
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:wrist_measurements,id',
        ]);

         if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Validation failed (restore measurements)', ['errors' => $errors]);
            return response()->json(['errors' => $errors], 422);
        }

        $ids = $request->input('ids');
        Log::info('IDs to restore', ['ids' => $ids]);

        if (empty($ids)) {
             return response()->json(['message' => 'No IDs provided to restore.'], 200);
        }

        try {
            $updatedCount = WristMeasurement::whereIn('id', $ids)
                                             ->where('status', 0)
                                             ->update(['status' => 1]);
            Log::info('Measurements restore attempt finished', ['updated_count' => $updatedCount]);
            return response()->json(['message' => 'Wrist measurements restored successfully', 'updated_count' => $updatedCount]);
        } catch (\Exception $e) {
            Log::error('Error restoring measurements', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to restore wrist measurements', 'error' => $e->getMessage()], 500);
        }
    }
}