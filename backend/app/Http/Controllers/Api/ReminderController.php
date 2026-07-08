<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReminderRequest;
use App\Http\Resources\ReminderResource;
use App\Models\Reminder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReminderController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $reminders = Reminder::query()
            ->ownedBy(request()->user()->id)
            ->search(request('search'))
            ->status(request('status'))
            ->between(request('from'), request('to'))
            ->when(request('type'), fn ($query) => $query->where('type', request('type')))
            ->orderBy('remind_date')
            ->orderByRaw('remind_time is null')
            ->orderBy('remind_time')
            ->paginate(min((int) request('per_page', 20), 60));

        return ReminderResource::collection($reminders);
    }

    public function store(ReminderRequest $request): ReminderResource
    {
        $reminder = $request->user()->reminders()->create([
            ...$request->safe()->except('remindable_type'),
            'remindable_type' => $request->morphClass(),
        ]);

        return new ReminderResource($reminder);
    }

    public function show(Reminder $reminder): ReminderResource
    {
        $this->authorizeOwnership('view', $reminder);

        return new ReminderResource($reminder);
    }

    public function update(ReminderRequest $request, Reminder $reminder): ReminderResource
    {
        $this->authorizeOwnership('update', $reminder);

        $reminder->update([
            ...$request->safe()->except('remindable_type'),
            'remindable_type' => $request->morphClass(),
        ]);

        return new ReminderResource($reminder->refresh());
    }

    public function destroy(Reminder $reminder): mixed
    {
        $this->authorizeOwnership('delete', $reminder);
        $reminder->delete();

        return response()->noContent();
    }
}
