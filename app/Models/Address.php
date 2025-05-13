<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * Add all columns you defined in the migration (except id, created_at, updated_at)
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'profile_id',
        'street',
        'city',
        'postal_code',
        'region',
        'country',
        'contact_no',
        'status',
        // Add 'address_type', 'is_default' here if you added them to the migration
    ];

    /**
     * Get the profile that owns the address.
     */
    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function profile() {
        return $this->belongsTo(\App\Models\Profile::class); // Adjust namespace if needed
    }
}