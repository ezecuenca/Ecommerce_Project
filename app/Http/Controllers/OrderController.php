<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Shipping;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Profile;
use App\Models\PaymentMethod;
use App\Models\Payment;
use App\Models\Inventory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $creditCardMethodId = PaymentMethod::where('method_name', 'Credit Card')->value('id');
        if (!$creditCardMethodId) { Log::warning('Credit Card payment method ID not found dynamically, using fallback ID 3.'); $creditCardMethodId = 3; }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'shipping_cost' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'shipping_method' => 'required|string|max:50',
            'shipping_address' => 'required|string|max:1000',
            'contact_number' => 'required|string|max:20',
            'payment_method_id' => 'required|integer|exists:payment_methods,id',
            'payment_amount' => 'required|numeric|min:0',
            'payment_details' => 'nullable|array',
            'payment_details.card_number_last4' => 'exclude_unless:payment_method_id,'.$creditCardMethodId.'|required_if:payment_method_id,'.$creditCardMethodId.'|nullable|string|digits:4',
            'payment_details.cardholder_name' => 'exclude_unless:payment_method_id,'.$creditCardMethodId.'|required_if:payment_method_id,'.$creditCardMethodId.'|nullable|string|max:255',
            'payment_details.expiration_date' => 'exclude_unless:payment_method_id,'.$creditCardMethodId.'|required_if:payment_method_id,'.$creditCardMethodId.'|nullable|string|max:7',
            'payment_details.billing_address' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) { Log::error('Order validation failed.', ['errors' => $validator->errors()->toArray()]); return response()->json(['message' => 'Order data validation failed', 'errors' => $validator->errors()], 422); }

        $user = $request->user(); if (!$user) { return response()->json(['message' => 'User not authenticated.'], 401); }
        $profileId = $user->profile->id ?? null;
        if (!$profileId) { Log::error("Could not determine profile ID for authenticated user.", ['user_id' => $user->id]); return response()->json(['message' => 'User profile association not found.'], 500); }

        $validatedData = $validator->validated();

         $calculatedSubtotal = 0;
         foreach ($validatedData['items'] as $item) {
             try { $product = Product::select('price')->findOrFail($item['product_id']); if (abs($product->price - $item['price']) > 0.01) { Log::warning("Price mismatch during order placement.", ['profile_id' => $profileId, 'product_id' => $item['product_id'], 'frontend_price' => $item['price'], 'backend_price' => $product->price ]); } $calculatedSubtotal += $item['price'] * $item['quantity']; } catch (ModelNotFoundException $e) { DB::rollback(); Log::error("Product not found during server-side total calculation.", ['product_id' => $item['product_id']]); return response()->json(['message' => 'An item in your order could not be found.'], 404); }
         } $calculatedTotal = $calculatedSubtotal + $validatedData['shipping_cost'];
         if (abs($calculatedSubtotal - $validatedData['subtotal']) > 0.01 || abs($calculatedTotal - $validatedData['total_price']) > 0.01 || abs($validatedData['payment_amount'] - $calculatedTotal) > 0.01 ) { Log::error("Total mismatch during order placement.", ['profile_id' => $profileId, 'frontend_subtotal' => $validatedData['subtotal'], 'backend_subtotal' => $calculatedSubtotal, 'frontend_total' => $validatedData['total_price'], 'backend_total' => $calculatedTotal, 'payment_amount' => $validatedData['payment_amount'] ]); return response()->json(['message' => 'Order total calculation mismatch. Please try again.'], 422); }

        DB::beginTransaction();
        try {
            $shipping = Shipping::create([ 'shipping_address' => $validatedData['shipping_address'], 'shipping_method' => $validatedData['shipping_method'], 'contact_number' => $validatedData['contact_number'], 'shipping_status' => 'Pending', 'tracking_number' => 'TRK-' . strtoupper(Str::random(10)), 'shipping_date' => null, ]);
            $order = Order::create([ 'profile_id' => $profileId, 'order_date' => now(), 'status' => 'pending', 'total_amount' => $validatedData['total_price'], 'shipping_id' => $shipping->id, ]);
            $paymentMethod = PaymentMethod::find($validatedData['payment_method_id']); $paymentStatus = 'Pending'; if ($paymentMethod) { if (strtolower($paymentMethod->method_name) === 'credit card') { $paymentStatus = 'Paid'; } elseif (strtolower($paymentMethod->method_name) === 'cash on delivery') { $paymentStatus = 'Pending'; } } Payment::create([ 'order_id' => $order->id, 'payment_method_id' => $validatedData['payment_method_id'], 'payment_date' => now(), 'payment_status' => $paymentStatus, 'payment_amount' => $validatedData['payment_amount'], 'card_last_four' => $validatedData['payment_details']['card_number_last4'] ?? null, 'cardholder_name' => $validatedData['payment_details']['cardholder_name'] ?? null, 'expiration_date' => $validatedData['payment_details']['expiration_date'] ?? null, 'billing_address' => $validatedData['payment_details']['billing_address'] ?? $validatedData['shipping_address'], ]);
            foreach ($validatedData['items'] as $item) { $productId = $item['product_id']; $quantityOrdered = $item['quantity']; $inventory = Inventory::where('product_id', $productId)->lockForUpdate()->first(); if (!$inventory) { throw new Exception("Inventory record not found for product ID: " . $productId); } if ($inventory->stocks < $quantityOrdered) { $productName = $inventory->product->product_name ?? ('ID ' . $productId); throw new Exception("Insufficient stock for product: '" . $productName . "'. Only " . $inventory->stocks . " available."); } $inventory->decrement('stocks', $quantityOrdered); Log::info("Stock decremented for Product ID: {$productId} by {$quantityOrdered}. New stock: {$inventory->stocks}"); OrderDetail::create([ 'order_id' => $order->id, 'product_id' => $item['product_id'], 'quantity' => $item['quantity'], 'price' => $item['price'], ]); }
            Cart::where('profile_id', $profileId)->delete(); Log::info("Cart cleared for profile ID: {$profileId}");
            DB::commit(); Log::info("Order transaction committed successfully for Order ID: {$order->id}");
            $order->load(['orderDetails.product:id,product_name,image_url','shipping','profile:id,first_name,last_name','payment.paymentMethod:id,method_name']);
            return response()->json(['message' => 'Order placed successfully!', 'order' => $order], 201);
        } catch (ModelNotFoundException $e) { DB::rollback(); Log::error("Order placement failed - Model Not Found: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]); return response()->json(['message' => 'An item in your order could not be found.'], 404); }
        catch (Exception $e) { DB::rollback(); Log::error('Order placement failed: ' . $e->getMessage(), ['profile_id' => $profileId ?? 'N/A', 'trace' => $e->getTraceAsString()]); if (str_contains($e->getMessage(), 'Insufficient stock') || str_contains($e->getMessage(), 'Inventory record not found')) { return response()->json(['message' => $e->getMessage()], 422); } $errorMessage = config('app.debug') ? ('Order Error: ' . $e->getMessage()) : 'Failed to place order due to a server error.'; return response()->json(['message' => $errorMessage], 500); }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'User not authenticated.'], 401);
        }

        $profileId = $user->profile->id ?? null;

        if (!$profileId) {
            Log::error("Could not determine profile ID for authenticated user in index.", ['user_id' => $user->id]);
            return response()->json([], 404);
        }

        try {
            $query = Order::with([
                                'orderDetails.product:id,product_name,image_url',
                                'shipping',
                                'payment.paymentMethod:id,method_name',
                                'profile:id,first_name,last_name'
                            ])
                            ->orderBy('order_date', 'desc');

            $isAdminContext = $request->input('context') === 'admin';

            if (!$isAdminContext) {
                $query->where('profile_id', $profileId);
            }

            if ($request->has('paginate') && $request->input('paginate') == 'true') {
                $orders = $query->paginate($request->input('per_page', 10));
            } else {
                $orders = $query->get();
            }

            Log::info("Orders fetched successfully.", ['profile_id' => $profileId, 'is_admin' => $isAdminContext, 'count' => $orders instanceof \Illuminate\Pagination\LengthAwarePaginator ? $orders->total() : $orders->count()]);
            return response()->json($orders);

        } catch (\Exception $e) {
            Log::error('Error fetching orders. Error: '.$e->getMessage(), ['profile_id' => $profileId, 'is_admin' => $isAdminContext]);
            return response()->json(['message' => 'Could not retrieve orders.'], 500);
        }
    }

    public function show(Order $order)
    {
        try {
            $user = Auth::user();
            if ($user->role_id !== 1 && $order->profile_id !== ($user->profile->id ?? null)) {
                 return response()->json(['message' => 'Not authorized to view this order.'], 403);
            }
            $order->load(['orderDetails.product:id,product_name,image_url','shipping','profile:id,first_name,last_name','payment.paymentMethod:id,method_name']);
            return response()->json($order);
        } catch (\Exception $e) { Log::error('Error fetching order details for Order ID: '.$order->id.'. Error: '.$e->getMessage()); return response()->json(['message' => 'Could not retrieve order details.'], 500); }
    }

    public function cancel(Request $request, Order $order)
    {
         $user = $request->user();
         if (!$user || $order->profile_id !== ($user->profile->id ?? null)) {
             return response()->json(['message' => 'Not authorized to cancel this order.'], 403);
         }

        $allowedStatuses = ['pending', 'processing'];
        if (!in_array(strtolower($order->status), $allowedStatuses)) { return response()->json(['message' => 'Order cannot be cancelled at its current status: ' . $order->status], 400); }
        $order->load('orderDetails'); DB::beginTransaction();
        try {
            $order->status = 'cancelled'; $order->save();
            foreach ($order->orderDetails as $detail) { $productId = $detail->product_id; $quantityToRestore = $detail->quantity; if ($quantityToRestore <= 0) continue; $inventory = Inventory::where('product_id', $productId)->lockForUpdate()->first(); if ($inventory) { $inventory->increment('stocks', $quantityToRestore); Log::info("Stock restored for Product ID: {$productId} by {$quantityToRestore}. New stock: {$inventory->stocks}"); } else { Log::warning("Inventory record not found when trying to restore stock for Product ID: {$productId} during order cancellation (Order ID: {$order->id}). Stock not restored."); } }
            if ($order->payment) { $currentPaymentStatus = strtolower($order->payment->payment_status); if (!in_array($currentPaymentStatus, ['refunded', 'cancelled'])) { $order->payment->payment_status = 'Cancelled'; $order->payment->save(); Log::info("Payment status updated to 'Cancelled' for Order ID: {$order->id}"); } }
            if ($order->shipping && !in_array(strtolower($order->shipping->shipping_status), ['shipped', 'delivered'])) { $order->shipping->shipping_status = 'Cancelled'; $order->shipping->save(); }
            DB::commit(); Log::info('Order cancelled successfully and stock restored: ' . $order->id); $order->load(['payment','shipping']);
            return response()->json(['message' => 'Order cancelled successfully!', 'order' => $order]);
        } catch (\Exception $e) { DB::rollback(); Log::error('Error cancelling order ' . $order->id . ': ' . $e->getMessage()); $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to cancel order.'; return response()->json(['message' => $errorMessage], 500); }
    }

    public function updateStatus(Request $request, Order $order)
    {
         if ($request->user()->role_id !== 1) {
             return response()->json(['message' => 'Unauthorized.'], 403);
         }

        $validator = Validator::make($request->all(), [ 'status' => ['required','string',Rule::in(['pending', 'processing', 'shipped', 'delivered']),], ]);
        if ($validator->fails()) { return response()->json(['message' => 'Invalid status provided', 'errors' => $validator->errors()], 422); }
        $newStatus = strtolower($request->input('status')); $originalStatus = strtolower($order->status);
        if (in_array($originalStatus, ['delivered', 'completed', 'cancelled', 'return_requested'])) { return response()->json(['message' => 'Cannot change status from '.$originalStatus.' via admin update.'], 400); }
        if ($originalStatus === 'shipped' && !in_array($newStatus, ['shipped', 'delivered'])) { return response()->json(['message' => 'Shipped orders can only be marked as delivered.'], 400); }
        DB::beginTransaction();
        try {
            $order->status = $newStatus; $order->save();
            if ($order->shipping) { $newShippingStatus = $order->shipping->shipping_status; $updateShippingDate = false; if ($newStatus === 'shipped' && strtolower($order->shipping->shipping_status) !== 'shipped') { $newShippingStatus = 'Shipped'; if(is_null($order->shipping->shipping_date)) { $updateShippingDate = true; } } elseif ($newStatus === 'delivered' && strtolower($order->shipping->shipping_status) !== 'delivered') { $newShippingStatus = 'Delivered'; } if ($newShippingStatus !== $order->shipping->shipping_status || $updateShippingDate) { $order->shipping->shipping_status = $newShippingStatus; if ($updateShippingDate) { $order->shipping->shipping_date = now(); } $order->shipping->save(); } }
            DB::commit(); $order->load(['shipping', 'payment.paymentMethod']); Log::info("Admin updated status successfully for Order ID: {$order->id} to {$newStatus}");
            return response()->json(['message' => 'Order status updated successfully!', 'order' => $order], 200);
        } catch (\Exception $e) { DB::rollback(); Log::error("Failed to update status (admin) for Order ID: {$order->id}. Error: " . $e->getMessage()); return response()->json(['message' => 'Failed to update order status due to a server error.'], 500); }
    }

    public function markCompletedByUser(Request $request, Order $order)
    {
         $user = $request->user();
         if (!$user || $order->profile_id !== ($user->profile->id ?? null)) {
             return response()->json(['message' => 'Not authorized to complete this order.'], 403);
         }

        if (strtolower($order->status) !== 'delivered') { return response()->json(['message' => 'Order must be delivered to mark as completed.'], 400); }
        $order->load('orderDetails'); DB::beginTransaction();
        try {
            $order->status = 'completed'; $order->save();
            foreach ($order->orderDetails as $detail) { $productId = $detail->product_id; $quantitySold = $detail->quantity; $amountSold = $detail->quantity * $detail->price; if ($quantitySold <= 0) continue; $inventory = Inventory::where('product_id', $productId)->lockForUpdate()->first(); if ($inventory) { $inventory->increment('quantity_sold', $quantitySold); $inventory->increment('total_amount', $amountSold); Log::info("Inventory aggregates updated for Product ID: {$productId}. Qty Sold: +{$quantitySold}, Total Amount: +{$amountSold}"); } else { Log::warning("Inventory record not found when trying to update aggregates for Product ID: {$productId} during order completion (Order ID: {$order->id}). Aggregates not updated."); } }
            $codPaymentMethodId = 1;
             if ($order->payment && strtolower($order->payment->payment_status) === 'pending' && $order->payment->payment_method_id == $codPaymentMethodId) { $order->payment->payment_status = 'Paid'; $order->payment->payment_date = now(); $order->payment->save(); Log::info("COD Payment status updated to 'Paid' for Order ID: {$order->id}"); }
            DB::commit(); Log::info("Order marked as completed by user and inventory updated for Order ID: {$order->id}"); $order->load(['payment', 'orderDetails']);
            return response()->json(['message' => 'Order marked as completed!', 'order' => $order->refresh()], 200);
        } catch (\Exception $e) { DB::rollback(); Log::error("Failed to mark order as completed by user for Order ID: {$order->id}. Error: " . $e->getMessage()); return response()->json(['message' => 'Failed to update order status.'], 500); }
    }

    public function requestReturnByUser(Request $request, Order $order)
    {
        $user = $request->user();
        if (!$user || $order->profile_id !== ($user->profile->id ?? null)) {
            return response()->json(['message' => 'Not authorized to request return for this order.'], 403);
        }

        if (strtolower($order->status) !== 'delivered') { return response()->json(['message' => 'Cannot request return for non-delivered order.'], 400); }
        if (in_array(strtolower($order->status), ['return_requested', 'completed', 'cancelled'])) { return response()->json(['message' => 'Action cannot be taken on this order.'], 400); }
        DB::beginTransaction();
        try {
            $order->status = 'return_requested'; $order->save();
            if ($order->payment) { $currentPaymentStatus = strtolower($order->payment->payment_status); if (!in_array($currentPaymentStatus, ['refunded', 'cancelled', 'refund requested'])) { $order->payment->payment_status = 'Refund Requested'; $order->payment->save(); Log::info("Payment status updated to 'Refund Requested' for Order ID: {$order->id}"); } }
            DB::commit(); Log::info("Return requested by user for Order ID: {$order->id}"); $order->load('payment');
            return response()->json(['message' => 'Return request submitted!', 'order' => $order->refresh()], 200);
        } catch (\Exception $e) { DB::rollback(); Log::error("Failed to request return by user for Order ID: {$order->id}. Error: " . $e->getMessage()); return response()->json(['message' => 'Failed to submit return request.'], 500); }
    }
}