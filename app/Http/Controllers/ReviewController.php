<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    private function getAuthenticatedProfileId(Request $request): ?int
    {
        $user = $request->user();
        if (!$user) return null;
        return $user->profile->id ?? null;
    }

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
            $query->with([
                'product:id,product_name',
                'profile:id,first_name,last_name'
            ]);

            if ($request->filled('product_id')) {
                $query->where('product_id', $request->query('product_id'));
            }

            $query->where('status', $request->input('status') === 'archived' ? 0 : 1);

            $reviews = $query->orderBy('created_at', 'desc')->get();

            $formattedReviews = $reviews->map(function($review) {
                 $profileData = null;
                 if ($review->profile) {
                     $fullName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? ''));
                     $profileData = [
                         'id' => $review->profile->id,
                         'name' => $fullName ?: null
                     ];
                 }
                 return [
                     'id' => $review->id, 'rating' => $review->rating, 'review_text' => $review->review_text,
                     'created_at' => $review->created_at, 'updated_at' => $review->updated_at,
                     'profile_id' => $review->profile_id,
                     'product_id' => $review->product_id, 'status' => $review->status,
                     'product' => $review->product ? ['id' => $review->product->id, 'product_name' => $review->product->product_name ?? null] : null,
                     'profile' => $profileData
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
        $profileId = $this->getAuthenticatedProfileId($request);
        if (is_null($profileId)) {
            return response()->json(['message' => 'User not authenticated.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'rating' => 'required|numeric|min:0.5|max:5',
            'review_text' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
             Log::error('Review validation failed.', ['errors' => $validator->errors()->toArray(), 'profile_id' => $profileId]);
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
             $validatedData = $validator->validated();
             $validatedData['profile_id'] = $profileId;
             $validatedData['status'] = 1;

            Log::info("Attempting to create review", $validatedData);
            $review = Review::create($validatedData);

            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);

             $profileData = null;
             if ($review->profile) { $fullName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? '')); $profileData = ['id' => $review->profile->id, 'name' => $fullName ?: null ]; }
             $formattedReview = [ 'id' => $review->id, 'rating' => $review->rating, 'review_text' => $review->review_text, 'created_at' => $review->created_at, 'updated_at' => $review->updated_at, 'profile_id' => $review->profile_id, 'product_id' => $review->product_id, 'status' => $review->status, 'product' => $review->product ? ['id' => $review->product->id, 'product_name' => $review->product->product_name ?? null] : null, 'profile' => $profileData ];

             Log::info("Review created successfully", ['review_id' => $review->id, 'profile_id' => $profileId]);
            return response()->json(['message' => 'Review submitted successfully!', 'review' => $formattedReview], 201);

        } catch (\Exception $e) {
            Log::error('Error creating review: '.$e->getMessage(), ['profile_id' => $profileId, 'trace' => $e->getTraceAsString()]);
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to submit review.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }

    public function update(Request $request, Review $review)
    {
        $profileId = $this->getAuthenticatedProfileId($request);
        if (is_null($profileId)) {
            return response()->json(['message' => 'User not authenticated.'], 401);
        }

        if ($review->profile_id !== $profileId) {
            Log::warning("Authorization failed: User (Profile ID: {$profileId}) attempted to update review (ID: {$review->id}) owned by Profile ID: {$review->profile_id}");
            return response()->json(['message' => 'You are not authorized to update this review.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|numeric|min:0.5|max:5',
            'review_text' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            Log::error('Review update validation failed.', ['review_id' => $review->id, 'errors' => $validator->errors()->toArray(), 'profile_id' => $profileId]);
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $review->update($validator->validated());
            Log::info("Review updated successfully", ['review_id' => $review->id, 'profile_id' => $profileId]);

            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);

            $profileData = null;
             if ($review->profile) { $fullName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? '')); $profileData = ['id' => $review->profile->id, 'name' => $fullName ?: null ]; }
             $formattedReview = [ 'id' => $review->id, 'rating' => $review->rating, 'review_text' => $review->review_text, 'created_at' => $review->created_at, 'updated_at' => $review->updated_at, 'profile_id' => $review->profile_id, 'product_id' => $review->product_id, 'status' => $review->status, 'product' => $review->product ? ['id' => $review->product->id, 'product_name' => $review->product->product_name ?? null] : null, 'profile' => $profileData ];

            return response()->json(['message' => 'Review updated successfully!', 'review' => $formattedReview]);
        } catch (\Exception $e) {
            Log::error('Error updating review: '.$e->getMessage(), ['review_id' => $review->id, 'profile_id' => $profileId, 'trace' => $e->getTraceAsString()]);
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to update review.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }

     public function archive(Request $request)
     {
         $validator = Validator::make($request->all(), [ 'ids' => 'required|array', 'ids.*' => 'integer|exists:reviews,id', ]);
         if ($validator->fails()) { return response()->json(['message' => 'Invalid IDs provided for archiving.', 'errors' => $validator->errors()], 400); }
         try { $idsToArchive = $request->input('ids'); $updatedCount = Review::whereIn('id', $idsToArchive)->update(['status' => 0]); return response()->json(['message' => $updatedCount . ' review(s) archived successfully.']);
         } catch (\Exception $e) { Log::error('Error archiving reviews: ' . $e->getMessage()); $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to archive reviews.'; return response()->json(['message' => $errorMessage], 500); }
     }

     public function restore(Request $request)
     {
         $validator = Validator::make($request->all(), [ 'ids' => 'required|array', 'ids.*' => 'integer|exists:reviews,id', ]);
         if ($validator->fails()) { return response()->json(['message' => 'Invalid IDs provided for restoring.', 'errors' => $validator->errors()], 400); }
         try { $idsToRestore = $request->input('ids'); $updatedCount = Review::whereIn('id', $idsToRestore)->update(['status' => 1]); return response()->json(['message' => $updatedCount . ' review(s) restored successfully.']);
         } catch (\Exception $e) { Log::error('Error restoring reviews: ' . $e->getMessage()); $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to restore reviews.'; return response()->json(['message' => $errorMessage], 500); }
     }

    public function destroy(Request $request, Review $review)
    {
        $profileId = $this->getAuthenticatedProfileId($request);
        if (is_null($profileId)) {
            return response()->json(['message' => 'User not authenticated.'], 401);
        }

        if ($review->profile_id !== $profileId && $request->user()->role_id !== 1) {
            Log::warning("Authorization failed: User (Profile ID: {$profileId}, Role: {$request->user()->role_id}) attempted to delete review (ID: {$review->id}) owned by Profile ID: {$review->profile_id}");
            return response()->json(['message' => 'You are not authorized to delete this review.'], 403);
        }

        try {
            $reviewId = $review->id;
            $review->delete();
            Log::info("Review deleted successfully", ['review_id' => $reviewId, 'deleted_by_profile_id' => $profileId]);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting review: ' . $e->getMessage(), ['review_id' => $review->id, 'profile_id' => $profileId, 'trace' => $e->getTraceAsString()]);
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to delete review.';
            return response()->json(['message' => $errorMessage], 500);
        }
    }
}