<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShippingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('shippings', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->timestamp('shipping_date')->nullable(); // Shipping date might be set later
            $table->string('shipping_address');
            $table->string('shipping_method')->nullable(); // Shipping method might be optional
            $table->string('shipping_status')->default('pending'); // Default status
            $table->string('tracking_number')->nullable(); // Tracking number might be added later
            $table->timestamps(); // created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('shippings');
    }
}