<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'profile_id',
        'order_date',
        'status',
        'total_amount',
      //  'payment_method',
        'shipping_id',
    ];

    protected $casts = [
        'order_date' => 'datetime',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'profile_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function shipping()
    {
        return $this->belongsTo(Shipping::class); 
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}