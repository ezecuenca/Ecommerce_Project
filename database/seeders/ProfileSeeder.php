<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProfileSeeder extends Seeder
{
    public function run()
    {
        $users = User::pluck('id')->toArray();

        $profiles = [
            [
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'suffix' => '',
                'last_name' => 'Doe',
                'age' => 30,
                'gender' => 'Male',
                'contact_no' => '1234567890',
                'user_id' => $users[array_rand($users)],
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Jane',
                'middle_name' => 'Elizabeth',
                'suffix' => '',
                'last_name' => 'Smith',
                'age' => 25,
                'gender' => 'Female',
                'contact_no' => '0987654321',
                'user_id' => $users[array_rand($users)],
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Bob',
                'middle_name' => 'Andrew',
                'suffix' => 'Jr.',
                'last_name' => 'Jones',
                'age' => 40,
                'gender' => 'Male',
                'contact_no' => '5555555555',
                'user_id' => $users[array_rand($users)],
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($profiles as $profile) {
            Profile::create($profile);
        }
    }
}