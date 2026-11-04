<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_super_admin')->default(false);
        });

        Schema::create('restaurants', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160);
            $table->string('slug', 180)->unique();
            $table->timestamps();
        });

        Schema::create('restaurant_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 32);
            $table->timestamps();
            $table->unique(['restaurant_id', 'user_id']);
        });

        DB::statement("ALTER TABLE restaurant_memberships ADD CONSTRAINT restaurant_memberships_role_check CHECK (role IN ('owner', 'manager', 'waiter', 'kitchen_staff', 'menu_editor'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_memberships');
        Schema::dropIfExists('restaurants');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('is_super_admin'));
    }
};
