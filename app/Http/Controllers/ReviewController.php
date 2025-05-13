<?php

// --- FILE PATH: app/Http/Controllers/ReviewController.php ---

namespace App\Http\Controllers; // Correct namespace for app/Http/Controllers/

// Required Models and Facades
use App\Models\Review;
use App\Models\User; // For type hinting and role check
use App\Models\Profile; // For type hinting relationships
use App\Models\Product; // For type hinting relationships
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // Included for getStats and potential transactions
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth; // Included if using Auth facade

class ReviewController extends Controller
{
    // Helper (optional) - Gets Profile ID of the logged-in user
    private function getAuthenticatedProfileId(Request $request): ?int
    {
        return $request->user()?->profile?->id;
    }

    /**
     * Display a listing of reviews. Handles pagination, status filtering, and search.
     * GET /api/reviews
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->query(), [
            'product_id' => 'sometimes|integer|exists:products,id',
            'status' => 'sometimes|in:active,archived',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'search' => 'sometimes|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid request parameters.', 'errors' => $validator->errors()], 400);
        }

        try {
            $query = Review::query()->with([
                 'product:id,product_name',
                 'profile:id,first_name,last_name' // Use direct profile relationship
            ]);

            if ($request->input('status') === 'archived') {
                $query->where('status', 0); // Archived status
            } else {
                $query->where('status', 1); // Active status (default)
            }

            if ($request->filled('product_id')) {
                $query->where('product_id', $request->query('product_id'));
            }

            if ($request->filled('search')) {
                $searchTerm = '%' . $request->input('search') . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('review_text', 'LIKE', $searchTerm)
                      ->orWhereHas('product', function ($prodQ) use ($searchTerm) { $prodQ->where('product_name', 'LIKE', $searchTerm); })
                      ->orWhereHas('profile', function ($profileQ) use ($searchTerm) {
                          $profileQ->where('first_name', 'LIKE', $searchTerm)
                                   ->orWhere('last_name', 'LIKE', $searchTerm);
                      });
                });
            }

            $query->orderBy('created_at', 'desc');
            $perPage = $request->input('per_page', 5);
            $reviewsPaginator = $query->paginate($perPage);

            $reviewsPaginator->getCollection()->transform(function ($review) {
                $userName = 'N/A';
                if ($review->profile) {
                    $userName = trim(($review->profile->first_name ?? '') . ' ' . ($review->profile->last_name ?? ''));
                    if (empty($userName) && $review->profile_id) { $userName = "Profile ID: " . $review->profile_id; }
                    if (empty($userName)) { $userName = "Profile Data Missing"; }
                } elseif ($review->profile_id) { $userName = "Profile ID: " . $review->profile_id; }

                $productName = 'N/A';
                if ($review->product) {
                    $productName = $review->product->product_name ?: "Product ID: {$review->product_id}";
                } elseif ($review->product_id) { $productName = "Product ID: {$review->product_id}"; }

                 return [
                     'id' => $review->id, 'rating' => $review->rating, 'review_text' => $review->review_text,
                     'created_at' => $review->created_at, 'updated_at' => $review->updated_at,
                     'profile_id' => $review->profile_id, 'product_id' => $review->product_id,
                     'status' => $review->status, 'productName' => $productName, 'userName' => $userName,
                 ];
             });

            return response()->json($reviewsPaginator);

        } catch (\Exception $e) {
            Log::error('Error fetching reviews: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to retrieve reviews.'], 500);
        }
    }

    /**
     * Store a newly created review.
     * POST /api/reviews
     */
    public function store(Request $request)
    {
        $profileId = $this->getAuthenticatedProfileId($request);
        if (is_null($profileId)) { return response()->json(['message' => 'User profile not found or user not authenticated.'], 401); }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'rating' => 'required|numeric|min:0.5|max:5|regex:/^\d+(\.5)?$/',
            'review_text' => 'required|string|max:1000',
        ]);
        if ($validator->fails()) { return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422); }

        try {
            $validatedData = $validator->validated();
            $validatedData['profile_id'] = $profileId;
            $validatedData['status'] = 1;
            $review = Review::create($validatedData);
            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);

            $productName = $review->product?->product_name ?? null;
            $userName = $review->profile ? trim(($review->profile->first_name ?? '').' '.($review->profile->last_name ?? '')) : null;
            $formattedReview = $review->toArray();
            $formattedReview['productName'] = $productName;
            $formattedReview['userName'] = $userName;
            // Remove raw relations if not needed after transformation
            // unset($formattedReview['product']);
            // unset($formattedReview['profile']);

            return response()->json(['message' => 'Review submitted successfully!', 'review' => $formattedReview], 201);
        } catch (\Exception $e) { Log::error('Error creating review: '.$e->getMessage()); return response()->json(['message' => 'Failed to submit review.'], 500); }
    }

    /**
     * Update the specified review (Edit).
     * PUT /api/reviews/{review}
     */
    public function update(Request $request, Review $review)
    {
        $profileId = $this->getAuthenticatedProfileId($request);
        $isAdmin = $request->user()?->role_id === 1;

        if (!$profileId || (!$isAdmin && $review->profile_id !== $profileId)) { return response()->json(['message' => 'Unauthorized to update this review.'], 403); }
        if ($review->status == 0 && !$isAdmin) { return response()->json(['message' => 'Cannot edit an archived review.'], 400); }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|numeric|min:0.5|max:5|regex:/^\d+(\.5)?$/',
            'review_text' => 'required|string|max:1000',
        ]);
        if ($validator->fails()) { return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422); }

        try {
            $review->update($validator->validated());
            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);

            $productName = $review->product?->product_name ?? null;
            $userName = $review->profile ? trim(($review->profile->first_name ?? '').' '.($review->profile->last_name ?? '')) : null;
            $formattedReview = $review->toArray();
            $formattedReview['productName'] = $productName;
            $formattedReview['userName'] = $userName;
            // unset($formattedReview['product']);
            // unset($formattedReview['profile']);

            return response()->json(['message' => 'Review updated successfully!', 'review' => $formattedReview]);
        } catch (\Exception $e) { Log::error('Error updating review: '.$e->getMessage()); return response()->json(['message' => 'Failed to update review.'], 500); }
    }

    /**
     * Archive OR Permanently Delete the specified review based on user role.
     * DELETE /api/reviews/{review}
     */
    public function destroy(Request $request, Review $review)
    {
        $user = $request->user();
        if (!$user) { return response()->json(['message' => 'Unauthenticated.'], 401); }

        $profileId = $user->profile?->id;
        $isAdmin = $user->role_id === 1;

        if (!$profileId || (!$isAdmin && $review->profile_id !== $profileId)) {
            Log::warning("Auth failed: Delete/Archive review {$review->id}. AuthProf: {$profileId}, ReviewProf: {$review->profile_id}, IsAdmin: {$isAdmin}");
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        try {
            if ($isAdmin) {
                // ADMIN: Archive
                if ($review->status == 0) { return response()->json(['message' => 'Review already archived.'], 400); }
                $review->status = 0;
                $review->save();
                Log::info("Review archived by Admin", ['review_id' => $review->id, 'admin_user_id' => $user->id]);
                return response()->json(['message' => 'Review archived successfully.'], 200);
            } else {
                // OWNER: Permanent Delete
                $reviewId = $review->id;
                $review->delete(); // Permanent delete
                Log::info("Review permanently deleted by Owner", ['review_id' => $reviewId, 'owner_profile_id' => $profileId]);
                return response()->json(null, 204); // No Content
            }
        } catch (\Exception $e) {
             $action = $isAdmin ? 'archiving' : 'deleting';
             Log::error("Error {$action} review: ".$e->getMessage(), ['review_id' => $review->id ?? null, 'user_id' => $user->id]);
             return response()->json(['message' => "Failed to {$action} review."], 500);
         }
    }

    /**
     * Restore the specified archived review (sets status to 1).
     * PUT /api/reviews/{reviewId}/restore
     */
    public function restore(Request $request, $reviewId)
    {
       // Authorization: Admin Only
         if (!$request->user() || $request->user()->role_id !== 1) {
             return response()->json(['message' => 'Unauthorized to restore review.'], 403);
         }

        try {
            // Find review with status 0
            $review = Review::where('status', 0)->findOrFail($reviewId);
            $review->status = 1; // Set status to active
            $review->save();
            Log::info("Review restored", ['review_id' => $review->id]);

            $review->load(['product:id,product_name', 'profile:id,first_name,last_name']);
            // Format response
            $productName = $review->product?->product_name ?? null;
            $userName = $review->profile ? trim(($review->profile->first_name ?? '').' '.($review->profile->last_name ?? '')) : null;
            $formattedReview = $review->toArray();
            $formattedReview['productName'] = $productName;
            $formattedReview['userName'] = $userName;
            // unset($formattedReview['product']);
            // unset($formattedReview['profile']);

            return response()->json(['message' => 'Review restored successfully.', 'review' => $formattedReview]);
        } catch (ModelNotFoundException $e) {
             return response()->json(['message' => 'Review not found or already active.'], 404);
        } catch (\Exception $e) {
             Log::error('Error restoring review: '.$e->getMessage(), ['review_id' => $reviewId]);
             return response()->json(['message' => 'Failed to restore review.'], 500);
         }
    }

    /**
     * Archive multiple reviews by IDs.
     * PUT /api/reviews/archive-batch
     */
    public function batchArchive(Request $request)
    {
        // Authorization: Admin Only
        if (!$request->user() || $request->user()->role_id !== 1) return response()->json(['message' => 'Unauthorized.'], 403);

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:reviews,id', // Ensure IDs exist in reviews table
        ]);
        if ($validator->fails()) { return response()->json(['message' => 'Invalid IDs provided.', 'errors' => $validator->errors()], 400); }

        try {
            $idsToArchive = $request->input('ids');
            // Only archive reviews that are currently active (status=1)
            $updatedCount = Review::whereIn('id', $idsToArchive)->where('status', 1)->update(['status' => 0]);
            return response()->json(['message' => $updatedCount . ' review(s) archived successfully.']);
        } catch (\Exception $e) {
            Log::error('Batch Archive Error: '.$e->getMessage());
            return response()->json(['message' => 'Failed to archive reviews.'], 500);
        }
    }

    /**
     * Restore multiple reviews by IDs.
     * PUT /api/reviews/restore-batch
     */
    public function batchRestore(Request $request)
    {
         // Authorization: Admin Only
         if (!$request->user() || $request->user()->role_id !== 1) return response()->json(['message' => 'Unauthorized.'], 403);

         $validator = Validator::make($request->all(), [
             'ids' => 'required|array',
             'ids.*' => 'integer|exists:reviews,id', // Ensure IDs exist
         ]);
        if ($validator->fails()) { return response()->json(['message' => 'Invalid IDs provided.', 'errors' => $validator->errors()], 400); }

        try {
            $idsToRestore = $request->input('ids');
            // Only restore reviews that are currently archived (status=0)
            $updatedCount = Review::whereIn('id', $idsToRestore)->where('status', 0)->update(['status' => 1]);
            return response()->json(['message' => $updatedCount . ' review(s) restored successfully.']);
        } catch (\Exception $e) {
            Log::error('Batch Restore Error: '.$e->getMessage());
            return response()->json(['message' => 'Failed to restore reviews.'], 500);
        }
    }

    /**
     * Get aggregated review statistics.
     * GET /api/reviews/stats
     */
    public function getStats(Request $request)
    {
         $productId = $request->query('product_id');
         try {
             $baseQuery = Review::where('status', 1)->whereNotNull('rating')->whereBetween('rating', [0.5, 5]);
             if ($productId) {
                  $validator = Validator::make(['product_id' => $productId], ['product_id' => 'integer|exists:products,id']);
                  if ($validator->fails()) { return response()->json(['message' => 'Invalid product ID.'], 400); }
                  $baseQuery->where('product_id', $productId);
             }
             $totalReviews = $baseQuery->count();
             $averageRating = $totalReviews > 0 ? $baseQuery->clone()->avg('rating') : 0;

             $ratingCountsResult = $baseQuery->clone()
                 ->selectRaw('rating, count(*) as count') ->groupBy('rating')
                 ->pluck('count', 'rating');

             // Initialize counts for 0.5 steps if needed, or just integer steps
             $integerRatingCounts = ['5' => 0, '4' => 0, '3' => 0, '2' => 0, '1' => 0];
             foreach ($ratingCountsResult as $rating => $count) {
                 $integerKey = floor((float)$rating); // Group .5 ratings with the integer below them
                 if ($integerKey >= 1 && $integerKey <= 5) {
                     $integerRatingCounts[(string)$integerKey] += $count;
                 }
                 // If you need separate .5 counts, use a different structure
             }

             return response()->json([
                 'average_rating' => round($averageRating, 1),
                 'total_reviews' => $totalReviews,
                 'rating_counts' => $integerRatingCounts, // Sending grouped integer counts
             ]);
         } catch (\Exception $e) {
             Log::error('Error fetching review stats: ' . $e->getMessage());
             return response()->json(['message' => 'Could not retrieve review statistics.'], 500);
         }
    }

} // End of ReviewController class