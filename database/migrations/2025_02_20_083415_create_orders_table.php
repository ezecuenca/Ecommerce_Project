<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->timestamp('order_date');
            $table->string('status')->default('pending'); // Default status
            $table->decimal('total_amount', 10, 2); // 10 total digits, 2 decimal places
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('profile_id')->nullable();
            $table->unsignedBigInteger('shipping_id')->nullable();

            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('set null');
            $table->foreign('shipping_id')->references('id')->on('shippings')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('orders');
    }
}