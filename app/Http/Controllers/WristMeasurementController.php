<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WristMeasurement;
use Illuminate\Support\Facades\Validator;

class WristMeasurementController extends Controller
{
    public function index()
    {
        return WristMeasurement::all();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'measurement' => 'required|string|max:255|unique:wrist_measurements',
            'status' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $wristMeasurement = WristMeasurement::create([
            'measurement' => $request->measurement,
            'created_at' => now(),
            'status' => $request->input('status', 1)
        ]);

        return response()->json(['message' => 'Wrist measurement created successfully', 'data' => $wristMeasurement], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'measurement' => 'required|string|max:255|unique:wrist_measurements,measurement,' . $id,
            'status' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $wristMeasurement = WristMeasurement::find($id);
        if (!$wristMeasurement) {
            return response()->json(['message' => 'Wrist measurement not found'], 404);
        }

        $wristMeasurement->measurement = $request->measurement;
        $wristMeasurement->updated_at = now();
        $wristMeasurement->status = $request->input('status', $wristMeasurement->status);
        $wristMeasurement->save();

        return response()->json(['message' => 'Wrist measurement updated successfully', 'data' => $wristMeasurement]);
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

            WristMeasurement::whereIn('id', $ids)->update(['status' => 0]);

            return response()->json(['message' => 'Wrist measurements archived successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to archive wrist measurements', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:wrist_measurements,id',
        ]);

        $ids = $request->input('ids');
        WristMeasurement::whereIn('id', $ids)->update(['status' => 1]);

        return response()->json(['message' => 'Wrist measurements restored successfully']);
    }
}