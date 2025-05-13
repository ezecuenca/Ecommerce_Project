<?php

// Correct namespace based on user confirmation
namespace App\Http\Controllers;

// No change to imports needed based on the fix
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chatbox;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ChatboxController extends Controller
{
    /**
     * ADMIN: Fetch list of conversations for the admin inbox.
     * Groups messages by profile_id (customer).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminInbox(Request $request)
    {
        // Select the latest message time for each profile_id
        $latestMessages = Chatbox::select('profile_id', DB::raw('MAX(created_at) as last_message_time'))
            ->groupBy('profile_id')
            ->orderBy('last_message_time', 'desc')
            ->get();

        $inbox = [];

        foreach ($latestMessages as $latest) {
            // Find the profile associated with the conversation
            $profile = Profile::find($latest->profile_id);

            if ($profile) {
                // Get the actual last message content for this profile
                $lastMessage = Chatbox::where('profile_id', $latest->profile_id)
                                    ->orderBy('created_at', 'desc')
                                    ->first();

                // Count unread messages sent by the 'user' (customer) for this profile
                $unreadCount = Chatbox::where('profile_id', $latest->profile_id)
                                    ->where('sender_type', 'user') // Messages from customer
                                    ->where('is_read', false)      // That are unread by admin
                                    ->count();

                // Prepare data for the inbox item
                // Make sure 'profile_picture_url' exists on your Profile model or adjust
                $profilePicture = $profile->profile_picture_url ?? null; // Example field

                $inbox[] = [
                    'profile_id'        => $profile->id,
                    'customer_name'     => trim($profile->first_name . ' ' . $profile->last_name), // Example name
                    'profile_picture'   => $profilePicture,
                    'last_message_text' => $lastMessage ? ($lastMessage->message_text ?: ($lastMessage->image ? '[Image]' : '')) : '', // Show text or placeholder
                    'last_message_time' => $lastMessage ? $lastMessage->created_at : null,
                    'unread_count'      => $unreadCount,
                ];
            }
        }

        return response()->json($inbox);
    }

    /**
     * ADMIN: Fetch all messages for a specific conversation (profile_id).
     * Marks messages sent by the 'user' as read by the admin.
     *
     * @param int $profile_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminGetConversation(int $profile_id)
    {
        // Fetch messages for the specific customer profile
        $messages = Chatbox::where('profile_id', $profile_id)
                         ->with('profile') // Optional: eager load profile if needed on frontend
                         ->orderBy('created_at', 'asc')
                         ->get();

         // Add image_url attribute if image exists
         $messages->each(function ($message) {
            if ($message->image) {
                $message->image_url = Storage::disk('public')->url($message->image);
            }
         });

        // Mark messages sent by the 'user' in this conversation as read by the admin
        Chatbox::where('profile_id', $profile_id)
               ->where('sender_type', 'user')
               ->where('is_read', false)
               ->update(['is_read' => true]);

        return response()->json($messages);
    }

    /**
     * CUSTOMER: Fetch the conversation history for the currently authenticated user.
     * Marks messages sent by 'admin' as read by the customer.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function customerGetConversation(Request $request)
    {
        $user = Auth::user(); // Get the authenticated user

        // Check if user is authenticated
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        // Check if user has a profile
        if (!$user->profile) {
            Log::warning("User ID {$user->id} tried to fetch chat without a profile.");
            return response()->json(['message' => 'User profile not found.'], 404);
        }

        $profile_id = $user->profile->id;

        // Fetch messages for this user's profile
        $messages = Chatbox::where('profile_id', $profile_id)
                            ->orderBy('created_at', 'asc')
                            ->get();

        // Add image_url attribute if image exists
        $messages->each(function ($message) {
            if ($message->image) {
                $message->image_url = Storage::disk('public')->url($message->image);
            }
        });


        // Mark messages sent by 'admin' in this conversation as read by the customer
        Chatbox::where('profile_id', $profile_id)
               ->where('sender_type', 'admin')
               ->where('is_read', false)
               ->update(['is_read' => true]);

        return response()->json($messages);
    }

    /**
     * Store a new chat message (used by both Customer and Admin).
     * Determines sender_type and profile_id based on context/authentication.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeMessage(Request $request)
    {
        // --- Determine Sender and Profile ID ---
        $user = Auth::user(); // Get authenticated user
        if (!$user) {
             return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $sender_type = '';
        $profile_id = null;
        $validated = []; // Initialize validated data array

        // --- Check if user is Admin using the method from User model ---
        // THIS IS WHERE THE CHECK HAPPENS. If it returns false, sender_type will be 'user'.
        $isAdmin = $user->isAdmin();

        if ($isAdmin) {
             // Admin is sending: requires 'profile_id' in the request to know who to send to
             $validated = $request->validate([
                 'profile_id'   => 'required|exists:profiles,id', // Admin must specify recipient profile
                 'message_text' => 'nullable|string|required_without:image|max:5000', // Added max length example
                 'image'        => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048' // Max 2MB, common image types
             ]);
             $sender_type = 'admin'; // Correctly set if $isAdmin is true
             $profile_id = $validated['profile_id'];

        } else {
             // Customer is sending (or isAdmin() returned false for the logged-in user)
             if (!$user->profile) { // Check specifically for profile existence
                  Log::error("User ID {$user->id} attempted to chat without a profile.");
                  return response()->json(['message' => 'User profile not found.'], 404);
             }
             $validated = $request->validate([
                 'message_text' => 'nullable|string|required_without:image|max:5000', // Added max length example
                 'image'        => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048' // Max 2MB example
             ]);
             $sender_type = 'user'; // Correctly set if $isAdmin is false
             $profile_id = $user->profile->id;
        }

        // --- Prepare Data ---
        // The $sender_type used here depends directly on the $isAdmin check above
        $data = [
            'profile_id'   => $profile_id,
            'sender_type'  => $sender_type,
            'message_text' => $validated['message_text'] ?? '', // Use validated data
            'is_read'      => false, // New messages are always initially unread
        ];

        // --- Handle Image Upload ---
        $path = null; // Initialize path variable
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            try {
                // Store in 'public/chat_images' directory.
                $path = $request->file('image')->store('chat_images', 'public');
                $data['image'] = $path; // Store the relative path (e.g., chat_images/xyz.jpg)
            } catch (\Exception $e) {
                 Log::error("Chat image upload failed for user ID {$user->id}: " . $e->getMessage());
                 return response()->json(['message' => 'Failed to upload image.'], 500);
            }
        } elseif (empty($validated['message_text'])) {
            // Prevent saving if there's no text AND no valid image was uploaded/provided
             return response()->json(['message' => 'A message or an image is required.'], 422);
        }

        // --- Create Message ---
        try {
             $chatboxMessage = Chatbox::create($data);

              // Construct image URL for the response if an image was saved
              if ($chatboxMessage->image) {
                   // Use the stored relative path to generate the full public URL
                   $chatboxMessage->image_url = Storage::disk('public')->url($chatboxMessage->image);
              }

             return response()->json($chatboxMessage, 201); // 201 Created status

        } catch (\Exception $e) {
             Log::error("Chat message creation failed for user ID {$user->id}: " . $e->getMessage(), ['exception' => $e]);
             // If image was stored but DB insert failed, attempt to delete the orphan image
             if ($path && Storage::disk('public')->exists($path)) {
                 Storage::disk('public')->delete($path);
             }
             return response()->json(['message' => 'Failed to send message.'], 500);
        }
    }
}