<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

// Import related models
use App\Models\Profile;
use App\Models\Role; // Import the Role model

class User extends Authenticatable
{
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
        'status',   // Correctly added
        'role_id',  // Correctly added
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
        // Cast status to boolean since it's 0 or 1
        'status' => 'boolean',
    ];

    /**
     * Get the profile associated with the user.
     */
    public function profile()
    {
        // Assumes profiles table has user_id and Profile model exists at App\Models\Profile
        return $this->hasOne(Profile::class); // Correct: hasOne relationship
    }

    /**
     * Get the role associated with the user.
     */
    public function role()
    {
        // Assumes users table has role_id foreign key and Role model exists at App\Models\Role
        return $this->belongsTo(Role::class); // Correct: belongsTo relationship
    }
}