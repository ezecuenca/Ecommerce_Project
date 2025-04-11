<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'quantity_sold',
        'total_amount',
        'status',
        'stocks',
        'created_at',
        'updated_at',
    ];
    
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}