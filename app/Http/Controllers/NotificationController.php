<?php

// 1. CORRECT NAMESPACE - This is based on the directory structure
namespace App\Http\Controllers;

// 2. NECESSARY IMPORTS
use Illuminate\Http\Request;
use App\Models\Notification; // Assuming your Notification model is in App\Models
use App\Models\User;       // Assuming your User model is in App\Models
use Illuminate\Support\Facades\Log;

// 3. CORRECT CLASS DEFINITION
class NotificationController extends Controller
{
    /**
     * Display a listing of the resource for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            Log::warning('NotificationController@index: Attempt to access notifications by unauthenticated user.');
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $profile = $user->profile; // Assumes User model has a 'profile' relationship

        if (!$profile) {
            Log::warning('NotificationController@index: User ID ' . $user->id . ' does not have an associated profile.');
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
                'message' => 'User profile not found for notifications.'
            ]);
        }

        $profileId = $profile->id;
        Log::info('NotificationController@index: Fetching notifications for profile_id: ' . $profileId);

        try {
            // Querying notifications based on profile_id
            $notifications = Notification::where('profile_id', $profileId)
                                          ->orderBy('created_at', 'desc')
                                          ->take(15)
                                          ->get();

            $unreadCount = Notification::where('profile_id', $profileId)
                                       ->where('is_read', 0)
                                       ->count();

            Log::info('NotificationController@index: Found ' . $notifications->count() . ' notifications, ' . $unreadCount . ' unread for profile_id ' . $profileId);

            return response()->json([
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ]);

        } catch (\Exception $e) {
            Log::error('NotificationController@index: Error fetching notifications for profile_id ' . $profileId . ' - ' . $e->getMessage(), ['exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Could not retrieve notifications due to a server error.'], 500);
        }
    }

    /**
     * Mark all unread notifications as read for the current user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            Log::warning('NotificationController@markAllAsRead: Attempt by unauthenticated user.');
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $profile = $user->profile;

        if (!$profile) {
            Log::warning('NotificationController@markAllAsRead: User ID ' . $user->id . ' does not have an associated profile.');
            return response()->json(['message' => 'User profile not found.'], 404);
        }

        $profileId = $profile->id;
        Log::info('NotificationController@markAllAsRead: Marking all notifications as read for profile_id: ' . $profileId);

        try {
            Notification::where('profile_id', $profileId)
                        ->where('is_read', 0)
                        ->update(['is_read' => 1]);

            return response()->json(['message' => 'All notifications marked as read.']);

        } catch (\Exception $e) {
            Log::error('NotificationController@markAllAsRead: Error marking notifications for profile_id ' . $profileId . ' - ' . $e->getMessage(), ['exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Could not mark notifications as read due to a server error.'], 500);
        }
    }
}