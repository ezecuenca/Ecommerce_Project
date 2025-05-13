<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str; // Can remove if not used elsewhere after this change
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;
use Illuminate\Validation\Rules\Password as PasswordValidationRules;

class PasswordResetController extends Controller
{
    // ... (your existing initiateReset and performSimplifiedReset methods if you keep them) ...

    public function directResetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'password' => ['required', 'string', 'confirmed', PasswordValidationRules::defaults()],
        ]);

        if ($validator->fails()) {
            Log::warning('Direct password reset validation failed.', ['email' => $request->input('email'), 'errors' => $validator->errors()]);
            return response()->json(['message' => 'Validation failed. Please check your input.', 'errors' => $validator->errors()], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                Log::warning('Direct password reset: User not found for email post-validation.', ['email' => $request->email]);
                return response()->json(['message' => 'Email address not found.'], 422);
            }
            
            if ($user->status == 0) {
                Log::info('Attempt to directly reset password for inactive user.', ['email' => $request->email, 'user_id' => $user->id]);
                return response()->json(['message' => 'This account is currently inactive. Please contact support.'], 403);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            Log::info('Password reset successfully via direct method.', ['email' => $request->email, 'user_id' => $user->id]);
            
            // event(new \Illuminate\Auth\Events\PasswordReset($user)); // Still optional

            return response()->json(['message' => 'Your password has been reset successfully!']);

        } catch (\Exception $e) {
            Log::error('Error during direct password reset: ' . $e->getMessage(), [
                'email' => $request->email, 
                'exception_class' => get_class($e),
                'exception_trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to reset password due to a server error.'], 500);
        }
    }
}