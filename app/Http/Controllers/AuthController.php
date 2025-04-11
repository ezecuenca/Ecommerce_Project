<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:0',
            'gender' => 'nullable|string|in:male,female,other',
            'contact_no' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
             $result = DB::transaction(function () use ($request) {
                $customerRoleId = 2;

                $user = User::create([
                    'username' => $request->username,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'status' => 1,
                    'role_id' => $customerRoleId,
                ]);

                Profile::create([
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'middle_name' => $request->middle_name,
                    'suffix' => $request->suffix,
                    'age' => $request->age,
                    'gender' => $request->gender,
                    'contact_no' => $request->contact_no,
                    'user_id' => $user->id,
                ]);

                 $token = '';
                 if (method_exists($user, 'createToken')) {
                      $tokenResult = $user->createToken('auth_token');
                      $token = $tokenResult->plainTextToken ?? $tokenResult->accessToken;
                 } else {
                       Log::error('User model does not have createToken method. Passport/Sanctum trait missing?');
                       throw new Exception('Token creation failed.');
                 }

                return [
                    'user' => [ 'id' => $user->id, 'username' => $user->username, 'email' => $user->email, 'status' => $user->status, 'role_id' => $user->role_id, ],
                    'access_token' => $token,
                ];
            });

            return response()->json([ 'message' => 'Registration successful', 'user' => $result['user'], 'access_token' => $result['access_token'], ], 201);

        } catch (Exception $e) {
             Log::error('Registration Failed: ' . $e->getMessage(), ['exception' => $e]);
             return response()->json(['message' => 'Registration failed due to a server error.'], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if ($user->status == 0 || $user->status === false) {
            return response()->json(['message' => 'Your account has been archived. Please contact support.'], 403);
        }

         $token = '';
         if (method_exists($user, 'createToken')) {
              $tokenResult = $user->createToken('auth_token');
              $token = $tokenResult->plainTextToken ?? $tokenResult->accessToken;
         } else {
               Log::error('User model does not have createToken method. Passport/Sanctum trait missing?', ['user_id' => $user->id]);
               return response()->json(['message' => 'Login failed: Could not create token.'], 500);
         }

        return response()->json([
            'message' => 'Login successful',
            'user' => [ 'id' => $user->id, 'username' => $user->username, 'email' => $user->email, 'status' => $user->status, 'role_id' => $user->role_id, ],
            'access_token' => $token,
        ], 200);
    }

    public function logout(Request $request)
    {
        try {
             $user = $request->user();
             if (!$user) { return response()->json(['message' => 'Not authenticated'], 401); }

             if (method_exists($user, 'currentAccessToken') && is_callable([$user, 'currentAccessToken'])) {
                 $user->currentAccessToken()->delete();
             } elseif (method_exists($user, 'token') && is_callable([$user, 'token'])) {
                  $user->token()->revoke();
             } else { Log::warning('Could not determine token type for logout for user: ' . $user->id); }
             return response()->json(['message' => 'Logout successful'], 200);
        } catch (Exception $e) {
             $userId = $request->user() ? $request->user()->id : 'unknown';
             Log::error('Logout failed: ' . $e->getMessage(), ['user_id' => $userId, 'exception' => $e]);
             return response()->json(['message' => 'Logout successful (server error ignored)'], 200);
        }
    }

    public function me(Request $request)
    {
        try {
             $user = $request->user();
             if (!$user) { return response()->json(['message' => 'Not authenticated'], 401); }
             $user->load('profile');

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'status' => $user->status,
                    'role_id' => $user->role_id,
                    'profile' => $user->profile,
                ],
            ], 200);
        } catch (Exception $e) {
             $userId = $request->user() ? $request->user()->id : 'unknown';
             Log::error('Failed to fetch user details (/me): ' . $e->getMessage(), ['user_id' => $userId, 'exception' => $e]);
             return response()->json(['message' => 'Failed to retrieve user details.'], 500);
        }
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();
        if (!$user) {
             return response()->json(['message' => 'Not authenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'old_password' => ['required', 'string', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail('The provided current password does not match our records.');
                 }
             }],
             'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        if ($validator->fails()) {
             Log::warning('Password update validation failed', ['user_id' => $user->id, 'errors' => $validator->errors()->toArray()]);
             return response()->json(['message' => 'Password update validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $user->password = Hash::make($request->input('password'));
            $user->save();

            Log::info('Password updated successfully', ['user_id' => $user->id]);
            return response()->json(['message' => 'Password updated successfully.'], 200);

        } catch (\Exception $e) {
            Log::error('Error updating password', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update password due to a server error.'], 500);
        }
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        if (!$user) {
             return response()->json(['message' => 'Not authenticated'], 401);
        }

        DB::beginTransaction();

        try {
            $userId = $user->id;

             if (method_exists($user, 'tokens') && is_callable([$user, 'tokens'])) {
                  $user->tokens()->delete();
                  Log::info('Revoked all tokens for user during account deletion.', ['user_id' => $userId]);
             }

             $user->delete();

            DB::commit();

            Log::info('User account deleted successfully', ['user_id' => $userId]);
            return response()->json(null, 204);

        } catch (\Exception $e) {
             DB::rollback();
             Log::error('Error deleting user account', ['user_id' => $user->id, 'error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to delete account due to a server error.'], 500);
        }
    }

}