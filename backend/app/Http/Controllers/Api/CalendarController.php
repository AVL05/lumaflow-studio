<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CalendarMoveRequest;
use App\Http\Requests\CalendarQueryRequest;
use App\Services\ActivityLogger;
use App\Services\CalendarService;
use Illuminate\Http\JsonResponse;

class CalendarController extends Controller
{
    public function __construct(
        private readonly CalendarService $calendar,
        private readonly ActivityLogger $activity,
    ) {}

    public function index(CalendarQueryRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->calendar->events(
                $request->user(),
                $request->validated('from'),
                $request->validated('to'),
                $request->validated('sources', []),
            ),
        ]);
    }

    /** Reubicacion por drag & drop desde el calendario. */
    public function move(CalendarMoveRequest $request): JsonResponse
    {
        $source = $request->validated('source');

        $model = $this->calendar->move(
            $request->user(),
            $source,
            $request->validated('source_id'),
            $request->validated('date'),
            $request->validated('time'),
        );

        $this->activity->log(
            $request->user(),
            $model,
            ActivityLogger::UPDATED,
            'Fecha modificada desde el calendario',
            ['date' => $request->validated('date'), 'time' => $request->validated('time')],
        );

        return response()->json(['source' => $source, 'source_id' => $model->getKey(), 'date' => $request->validated('date')]);
    }
}
