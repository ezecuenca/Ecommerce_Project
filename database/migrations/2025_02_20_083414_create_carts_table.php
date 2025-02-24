<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->integer('quantity')->default(1); // Default quantity to 1
            $table->decimal('total_price', 10, 2); // 10 total digits, 2 decimal places
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('profile_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();

            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('set null');
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
        Schema::dropIfExists('carts');
    }
}