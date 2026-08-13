<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OnboardingRequest extends FormRequest
{
    public const SPECIALTIES = [
        'wedding',
        'portrait',
        'family',
        'events',
        'product',
        'automotive',
        'real_estate',
        'fashion',
        'food',
        'sports',
        'other',
    ];

    public const CURRENCIES = ['EUR', 'USD', 'GBP', 'MXN', 'ARS', 'COP', 'CLP'];

    public const GOALS = [
        'organize_sessions',
        'manage_clients',
        'prepare_shoots',
        'create_quotes',
        'deliver_galleries',
        'explore_ai',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'studio_name' => ['required', 'string', 'max:120'],
            'photography_specialties' => ['required', 'array', 'min:1', 'max:5'],
            'photography_specialties.*' => ['required', 'string', 'distinct', Rule::in(self::SPECIALTIES)],
            'country' => ['required', 'string', 'size:2'],
            'currency' => ['required', 'string', Rule::in(self::CURRENCIES)],
            'onboarding_goal' => ['required', 'string', Rule::in(self::GOALS)],
        ];
    }
}
