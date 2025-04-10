<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->query(), [
            'product_id' => 'sometimes|integer|exists:products,id',
            'status' => 'sometimes|in:active,archived',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid request parameters.', 'errors' => $validator->errors()], 400);
        }

        try {
            $query = Review::query();

            // Eager load required columns from related models
            $query->with([
                'product:id,product_name',
                'profile:id,first_name,last_name' // Load id, first_name, last_name
            ]);

            if ($request->filled('product_id')) {
                $query->where('product_id', $request->query('product_id'));
            }

            if ($request->input('status') === 'archived') {
                $query->where('status', 0);
            } else {
                $query->where('status', 1);
            }

            $reviews = $query->orderBy('created_at', 'desc')->get();

            // Map and format the response
            $formattedReviews = $reviews->map(function($review) {
                 $profileData = null;
                 if ($review->profile) {
                     $fullName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? ''));
                     $profileData = [
                         'id' => $review->profile->id,
                         'name' => $fullName ?: null // Combine first and last name, fallback to null if empty
                     ];
                 }

                 return [
                     'id' => $review->id,
                     'rating' => $review->rating,
                     'review_text' => $review->review_text,
                     'created_at' => $review->created_at,
                     'updated_at' => $review->updated_at,
                     'profile_id' => $review->profile_id,
                     'product_id' => $review->product_id,
                     'status' => $review->status,
                     'product' => $review->product ? [
                         'id' => $review->product->id,
                         'product_name' => $review->product->product_name ?? null
                     ] : null,
                     'profile' => $profileData // Use the formatted profile data
                 ];
            });

             return response()->json($formattedReviews);

        } catch (\Exception $e) {
            Log::error('Error fetching reviews: '.$e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to retrieve reviews.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'profile_id' => 'required|integer|exists:profiles,id',
            'rating' => 'required|numeric|min:0.5|max:5',
            'review_text' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $currentUserId = 1;
            if ((int)$request->input('profile_id') !== $currentUserId) {
               // Placeholder Auth Check
            }

             $validatedData = $validator->validated();
             $validatedData['status'] = 1;

            $review = Review::create($validatedData);
            // Load relationships including the specific profile columns needed for the response
            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);

            // Format the single review response similarly
            $profileData = null;
             if ($review->profile) {
                 $fullName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? ''));
                 $profileData = [
                     'id' => $review->profile->id,
                     'name' => $fullName ?: null
                 ];
             }

             $formattedReview = [
                 'id' => $review->id, 'rating' => $review->rating, 'review_text' => $review->review_text,
                 'created_at' => $review->created_at, 'updated_at' => $review->updated_at,
                 'profile_id' => $review->profile_id, 'product_id' => $review->product_id, 'status' => $review->status,
                 'product' => $review->product ? ['id' => $review->product->id, 'product_name' => $review->product->product_name ?? null] : null,
                 'profile' => $profileData
             ];

            return response()->json(['message' => 'Review submitted successfully!', 'review' => $formattedReview], 201);
        } catch (\Exception $e) {
            Log::error('Error creating review: '.$e->getMessage());
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to submit review.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }

    public function update(Request $request, Review $review)
    {
        $currentUserId = 1;
        if ($review->profile_id !== $currentUserId) {
           // Placeholder Auth Check
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|numeric|min:0.5|max:5',
            'review_text' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $review->update($validator->validated());
            // Load necessary relationships after update
            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);

             $profileData = null;
             if ($review->profile) {
                 $fullName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? ''));
                 $profileData = [
                     'id' => $review->profile->id,
                     'name' => $fullName ?: null
                 ];
             }

             $formattedReview = [
                 'id' => $review->id, 'rating' => $review->rating, 'review_text' => $review->review_text,
                 'created_at' => $review->created_at, 'updated_at' => $review->updated_at,
                 'profile_id' => $review->profile_id, 'product_id' => $review->product_id, 'status' => $review->status,
                 'product' => $review->product ? ['id' => $review->product->id, 'product_name' => $review->product->product_name ?? null] : null,
                 'profile' => $profileData
             ];

            return response()->json(['message' => 'Review updated successfully!', 'review' => $formattedReview]);
        } catch (\Exception $e) {
            Log::error('Error updating review: '.$e->getMessage());
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to update review.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }

     public function archive(Request $request)
     {
         $validator = Validator::make($request->all(), [
             'ids' => 'required|array',
             'ids.*' => 'integer|exists:reviews,id',
         ]);

         if ($validator->fails()) {
             return response()->json(['message' => 'Invalid IDs provided for archiving.', 'errors' => $validator->errors()], 400);
         }

         try {
             $idsToArchive = $request->input('ids');
             $updatedCount = Review::whereIn('id', $idsToArchive)->update(['status' => 0]);
             return response()->json(['message' => $updatedCount . ' review(s) archived successfully.']);
         } catch (\Exception $e) {
             Log::error('Error archiving reviews: ' . $e->getMessage());
             $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to archive reviews.';
             return response()->json(['message' => $errorMessage], 500);
         }
     }

     public function restore(Request $request)
     {
         $validator = Validator::make($request->all(), [
             'ids' => 'required|array',
             'ids.*' => 'integer|exists:reviews,id',
         ]);

         if ($validator->fails()) {
             return response()->json(['message' => 'Invalid IDs provided for restoring.', 'errors' => $validator->errors()], 400);
         }
         try {
             $idsToRestore = $request->input('ids');
             $updatedCount = Review::whereIn('id', $idsToRestore)->update(['status' => 1]);
             return response()->json(['message' => $updatedCount . ' review(s) restored successfully.']);
         } catch (\Exception $e) {
             Log::error('Error restoring reviews: ' . $e->getMessage());
             $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to restore reviews.';
             return response()->json(['message' => $errorMessage], 500);
         }
     }


    public function destroy(Review $review)
    {
        $currentUserId = 1;
        if ($review->profile_id !== $currentUserId) {
           // Placeholder Auth Check
        }

        try {
            $review->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting review: ' . $e->getMessage());
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to delete review.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }
}