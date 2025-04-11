<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                 return response()->json(['message' => 'User not authenticated.'], 401);
            }
             $profileId = $user->profile->id ?? null;

             if (!$profileId) {
                 Log::error("Could not determine profile ID for authenticated user.", ['user_id' => $user->id]);
                 return response()->json(['message' => 'User profile not found.'], 404);
             }

            $cartItems = Cart::with('product:id,product_name,price,image_url')
                             ->where('profile_id', $profileId)
                             ->get();

            return response()->json($cartItems);

        } catch (\Exception $e) {
             Log::error("Error fetching cart for profile ID: {$profileId}", ['error' => $e->getMessage()]);
             return response()->json(['message' => 'Error fetching cart items.'], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'productId' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            $user = $request->user();
             if (!$user) { return response()->json(['message' => 'User not authenticated.'], 401); }
             $profileId = $user->profile->id ?? null;
             if (!$profileId) { return response()->json(['message' => 'User profile not found.'], 404); }

            $productId = $request->input('productId');
            $quantity = $request->input('quantity');

            $product = Product::findOrFail($productId);
            $productPrice = $product->price;

             $cartItem = DB::transaction(function () use ($profileId, $productId, $quantity, $productPrice) {
                 $item = Cart::where('profile_id', $profileId)
                                 ->where('product_id', $productId)
                                 ->lockForUpdate()
                                 ->first();

                 if ($item) {
                     $item->quantity += $quantity;
                     $item->total_price = $item->quantity * $productPrice;
                     $item->save();
                     return $item;
                 } else {
                      return Cart::create([
                          'profile_id' => $profileId,
                          'product_id' => $productId,
                          'quantity' => $quantity,
                          'total_price' => $quantity * $productPrice,
                      ]);
                 }
             });

            $cartItem->load('product:id,product_name,price,image_url');

            return response()->json($cartItem, 201);

        } catch (\Exception $e) {
             Log::error("Error adding item to cart for profile ID: {$profileId}", ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error processing cart operation', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $cartItemId)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            $user = $request->user();
             if (!$user) { return response()->json(['message' => 'User not authenticated.'], 401); }
             $profileId = $user->profile->id ?? null;
            if (!$profileId) { return response()->json(['message' => 'User profile not found.'], 404); }

            $cartItem = Cart::where('id', $cartItemId)
                            ->where('profile_id', $profileId)
                            ->firstOrFail();

            $product = Product::findOrFail($cartItem->product_id);

            $newQuantity = $request->input('quantity');

            $cartItem->quantity = $newQuantity;
            $cartItem->total_price = $newQuantity * $product->price;
            $cartItem->save();

            $cartItem->load('product:id,product_name,price,image_url');

            return response()->json($cartItem);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Cart item not found or not accessible.'], 404);
        } catch (\Exception $e) {
            Log::error("Error updating cart item ID: {$cartItemId} for profile ID: {$profileId}", ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error updating cart item', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $cartItemId)
    {
        try {
            $user = $request->user();
             if (!$user) { return response()->json(['message' => 'User not authenticated.'], 401); }
             $profileId = $user->profile->id ?? null;
            if (!$profileId) { return response()->json(['message' => 'User profile not found.'], 404); }

            $cartItem = Cart::where('id', $cartItemId)
                            ->where('profile_id', $profileId)
                            ->firstOrFail();

            $cartItem->delete();

            return response()->json(null, 204);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Cart item not found or not accessible.'], 404);
        } catch (\Exception $e) {
            Log::error("Error deleting cart item ID: {$cartItemId} for profile ID: {$profileId}", ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error deleting cart item', 'error' => $e->getMessage()], 500);
        }
    }
}