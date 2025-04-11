<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
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
         return response()->json(['message' => 'User creation not implemented.'], 501);
     }

     public function show(User $user)
     {
         return response()->json(['message' => 'Show user details not implemented.'], 501);
     }

     public function update(Request $request, User $user)
     {
         Log::info('Received user update request (username only)', ['user_id' => $user->id, 'data' => $request->all()]);
         $rules = [
             'username' => [
                 'required','string','max:255',
                  Rule::unique('users')->ignore($user->id),
              ],
         ];
         try {
             $validated = $request->validate($rules);
             Log::info('Username validation passed for user update', ['user_id' => $user->id, 'validated' => $validated]);
             $updateData = [ 'username' => $validated['username'], ];
             $user->update($updateData);
             Log::info('User username updated successfully', ['user_id' => $user->id]);
             $user->load('role');
             $responseData = [
                  'id' => $user->id,
                  'username' => $user->username,
                  'email' => $user->email,
                  'status' => $user->status,
                  'role_id' => $user->role_id,
                  'role_name' => $user->role ? $user->role->name : 'N/A',
                  'created_at' => $user->created_at->toIso8601String(),
                  'updated_at' => $user->updated_at->toIso8601String(),
             ];
             return response()->json([ 'message' => 'Username updated successfully.', 'user' => $responseData ]);
         } catch (ValidationException $e) {
              Log::error('Validation failed during username update', ['user_id' => $user->id, 'errors' => $e->errors()]);
              return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
         } catch (\Exception $e) {
              Log::error('Error updating username', [ 'user_id' => $user->id, 'error' => $e->getMessage(), 'request_data' => $request->all(), ]);
              return response()->json(['message' => 'Failed to update username', 'error' => $e->getMessage()], 500);
         }
     }

     public function archive(Request $request)
     {
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