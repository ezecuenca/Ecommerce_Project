<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id(); 
            $table->timestamp('payment_date');
            $table->string('payment_status')->default('pending'); 
            $table->decimal('payment_amount', 10, 2);
            $table->string('card_number')->nullable(); 
            $table->string('cardholder_name')->nullable();
            $table->string('expiration_date')->nullable();
           // $table->string('cvv')->nullable();
            $table->string('billing_address')->nullable();
            $table->timestamps(); 
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('payment_method_id')->nullable();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('payments');
    }
}