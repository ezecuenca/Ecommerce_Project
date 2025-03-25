<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WristMeasurement;

class WristMeasurementSeeder extends Seeder
{
    public function run(): void
    {
        $measurements = [
            ['measurement' => '15cm', 'status' => 1],
            ['measurement' => '16cm', 'status' => 1],
            ['measurement' => '17cm', 'status' => 1],
        ];

        foreach ($measurements as $measurement) {
            WristMeasurement::create($measurement);
        }
    }
}