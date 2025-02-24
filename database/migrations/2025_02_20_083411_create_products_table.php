<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('product_name');
            $table->text('description')->nullable(); // Descriptions can be long and optional
            $table->integer('stock')->default(0); // Default stock to 0
            $table->decimal('price', 10, 2); // 10 total digits, 2 decimal places
            $table->string('image_url')->nullable(); // Image URL may be optional
            $table->string('status')->default('available'); // Default status
            $table->timestamps(); // created_at and updated_at
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('color_id')->nullable();
            $table->unsignedBigInteger('wrist_measurement_id')->nullable();

            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('color_id')->references('id')->on('watch_colors')->onDelete('set null');
            $table->foreign('wrist_measurement_id')->references('id')->on('wrist_measurements')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('products');
    }
}