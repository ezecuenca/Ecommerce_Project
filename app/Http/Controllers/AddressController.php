<?php

namespace App\Http\Controllers;

use App\Models\Address; // Assuming model name is Address
use App\Models\Profile; // Needed to scope addresses to user's profile
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // For transaction if setting default
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule; // If needed

class AddressController extends Controller
{
    // NOTE: We don't need index() or show() here as addresses are fetched via UserProfileController

    /**
     * Store a newly created address for the authenticated user.
     * ROUTE: POST /api/user/addresses
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || !$user->profile) {
                // User must have a profile to add an address
                return response()->json(['message' => 'User profile not found.'], 404);
            }
            $profile = $user->profile;

            // Validation rules for address fields
            $validatedData = $request->validate([
                'street' => 'required|string|max:255',
                'country' => 'required|string|max:100',
                'postal_code' => 'required|string|max:20',
                'city' => 'required|string|max:100',
                'region' => 'required|string|max:100',
                'contact_no' => 'required|string|max:50', // Address specific contact
                'is_default' => 'required|boolean',
                // Add validation for 'district' if you add it to the table/model
            ]);

            // Handle the 'is_default' flag logic within a transaction
            $newAddress = DB::transaction(function () use ($profile, $validatedData) {
                // If the new address is set as default, unset all others for this profile first
                if ($validatedData['is_default']) {
                    $profile->addresses()->update(['is_default' => false]);
                }

                // Create the new address associated with the profile
                $address = $profile->addresses()->create($validatedData);

                // If NO addresses were default before this, make the new one default
                // (This covers the case where is_default was sent as false, but it's the first address)
                if (!$profile->addresses()->where('is_default', true)->exists()) {
                    $address->is_default = true; // Make the newly created one default
                    $address->save();
                }

                return $address;
            });

            Log::info('Address created successfully', ['user_id' => $user->id, 'address_id' => $newAddress->id]);
            return response()->json($newAddress, 201); // Return created address

        } catch (\Illuminate\Validation\ValidationException $e) {
             Log::error('Address store validation failed', ['user_id' => $user->id ?? 'unknown', 'errors' => $e->errors()]);
             return response()->json(['message' => 'Validation Failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error storing address', [ 'user_id' => $user->id ?? 'unknown', 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to add address', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified address for the authenticated user.
     * ROUTE: PUT /api/user/addresses/{address} (using Route Model Binding)
     */
    public function update(Request $request, Address $address) // Route Model Binding
    {
        try {
            $user = $request->user();
             // Authorization: Check if the address belongs to the authenticated user's profile
            if (!$user || !$user->profile || $address->profile_id !== $user->profile->id) {
                return response()->json(['message' => 'Unauthorized to update this address.'], 403);
            }
            $profile = $user->profile;

            // Validation rules for address fields (use sometimes if fields are optional on update)
             $validatedData = $request->validate([
                'street' => 'sometimes|required|string|max:255',
                'country' => 'sometimes|required|string|max:100',
                'postal_code' => 'sometimes|required|string|max:20',
                'city' => 'sometimes|required|string|max:100',
                'region' => 'sometimes|required|string|max:100',
                'contact_no' => 'sometimes|required|string|max:50',
                'is_default' => 'sometimes|required|boolean',
            ]);

            // Handle 'is_default' flag logic within a transaction
             DB::transaction(function () use ($profile, $address, $validatedData) {
                 // Check if 'is_default' key exists and is true in the validated data
                 $setIsDefault = isset($validatedData['is_default']) && $validatedData['is_default'];

                 if ($setIsDefault) {
                     // Unset default flag on other addresses for this profile
                     $profile->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
                      // The validated data already contains is_default = true
                 }

                 // Update the address with validated data
                 $address->update($validatedData);

                 // Ensure at least one address remains default if unsetting default wasn't requested
                 if (!$setIsDefault && !$profile->addresses()->where('is_default', true)->exists() && $profile->addresses()->count() > 0) {
                     // If no address is default after update (and it wasn't intentional), make this one default
                     $address->is_default = true;
                     $address->save();
                 }

             });


            Log::info('Address updated successfully', ['user_id' => $user->id, 'address_id' => $address->id]);
            return response()->json($address->fresh()); // Return updated address

        } catch (\Illuminate\Validation\ValidationException $e) {
             Log::error('Address update validation failed', ['user_id' => $user->id ?? 'unknown', 'address_id' => $address->id, 'errors' => $e->errors()]);
             return response()->json(['message' => 'Validation Failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating address', [ 'user_id' => $user->id ?? 'unknown', 'address_id' => $address->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update address', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified address for the authenticated user.
     * ROUTE: DELETE /api/user/addresses/{address} (using Route Model Binding)
     */
    public function destroy(Request $request, Address $address) // Route Model Binding
    {
        try {
            $user = $request->user();
            // Authorization: Check if the address belongs to the authenticated user's profile
            if (!$user || !$user->profile || $address->profile_id !== $user->profile->id) {
                return response()->json(['message' => 'Unauthorized to delete this address.'], 403);
            }
            $profile = $user->profile;

            // Logic to handle default address deletion
             DB::transaction(function () use ($profile, $address) {
                 $isDefault = $address->is_default;
                 $address->delete();

                 // If the deleted address was default and other addresses exist, set the first remaining one as default
                 if ($isDefault && $profile->addresses()->count() > 0) {
                    $newDefault = $profile->addresses()->first();
                    if($newDefault) {
                        $newDefault->is_default = true;
                        $newDefault->save();
                    }
                 }
             });

            Log::info('Address deleted successfully', ['user_id' => $user->id, 'address_id' => $address->id]);
            return response()->json(null, 204); // No Content on successful deletion

        } catch (\Exception $e) {
            Log::error('Error deleting address', [ 'user_id' => $user->id ?? 'unknown', 'address_id' => $address->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to delete address', 'error' => $e->getMessage()], 500);
        }
    }

     /**
     * Set the specified address as the default for the authenticated user.
     * ROUTE: PUT /api/user/addresses/{address}/set-default (using Route Model Binding)
     */
    public function setDefault(Request $request, Address $address)
    {
        try {
            $user = $request->user();
             // Authorization: Check if the address belongs to the authenticated user's profile
            if (!$user || !$user->profile || $address->profile_id !== $user->profile->id) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
            $profile = $user->profile;

            // Set default within a transaction
             DB::transaction(function () use ($profile, $address) {
                 // Unset other defaults
                 $profile->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
                 // Set current as default
                 $address->is_default = true;
                 $address->save();
             });

             Log::info('Address set as default', ['user_id' => $user->id, 'address_id' => $address->id]);
             return response()->json(['message' => 'Address set as default successfully.', 'data' => $address->fresh()]);

        } catch (\Exception $e) {
             Log::error('Error setting default address', [ 'user_id' => $user->id ?? 'unknown', 'address_id' => $address->id, 'error' => $e->getMessage()]);
             return response()->json(['message' => 'Failed to set default address', 'error' => $e->getMessage()], 500);
        }
    }
}