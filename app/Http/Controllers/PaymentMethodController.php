<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentMethodController extends Controller
{
    public function index()
    {
        try {
            // Fetch methods, select necessary columns
            // REMOVED ->where('status', 1) assuming no status column
            $methods = PaymentMethod::select('id', 'method_name')
                                    ->get();

            return response()->json($methods);

        } catch (\Exception $e) {
            Log::error('Error fetching payment methods: '.$e->getMessage());
            $errorMessage = config('app.debug') ? $e->getMessage() : 'Failed to retrieve payment methods';
            return response()->json(['message' => $errorMessage], 500);
        }
    }
}