<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrderDetailsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('order_details', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->integer('quantity');
            $table->decimal('price', 10, 2); // 10 total digits, 2 decimal places
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('order_details');
    }
}