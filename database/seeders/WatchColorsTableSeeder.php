<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WatchColorsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Sample data for watch_colors table
        $colors = [
            [
                'color_name' => 'Red',
                'created_at' => Carbon::now()->subMonths(3),
                'updated_at' => Carbon::now()->subMonths(1),
                'status' => 1,
            ],
            [
                'color_name' => 'Green',
                'created_at' => Carbon::now()->subMonths(3),
                'updated_at' => Carbon::now()->subWeeks(2),
                'status' => 1,
            ],
            [
                'color_name' => 'White',
                'created_at' => Carbon::now()->subMonths(2),
                'updated_at' => Carbon::now()->subWeeks(1),
                'status' => 1,
            ],
           
        ];

       
        DB::table('watch_colors')->delete();


        DB::table('watch_colors')->insert($colors);
    }
}