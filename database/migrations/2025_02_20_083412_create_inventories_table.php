<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInventoriesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->integer('quantity_sold')->default(0); // Default to 0
            $table->decimal('total_amount', 10, 2)->default(0.00); // Default to 0.00
            $table->decimal('profit', 10, 2)->default(0.00); // Default to 0.00
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('product_id')->nullable();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null'); //foreign key constraint
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('inventories');
    }
}