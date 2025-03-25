<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AlterWatchColorsTableChangeStatusToInteger extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Step 1: Update existing data (convert string status to integer)
        DB::table('watch_colors')
            ->where('status', 'active')
            ->update(['status' => 1]);

        DB::table('watch_colors')
            ->where('status', 'archived')
            ->update(['status' => 0]);

        // Step 2: Change the status column to tinyInteger
        Schema::table('watch_colors', function (Blueprint $table) {
            $table->tinyInteger('status')->default(1)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Step 1: Change the status column back to string
        Schema::table('watch_colors', function (Blueprint $table) {
            $table->string('status')->default('active')->change();
        });

        // Step 2: Revert the data (convert integer status back to string)
        DB::table('watch_colors')
            ->where('status', 1)
            ->update(['status' => 'active']);

        DB::table('watch_colors')
            ->where('status', 0)
            ->update(['status' => 'archived']);
    }
}