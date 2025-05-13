<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role; // Assuming you have a Role model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // Not strictly used in this update, but good to have if needed
use Carbon\Carbon; // Not strictly used in this update
use Illuminate\Database\Eloquent\ModelNotFoundException; // Not strictly used in this update
use Illuminate\Support\Facades\Hash; // Keep for potential password updates in future
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password; // Not used in this specific update, but good if you expand
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // ... (your existing index method - unchanged) ...
        try {
            Log::info('Fetching users request', ['query_params' => $request->query()]);
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $statusParam = $request->query('status', 'active');
            $searchQuery = $request->input('search');
            $roleIdFilter = $request->query('role_id');

            $query = User::with('role');

            if ($statusParam === 'active') { $query->where('status', 1); }
            elseif ($statusParam === 'archived') { $query->where('status', 0); }
            else { Log::warning('Invalid status, defaulting to active', ['status' => $statusParam]); $query->where('status', 1); }

            if (!is_null($roleIdFilter) && $roleIdFilter !== '') {
                if (is_numeric($roleIdFilter)) {
                    Log::info('Applying role_id filter', ['role_id' => $roleIdFilter]);
                    $query->where('role_id', (int)$roleIdFilter);
                } else {
                    Log::warning('Invalid (non-numeric) role_id received, ignoring filter.', ['role_id' => $roleIdFilter]);
                }
            }

            if ($searchQuery) {
                Log::info('Applying search filter', ['search' => $searchQuery]);
                $query->where(function ($q) use ($searchQuery) {
                    $q->where('username', 'LIKE', "%{$searchQuery}%")
                      ->orWhere('email', 'LIKE', "%{$searchQuery}%");
                });
            }

            $usersPaginator = $query->orderBy('created_at', 'desc')
                                     ->paginate($perPage, ['*'], 'page', $page);

            Log::info('Users fetched successfully', [
                'total' => $usersPaginator->total(),
                'current_page' => $usersPaginator->currentPage(),
                'per_page' => $usersPaginator->perPage(),
                'last_page' => $usersPaginator->lastPage(),
                'applied_role_filter' => $roleIdFilter
            ]);

            return response()->json($usersPaginator);

        } catch (\Exception $e) {
            Log::error('Error fetching users', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to fetch users', 'error' => $e->getMessage()], 500);
        }
    }

     public function store(Request $request)
     {
         // ... (your existing store method - unchanged) ...
         return response()->json(['message' => 'User creation not implemented.'], 501);
     }

     public function show(User $user)
     {
         // ... (your existing show method - unchanged) ...
         return response()->json(['message' => 'Show user details not implemented.'], 501);
     }

    // VVVVVV MODIFIED update METHOD VVVVVV
     public function update(Request $request, User $user) // User $user comes from Route Model Binding
     {
        $loggedInUser = $request->user();

        Log::info('User update request received', [
            'user_to_update_id' => $user->id,
            'loggedIn_user_id' => $loggedInUser->id,
            'loggedIn_user_role_id' => $loggedInUser->role_id,
            'data' => $request->all()
        ]);

        // Define base validation rules
        $rules = [
            'username' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            // role_id is 'sometimes' because not every update request will include it
            'role_id' => ['sometimes', 'required', 'integer', Rule::exists('roles', 'id')],
        ];

        // Authorization: Only admins (role_id 1) can change roles
        if ($request->has('role_id') && $loggedInUser->role_id !== 1) {
            Log::warning("Unauthorized attempt to change role_id by non-admin.", [
                'loggedIn_user_id' => $loggedInUser->id,
                'target_user_id' => $user->id,
                'requested_role_id' => $request->input('role_id')
            ]);
            // Return a forbidden error if a non-admin tries to change a role
            return response()->json(['message' => 'You are not authorized to change user roles.'], 403);
        }

        try {
            $validatedData = $request->validate($rules);
            Log::info('User update validation passed', ['user_id' => $user->id, 'validated_data' => $validatedData]);

            $updateData = [];

            if (isset($validatedData['username'])) {
                $updateData['username'] = $validatedData['username'];
            }
            if (isset($validatedData['email'])) {
                $updateData['email'] = $validatedData['email'];
            }

            // Handle role_id update specifically by an admin
            if (isset($validatedData['role_id']) && $loggedInUser->role_id === 1) {
                // Business logic: Prevent demoting the last admin
                if ($user->role_id === 1 && (int)$validatedData['role_id'] !== 1) { // Current user is admin, new role is not admin
                    $adminCount = User::where('role_id', 1)->count();
                    if ($adminCount <= 1) {
                        Log::warning('Attempt to demote the last admin denied.', ['admin_user_id' => $user->id]);
                        return response()->json(['message' => 'Cannot remove the administrator role from the last admin.'], 422);
                    }
                }
                // Business logic: Prevent user from changing their own role to something else if they are the only admin
                if ($user->id === $loggedInUser->id && $user->role_id === 1 && (int)$validatedData['role_id'] !== 1) {
                    $adminCount = User::where('role_id', 1)->count();
                     if ($adminCount <= 1) {
                         Log::warning('Admin attempted to change their own role when they are the last admin.', ['admin_user_id' => $user->id]);
                         return response()->json(['message' => 'You cannot change your role as you are the last administrator.'], 422);
                     }
                }
                $updateData['role_id'] = $validatedData['role_id'];
            } elseif (isset($validatedData['role_id']) && $loggedInUser->role_id !== 1) {
                // This case should be caught by the authorization check above, but as a safeguard:
                Log::warning('Non-admin role_id was present in validatedData but should have been blocked.', ['loggedIn_user_id' => $loggedInUser->id]);
                // Do not include role_id in updateData if not an admin
            }


            if (empty($updateData)) {
                Log::info('No data provided for update.', ['user_id' => $user->id]);
                // Optionally return a message or the current user data if nothing was changed
                // For now, we proceed, and if update is empty, Eloquent won't do much.
            }

            $user->update($updateData);
            Log::info('User updated successfully in database', ['user_id' => $user->id, 'updated_fields' => array_keys($updateData)]);

            $user->load('role'); // Eager load the role for the response

            // Prepare consistent response format
            $responseData = [
                 'id' => $user->id,
                 'username' => $user->username,
                 'email' => $user->email,
                 'status' => $user->status, // Assuming status is not part of this update form
                 'role_id' => $user->role_id,
                 'roleName' => $user->role ? $user->role->name : ($user->role_id == 1 ? 'Admin' : ($user->role_id == 2 ? 'Customer' : 'N/A')), // Consistent role name
                 'created_at' => $user->created_at->toIso8601String(),
                 'updated_at' => $user->updated_at->toIso8601String(),
            ];

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => $responseData
            ]);

        } catch (ValidationException $e) {
             Log::error('Validation failed during user update', ['user_id' => $user->id, 'errors' => $e->errors()]);
             return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
             Log::error('Error updating user', [
                 'user_id' => $user->id,
                 'error' => $e->getMessage(),
                 'request_data' => $request->all(),
                 'trace' => $e->getTraceAsString()
             ]);
             return response()->json(['message' => 'Failed to update user information', 'error' => $e->getMessage()], 500);
        }
     }
    // ^^^^^^ MODIFIED update METHOD ^^^^^^

     public function archive(Request $request)
     {
        // ... (your existing archive method - unchanged) ...
          Log::info('Received user archive request', ['payload' => $request->all()]);
          $currentUserId = optional($request->user())->id;
          if (!$currentUserId) {
               Log::error('Attempted archive without authentication.');
               return response()->json(['message' => 'Authentication required.'], 401);
          }

          try {
               $validated = $request->validate([
                    'ids' => 'required|array',
                    'ids.*' => ['integer', 'exists:users,id', function ($attribute, $value, $fail) use ($currentUserId) {
                         if ($value == $currentUserId) {
                              $fail('You cannot archive your own account.');
                         }
                     }],
                ]);
               $userIds = $validated['ids'];
               $updatedCount = User::whereIn('id', $userIds)->where('status', 1)->update(['status' => 0]);
               Log::info('Users archived', ['ids' => $userIds, 'updated_count' => $updatedCount]);
               return response()->json(['message' => 'Users archived successfully.', 'updated_count' => $updatedCount]);
          } catch (ValidationException $e) {
               Log::error('Validation failed during user archive', ['errors' => $e->errors()]);
               return response()->json(['message' => 'Invalid input provided.', 'errors' => $e->errors()], 400);
          } catch (\Exception $e) {
               Log::error('Error archiving users', [ 'error' => $e->getMessage(), 'ids' => $request->input('ids') ]);
               return response()->json(['message' => 'Failed to archive users', 'error' => $e->getMessage()], 500);
          }
     }

     public function restore(Request $request)
     {
        // ... (your existing restore method - unchanged) ...
          Log::info('Received user restore request', ['payload' => $request->all()]);
          try {
               $validated = $request->validate([
                    'ids' => 'required|array',
                    'ids.*' => 'integer|exists:users,id'
               ]);
               $userIds = $validated['ids'];
               $updatedCount = User::whereIn('id', $userIds)->where('status', 0)->update(['status' => 1]);
               Log::info('Users restored', ['ids' => $userIds, 'updated_count' => $updatedCount]);
               return response()->json(['message' => 'Users restored successfully.', 'updated_count' => $updatedCount]);
          } catch (ValidationException $e) {
               Log::error('Validation failed during user restore', ['errors' => $e->errors()]);
               return response()->json(['message' => 'Invalid input provided.', 'errors' => $e->errors()], 400);
          } catch (\Exception $e) {
               Log::error('Error restoring users', [ 'error' => $e->getMessage(), 'ids' => $request->input('ids') ]);
               return response()->json(['message' => 'Failed to restore users', 'error' => $e->getMessage()], 500);
          }
     }
}