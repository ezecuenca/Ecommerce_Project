<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category; // Import the Category model
use Carbon\Carbon;

class CategoriesTableSeeder extends Seeder
{
    public function run()
    {
        $categories = [
            [
                'category_name' => 'Men',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'status' => 1,
            ],
            [
                'category_name' => 'Women',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'status' => 1,
            ],
            [
                'category_name' => 'Unisex',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'status' => 1,
            ],
        ];

        foreach ($categories as $categoryData) {
            Category::firstOrCreate(
                ['category_name' => $categoryData['category_name']], 
                $categoryData 
            );
        }
    }
}