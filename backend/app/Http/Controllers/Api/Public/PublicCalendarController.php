<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\IcsFeedService;
use Illuminate\Http\Response;

class PublicCalendarController extends Controller
{
    public function __construct(private readonly IcsFeedService $ics) {}

    public function feed(string $token): Response
    {
        $user = User::query()->where('calendar_token', $token)->firstOrFail();

        return response($this->ics->build($user), 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'inline; filename="lumaflow-studio.ics"',
        ]);
    }
}
