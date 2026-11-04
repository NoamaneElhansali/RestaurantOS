<?php

namespace App\Enums;

enum RestaurantRole: string
{
    case Owner = 'owner';
    case Manager = 'manager';
    case Waiter = 'waiter';
    case KitchenStaff = 'kitchen_staff';
    case MenuEditor = 'menu_editor';

    public function can(string $ability): bool
    {
        return match ($ability) {
            'view' => true,
            'update' => in_array($this, [self::Owner, self::Manager], true),
            'manage_members' => $this === self::Owner,
            'edit_menu' => in_array($this, [self::Owner, self::Manager, self::MenuEditor], true),
            'serve' => in_array($this, [self::Owner, self::Manager, self::Waiter], true),
            'kitchen' => in_array($this, [self::Owner, self::Manager, self::KitchenStaff], true),
            default => false,
        };
    }
}
