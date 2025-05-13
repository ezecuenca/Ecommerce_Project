<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception; // Keep for general exceptions
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password as PasswordValidationRules; // Renamed for clarity
use Illuminate\Support\Facades\Password as PasswordBroker; // For Password Facade/Broker
use Illuminate\Auth\Events\PasswordReset; // For the event after successful reset
use Illuminate\Support\Str; // For Str::random if needed for remember_token

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // ... your existing register method (unchanged) ...
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
        // ... your existing login method (unchanged) ...
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
        // ... your existing logout method (unchanged) ...
        try {
             $user = $request->user();
             if (!$user) { return response()->json(['message' => 'Not authenticated'], 401); }

             if (method_exists($user, 'currentAccessToken') && is_callable([$user, 'currentAccessToken'])) { // For Sanctum
                 $user->currentAccessToken()->delete();
             } elseif (method_exists($user, 'token') && is_callable([$user, 'token'])) { // For older Passport
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
        // ... your existing me method (unchanged) ...
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

    /**
     * Handle a forgot password request.
     * Sends a password reset link to the user's email.
     */
    public function sendResetLinkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email', // Ensure email exists
        ]);

        if ($validator->fails()) {
            // Even if email doesn't exist, we might return a generic message
            // to prevent email enumeration, but for API, returning validation error is also fine.
            Log::warning('Forgot password validation failed.', ['email' => $request->email, 'errors' => $validator->errors()]);
            return response()->json(['message' => 'Please provide a valid email address registered with us.', 'errors' => $validator->errors()], 422);
        }

        try {
            $status = PasswordBroker::sendResetLink($request->only('email'));

            if ($status === PasswordBroker::RESET_LINK_SENT) {
                Log::info('Password reset link sent successfully.', ['email' => $request->email]);
                return response()->json(['message' => trans($status)], 200); // e.g., "We have emailed your password reset link!"
            }

            // This typically means the user was not found, though validator should catch it.
            // Or it could be due to throttling if user requests too many times.
            Log::warning('Failed to send password reset link (unexpected status).', ['email' => $request->email, 'status_from_broker' => $status]);
            return response()->json(['message' => trans($status)], 400);

        } catch (Exception $e) {
            Log::error('Error sending password reset link: ' . $e->getMessage(), ['email' => $request->email, 'exception' => $e]);
            return response()->json(['message' => 'Failed to send password reset link due to a server error.'], 500);
        }
    }

    /**
     * Handle the actual password reset.
     * Receives token, email, new password, and password confirmation.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => ['required', 'string', 'confirmed', PasswordValidationRules::defaults()], // Use imported Password rules
        ]);

        if ($validator->fails()) {
            Log::warning('Reset password validation failed.', ['email' => $request->email, 'errors' => $validator->errors()]);
            return response()->json(['message' => 'Validation failed. Please check your input.', 'errors' => $validator->errors()], 422);
        }

        try {
            // Attempt to reset the user's password using Laravel's built-in broker
            $status = PasswordBroker::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([ // Use forceFill to bypass mass assignment protection if needed for password
                        'password' => Hash::make($password)
                    ])->setRememberToken(Str::random(60)); // Optionally reset the remember token

                    $user->save();

                    event(new PasswordReset($user)); // Fire the PasswordReset event
                }
            );

            if ($status === PasswordBroker::PASSWORD_RESET) {
                Log::info('Password reset successfully.', ['email' => $request->email]);
                // Optionally: You might want to log the user in and issue a new token here,
                // or just tell them to log in with their new password.
                return response()->json(['message' => trans($status)], 200); // e.g., "Your password has been reset!"
            }

            // If status is not PASSWORD_RESET, it's usually an invalid token or user
            Log::warning('Password reset failed (broker status).', ['email' => $request->email, 'status_from_broker' => $status]);
            return response()->json(['message' => trans($status)], 400); // e.g., "This password reset token is invalid." or "User not found."

        } catch (Exception $e) {
            Log::error('Error during password reset process: ' . $e->getMessage(), ['email' => $request->email, 'exception' => $e]);
            return response()->json(['message' => 'Failed to reset password due to a server error.'], 500);
        }
    }

    public function updatePassword(Request $request)
    {
        // ... your existing updatePassword method (unchanged) ...
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
             'password' => ['required', 'string', 'confirmed', PasswordValidationRules::defaults()],
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
        // ... your existing deleteAccount method (unchanged) ...
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