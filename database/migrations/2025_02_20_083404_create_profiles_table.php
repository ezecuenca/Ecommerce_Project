<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('first_name')->nullable(); // Making these nullable is common
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->string('last_name')->nullable();
            $table->integer('age')->nullable();
            $table->text('gender')->nullable();
            $table->string('contact_no')->nullable();
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('user_id')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade'); //foreign key constraint.
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('profiles');
    }
}