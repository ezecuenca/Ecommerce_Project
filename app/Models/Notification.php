<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * If your table name is exactly 'notifications' (plural of the model name),
     * you don't strictly need this, but it's good for clarity.
     *
     * @var string
     */
    protected $table = 'notifications';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'profile_id',       // Foreign key to profiles table
        'message',
        'notification_type',
        'is_read',
        // created_at and updated_at are handled automatically by Eloquent if timestamps are enabled
    ];

    /**
     * The attributes that should be cast.
     * Casting 'is_read' to boolean is helpful.
     *
     * @var array
     */
    protected $casts = [
        'is_read' => 'boolean', // Will convert 0 to false, 1 to true, and vice-versa
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the profile that this notification belongs to.
     * This defines the inverse of a HasMany relationship if Profile hasMany Notifications.
     */
    public function profile()
    {
        // Assumes your Profile model exists and is in App\Models
        return $this->belongsTo(Profile::class, 'profile_id');
    }

    // If you want to disable timestamps (created_at, updated_at) for this model:
    // public $timestamps = false;
    // But your table screenshot shows them, so keep them enabled by default.
}