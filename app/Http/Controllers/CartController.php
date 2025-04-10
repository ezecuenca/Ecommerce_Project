<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    public function index($profileId)
    {
        $validator = Validator::make(['profileId' => $profileId], [
            'profileId' => 'required|integer|exists:profiles,id' // Adjust validation if profile table is different
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Eager load the product details along with the cart items
        $cartItems = Cart::with('product')
                         ->where('profile_id', $profileId)
                         ->get();

        return response()->json($cartItems);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profileId' => 'required|integer|exists:profiles,id', // Adjust validation
            'productId' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $profileId = $request->input('profileId');
        $productId = $request->input('productId');
        $quantity = $request->input('quantity');

        try {
            $product = Product::findOrFail($productId);
            $productPrice = $product->price;

            // Check if item already exists in cart for this user
            $cartItem = Cart::where('profile_id', $profileId)
                            ->where('product_id', $productId)
                            ->first();

            if ($cartItem) {
                // Update existing item
                $cartItem->quantity += $quantity;
                $cartItem->total_price = $cartItem->quantity * $productPrice;
                $cartItem->save();
            } else {
                // Create new cart item
                $cartItem = Cart::create([
                    'profile_id' => $profileId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'total_price' => $quantity * $productPrice,
                ]);
            }

             // Eager load product details for the response
            $cartItem->load('product');

            return response()->json($cartItem, 201); // 201 Created or 200 OK if updated

        } catch (\Exception $e) {
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
            $cartItem = Cart::findOrFail($cartItemId);
            $product = Product::findOrFail($cartItem->product_id); // Find related product for price

            $cartItem->quantity = $request->input('quantity');
            $cartItem->total_price = $cartItem->quantity * $product->price;
            $cartItem->save();

            // Eager load product details for the response
            $cartItem->load('product');

            return response()->json($cartItem);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Cart item not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error updating cart item', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($cartItemId)
    {
        try {
            $cartItem = Cart::findOrFail($cartItemId);
            $cartItem->delete();

            return response()->json(null, 204); // 204 No Content on successful deletion

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Cart item not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting cart item', 'error' => $e->getMessage()], 500);
        }
    }
}