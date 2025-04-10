<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments'; // Ensure this matches your table name

    // Add ALL columns from your 'payments' table that you want to be mass-assignable
    protected $fillable = [
        'order_id',
        'payment_method_id',
        'payment_date',
        'payment_status',
        'payment_amount',
        'card_number',       
        'cardholder_name',
        'expiration_date',
        // 'cvv',           
        'billing_address',
    ];


    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    protected $casts = [
        'payment_date' => 'datetime',
        'payment_amount' => 'decimal:2',
    ];
}