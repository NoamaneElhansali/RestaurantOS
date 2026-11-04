<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->isMethod('post') || (
            $this->attributes->has('tenant_restaurant')
            && Gate::allows('update', $this->attributes->get('tenant_restaurant'))
        );
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'min:2', 'max:160']];
    }
}
