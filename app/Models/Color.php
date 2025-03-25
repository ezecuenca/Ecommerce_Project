<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Color extends Model
{
    use HasFactory;

    protected $table = 'watch_colors';

    protected $fillable = [
        'color_name',
        'created_at',
        'updated_at',
        'status',
    ];
}
