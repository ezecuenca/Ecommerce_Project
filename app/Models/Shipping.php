<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipping extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipping_date',
        'shipping_address',
        'shipping_method',
        'shipping_status',
        'contact_number', 
        'tracking_number',
    ];

    protected $casts = [
        'shipping_date' => 'datetime',
    ];

  
}