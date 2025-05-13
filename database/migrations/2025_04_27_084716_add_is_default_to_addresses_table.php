<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsDefaultToAddressesTable extends Migration // Name might vary slightly
{
    public function up()
    {
        Schema::table('addresses', function (Blueprint $table) {
            // Add the column after an existing column (optional placement)
            $table->boolean('is_default')->default(false)->after('contact_no');
        });
    }

    public function down()
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropColumn('is_default'); // How to reverse the change
        });
    }
}