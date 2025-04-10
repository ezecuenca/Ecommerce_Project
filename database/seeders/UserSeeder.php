<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        $users = [
            [
                'username' => 'admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
                'role_id' => 1, 
            ],
            [
                'username' => 'user1',
                'email' => 'user1@example.com',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
                'role_id' => 2, 
            ],
            [
                'username' => 'user2',
                'email' => 'user2@example.com',
                'password' => Hash::make('password123'),
                'status' => 'inactive',
                'created_at' => now(),
                'updated_at' => now(),
                'role_id' => 2, 
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}