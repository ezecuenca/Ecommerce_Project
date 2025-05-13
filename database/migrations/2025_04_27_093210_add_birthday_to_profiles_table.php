<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBirthdayToProfilesTable extends Migration // The class name might vary slightly based on exact command output
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Add the birthday column, make it nullable, place it after 'suffix' (optional placement)
            $table->date('birthday')->nullable()->after('suffix');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Define how to undo the change (drop the column)
            $table->dropColumn('birthday');
        });
    }
}