<?php

namespace App\Http\Controllers;

use App\Models\WristMeasurement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WristMeasurementController extends Controller
{
    // Fetch all wrist measurements
    public function index()
    {
        try {
            Log::info('Fetching wrist measurements...');
            $measurements = WristMeasurement::all();
            Log::info('Wrist measurements fetched successfully.', ['count' => $measurements->count()]);
            return response()->json($measurements, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching wrist measurements: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to fetch wrist measurements.'], 500);
        }
    }

    // Create a new wrist measurement
    public function store(Request $request)
    {
        try {
            $request->validate([
                'measurement' => 'required|string|unique:wrist_measurements,measurement',
            ]);

            $measurement = WristMeasurement::create([
                'measurement' => $request->measurement,
                'status' => 1, // Active by default
            ]);

            Log::info('Wrist measurement created successfully.', ['id' => $measurement->id]);
            return response()->json($measurement, 201);
        } catch (\Exception $e) {
            Log::error('Error creating wrist measurement: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to create wrist measurement.'], 500);
        }
    }

    // Update an existing wrist measurement
    public function update(Request $request, $id)
    {
        try {
            $measurement = WristMeasurement::findOrFail($id);

            $request->validate([
                'measurement' => 'required|string|unique:wrist_measurements,measurement,' . $id,
            ]);

            $measurement->update([
                'measurement' => $request->measurement,
            ]);

            Log::info('Wrist measurement updated successfully.', ['id' => $measurement->id]);
            return response()->json($measurement, 200);
        } catch (\Exception $e) {
            Log::error('Error updating wrist measurement: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to update wrist measurement.'], 500);
        }
    }

    // Archive (soft delete) wrist measurements
    public function archive(Request $request)
    {
        try {
            $request->validate([
                'data.ids' => 'required|array',
                'data.ids.*' => 'integer|exists:wrist_measurements,id',
            ]);

            $ids = $request->input('data.ids');
            WristMeasurement::whereIn('id', $ids)->update(['status' => 0]);

            Log::info('Wrist measurements archived successfully.', ['ids' => $ids]);
            return response()->json(['message' => 'Wrist measurements archived successfully.'], 200);
        } catch (\Exception $e) {
            Log::error('Error archiving wrist measurements: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to archive wrist measurements.'], 500);
        }
    }

    // Restore archived wrist measurements
    public function restore(Request $request)
    {
        try {
            $request->validate([
                'data.ids' => 'required|array',
                'data.ids.*' => 'integer|exists:wrist_measurements,id',
            ]);

            $ids = $request->input('data.ids');
            WristMeasurement::whereIn('id', $ids)->update(['status' => 1]);

            Log::info('Wrist measurements restored successfully.', ['ids' => $ids]);
            return response()->json(['message' => 'Wrist measurements restored successfully.'], 200);
        } catch (\Exception $e) {
            Log::error('Error restoring wrist measurements: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to restore wrist measurements.'], 500);
        }
    }
}