<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('Fetching roles request', ['query_params' => $request->query()]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $statusParam = $request->query('status', 'active');
            $searchQuery = $request->query('search');

            $query = Role::query();

            if ($statusParam === 'active') {
                Log::info('Applying active role filter (status = 1)');
                $query->where('status', 1);
            } elseif ($statusParam === 'archived') {
                Log::info('Applying archived role filter (status = 0)');
                $query->where('status', 0);
            } else {
                Log::warning('Invalid status param received for roles, defaulting to active.', ['status' => $statusParam]);
                $query->where('status', 1);
            }

            if ($searchQuery) {
                Log::info('Applying role search filter', ['search' => $searchQuery]);
                $query->where('role_name', 'LIKE', "%{$searchQuery}%");
            }

            $rolesPaginator = $query->orderBy('role_name')
                                      ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Roles fetched successfully', [
                'total' => $rolesPaginator->total(),
                'current_page' => $rolesPaginator->currentPage(),
                'per_page' => $rolesPaginator->perPage(),
                'last_page' => $rolesPaginator->lastPage(),
                'status_applied' => $statusParam
            ]);

            return response()->json($rolesPaginator);

        } catch (\Exception $e) {
            Log::error('Error fetching roles', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to fetch roles', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'role_name' => 'required|string|max:255|unique:roles,role_name',
            'status' => 'sometimes|boolean',
        ]);

        $status = $request->boolean('status', true);

        try {
            $role = Role::create([
                'role_name' => $validatedData['role_name'],
                'status' => $status,
            ]);
            Log::info('Role created', ['id' => $role->id]);
            return response()->json($role, 201);
        } catch (\Exception $e) {
             Log::error('Error storing role', ['error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to store role', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $role = Role::findOrFail($id);
        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        if (in_array($id, [1, 2])) {
             return response()->json(['message' => 'Default roles cannot be updated.'], 403);
        }

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
                'boolean',
            ],
        ]);

        try {
             $role->update($validatedData);
             Log::info('Role updated', ['id' => $role->id]);
             return response()->json($role);
        } catch (\Exception $e) {
             Log::error('Error updating role', ['id' => $id, 'error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to update role', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
         if (in_array($id, [1, 2])) {
             return response()->json(['message' => 'Default roles cannot be deleted.'], 403);
         }

         $role = Role::findOrFail($id);
         try {
             $role->delete();
             Log::info('Role deleted', ['id' => $id]);
             return response()->json(null, 204);
         } catch (\Exception $e) {
             Log::error('Error deleting role', ['id' => $id, 'error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to delete role', 'error' => $e->getMessage()], 500);
         }
    }

     public function archive(Request $request)
     {
         Log::info('Archive roles request received', ['payload' => $request->all()]);

         $validator = Validator::make($request->input(), [
            'ids' => 'required|array',
            'ids.*' => ['integer','exists:roles,id', function ($attribute, $value, $fail) {
                            if (in_array($value, [1, 2])) {
                                $fail('Default roles (ID '.$value.') cannot be archived.');
                            }
                        }],
        ]);

         if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Validation failed (archive roles)', ['errors' => $errors]);
            return response()->json(['errors' => $errors], 422);
        }

        $ids = $request->input('ids');
        $idsToArchive = array_diff($ids, [1, 2]);

        if (empty($idsToArchive)) {
             Log::warning('No valid (non-default) IDs provided to archive');
             return response()->json(['message' => 'No valid roles selected for archiving.'], 200);
         }

         Log::info('IDs to archive', ['ids' => $idsToArchive]);

         try {
             $updatedCount = Role::whereIn('id', $idsToArchive)
                                 ->where('status', 1)
                                 ->update(['status' => 0]);

             Log::info('Roles archive attempt finished', ['updated_count' => $updatedCount]);
             return response()->json(['message' => 'Roles archived successfully', 'updated_count' => $updatedCount], 200);

         } catch (\Exception $e) {
             Log::error('Error archiving roles', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
             return response()->json(['message' => 'Failed to archive roles', 'error' => $e->getMessage()], 500);
         }
     }

      public function restore(Request $request)
      {
          Log::info('Restore roles request received', ['payload' => $request->all()]);

          $validator = Validator::make($request->input(), [
             'ids' => 'required|array',
             'ids.*' => 'integer|exists:roles,id'
         ]);

          if ($validator->fails()) {
             $errors = $validator->errors()->toArray();
             Log::error('Validation failed (restore roles)', ['errors' => $errors]);
             return response()->json(['errors' => $errors], 422);
         }

         $ids = $request->input('ids');
         Log::info('IDs to restore', ['ids' => $ids]);

         if (empty($ids)) {
              Log::warning('No IDs provided to restore');
              return response()->json(['message' => 'No IDs provided to restore.'], 200);
         }

         try {
             $updatedCount = Role::whereIn('id', $ids)
                                  ->where('status', 0)
                                  ->update(['status' => 1]);

             Log::info('Roles restore attempt finished', ['updated_count' => $updatedCount]);
             return response()->json(['message' => 'Roles restored successfully', 'updated_count' => $updatedCount]);

         } catch (\Exception $e) {
             Log::error('Error restoring roles', ['error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to restore roles', 'error' => $e->getMessage()], 500);
         }
      }
}