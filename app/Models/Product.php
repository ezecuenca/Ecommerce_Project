<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_name',
        'description',
        'stock',
        'price',
        'image_url',
        'status',
        'category_id',
        'color_id',
        'wrist_measurement_id',
        'created_at',
        'updated_at',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function color()
    {
        return $this->belongsTo(Color::class, 'color_id');
    }

    public function wristMeasurement()
    {
        return $this->belongsTo(WristMeasurement::class, 'wrist_measurement_id');
    }
}