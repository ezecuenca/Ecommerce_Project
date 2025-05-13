<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany; // Keep this import

class Profile extends Model
{
    use HasFactory;

    // Define which attributes are mass assignable.
    protected $fillable = [
        'first_name',
        'middle_name',
        'suffix',
        'last_name',
        'birthday', // <<<--- ADDED birthday
        'gender',
        'contact_no',
        'user_id', // user_id should usually be set automatically via relationship or when creating
        // Timestamps (created_at, updated_at) are typically handled automatically, no need in fillable
    ];

    /**
     * Define the relationship: A Profile belongs to a User.
     */
    public function user()
    {
        return $this->belongsTo(User::class); // Assuming default User model namespace
    }

    /**
     * Define the relationship: A Profile has many Addresses.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class); // Assuming default Address model namespace
    }

     /**
      * Define casts for attributes.
      * Optional: Cast birthday to a Carbon date object automatically.
      */
     protected $casts = [
        'birthday' => 'date:Y-m-d', // Automatically casts to Carbon instance and formats correctly on save
     ];
}