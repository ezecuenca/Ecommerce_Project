<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WristMeasurement extends Model
{
    protected $table = 'wrist_measurements';
    protected $fillable = ['measurement', 'status'];
    protected $dates = ['created_at', 'updated_at'];
}