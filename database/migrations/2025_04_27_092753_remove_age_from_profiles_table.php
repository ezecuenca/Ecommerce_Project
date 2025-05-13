<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveAgeFromProfilesTable extends Migration // The class name might vary slightly based on exact command output
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Remove the 'age' column
            $table->dropColumn('age');
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
            // Define how to undo the change (re-add the column with its original definition)
            // Replace 'integer' if the original type was different (e.g., 'unsignedInteger')
            $table->integer('age')->nullable()->after('birthday'); // Or original position
        });
    }
}