<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // Import BelongsTo for clarity
use Illuminate\Database\Eloquent\Relations\HasOne;   // Import HasOne for clarity
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens; // Using Passport based on your use statement

// Import related models
use App\Models\Profile;
use App\Models\Role; // Import the Role model

class User extends Authenticatable
{
    // Use HasApiTokens if using Passport, HasApiTokens from Sanctum if using Sanctum
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'status',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'status' => 'boolean',
        // 'role_id' => 'integer', // Optional cast
    ];

    /**
     * Get the profile associated with the user.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class, 'user_id', 'id');
    }

    /**
     * Get the role associated with the user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    /**
     * Check if the user has the 'admin' role.
     * Compares against the 'role_name' column in the roles table.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        // --- MODIFIED THIS LINE ---
        // Check the 'role_name' attribute instead of 'name'
        return strtolower($this->role?->role_name) === 'admin';
        // --- END MODIFICATION ---
    }
}