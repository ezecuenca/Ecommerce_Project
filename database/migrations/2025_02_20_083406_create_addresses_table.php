<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAddressesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('street');
            $table->string('country');
            $table->string('postal_code');
            $table->string('city');
            $table->string('region')->nullable(); // Region can be optional
            $table->string('contact_no')->nullable(); // Contact number can be optional
            $table->boolean('is_default')->default(false);
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('profile_id')->nullable();

            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('set null'); //foreign key constraint
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('addresses');
    }
}