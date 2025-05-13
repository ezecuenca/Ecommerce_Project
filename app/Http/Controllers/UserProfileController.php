<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\Profile;
use App\Models\Address;

class UserProfileController extends Controller
{
    public function show(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);
            $user->load(['profile.addresses']);
            return response()->json($user); // Returns the user object directly
        } catch (\Exception $e) {
            Log::error('Error fetching user profile in show', ['user_id' => optional($request->user())->id ?? 'unknown', 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to retrieve profile information.'], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

            $profile = $user->profile()->firstOrCreate(['user_id' => $user->id]);

            $validatedData = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'suffix' => 'nullable|string|max:50',
                'gender' => 'nullable|string|in:Male,Female,Others,male,female,other',
                'contact_no' => 'nullable|string|max:50',
                'birthday' => 'nullable|date_format:Y-m-d',
                'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                // Address fields - only validated if present
                'street' => 'sometimes|string|max:255|required_with:city,region,postal_code', // If street is sent, others become more important
                'city' => 'sometimes|string|max:255|required_with:street',
                'region' => 'sometimes|string|max:255|required_with:street',
                'postal_code' => 'sometimes|string|max:20|required_with:street',
                'country' => 'sometimes|string|max:255|required_with:street',
            ]);

            // Update Profile Model
            $profileFieldsToUpdate = ['first_name', 'middle_name', 'last_name', 'suffix', 'gender', 'contact_no', 'birthday'];
            $profileDataForModel = [];
            foreach($profileFieldsToUpdate as $field) {
                if (array_key_exists($field, $validatedData)) {
                    $profileDataForModel[$field] = $validatedData[$field];
                }
            }
            if (!empty($profileDataForModel)) {
                $profile->update($profileDataForModel);
            }

            // Update User Email
            if (isset($validatedData['email']) && $validatedData['email'] !== $user->email) {
                $user->email = $validatedData['email'];
                $user->save();
            }

            // Handle Address (typically from Admin form)
            if (isset($validatedData['street']) && !empty($validatedData['street'])) {
                $addressData = [
                    'street'       => $validatedData['street'],
                    'city'         => $validatedData['city'] ?? null,
                    'region'       => $validatedData['region'] ?? null,
                    'postal_code'  => $validatedData['postal_code'] ?? null,
                    'country'      => $validatedData['country'] ?? 'Philippines',
                    'contact_no'   => $validatedData['contact_no'] ?? $profile->contact_no, // Use profile's contact if not overridden
                    'is_default'   => 1,
                ];
                $profile->addresses()->update(['is_default' => 0]); // Unset other defaults
                $address = $profile->addresses()->first(); // Try to find an existing one to update
                if ($address) {
                    $address->update($addressData);
                } else {
                    $profile->addresses()->create($addressData);
                }
            }

            $user->load(['profile.addresses']);
            return response()->json($user);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation Failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating user profile', ['user_id' => optional($request->user())->id ?? 'unknown', 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update profile information.'], 500);
        }
    }
}