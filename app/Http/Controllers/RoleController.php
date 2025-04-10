<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Role::orderBy('role_name')->get()); // Return all, ordered
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'role_name' => 'required|string|max:255|unique:roles,role_name',
            'status' => [
                'sometimes',
                'required',
                'integer',
                Rule::in([0, 1]),
            ],
        ]);

        $status = $validatedData['status'] ?? 1; // Default to 1 (active)

        $role = Role::create([
            'role_name' => $validatedData['role_name'],
            'status' => $status,
        ]);

        return response()->json($role, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $role = Role::findOrFail($id);
        return response()->json($role);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validatedData = $request->validate([
            'role_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'role_name')->ignore($role->id),
            ],
            'status' => [
                'sometimes',
                'required',
                'integer',
                Rule::in([0, 1]),
            ],
        ]);

        $role->update($validatedData);

        return response()->json($role);
    }

    /**
     * Remove the specified resource from storage (Hard Delete).
     */
    public function destroy($id)
    {
         $role = Role::findOrFail($id);
         $role->delete(); // Performs hard delete unless SoftDeletes trait is used on the model

         return response()->json(null, 204); // No Content success response
    }
}