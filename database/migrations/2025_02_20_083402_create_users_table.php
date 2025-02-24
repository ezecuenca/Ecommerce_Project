<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('username');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('status')->default('active'); // You can set a default status
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('role_id')->nullable(); // Foreign key, nullable for now

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null'); //foreign key constraint
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
}