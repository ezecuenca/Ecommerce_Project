<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $table = 'payment_methods'; // Specify the table name
    protected $fillable = ['method_name']; // Allow mass assignment for method_name
    public $timestamps = true; // Enable timestamps (created_at, updated_at)
}