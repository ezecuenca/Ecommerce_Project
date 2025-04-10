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
            $table->id(); 
            $table->timestamp('shipping_date')->nullable(); 
            $table->string('shipping_address');
            $table->string('shipping_method')->nullable(); 
            $table->string('shipping_status')->default('pending'); 
            $table->string('contact_number')->nullable()->after('shipping_status'); 
            $table->string('tracking_number')->nullable(); 
            $table->timestamps(); 
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