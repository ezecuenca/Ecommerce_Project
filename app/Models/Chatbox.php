<?php

namespace App\Models; // Or App\Models if that's your structure

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Profile; // Make sure Profile model namespace is correct

class Chatbox extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * Needs to be explicitly set because the table name is singular.
     *
     * @var string
     */
    protected $table = 'chatbox'; // <--- THIS IS THE CRITICAL LINE

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'profile_id',
        'sender_type',
        'message_text',
        'image',
        // 'is_read', // Usually not fillable directly
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the profile that owns the chat message.
     */
    public function profile(): BelongsTo
    {
        // Links chatbox.profile_id to profiles.id
        return $this->belongsTo(Profile::class, 'profile_id', 'id');
    }
}