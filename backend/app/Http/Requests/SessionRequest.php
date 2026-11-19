<?php

namespace App\Http\Requests;

use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $workspaceId = app(WorkspaceAuthorizer::class)->workspaceForRequest($this);

        return [
            'job_id' => ['nullable', Rule::exists('photography_jobs', 'id')->where('workspace_id', $workspaceId)],
            'name' => ['required', 'string', 'max:160'],
            'location_id' => ['nullable', Rule::exists('locations', 'id')->where('workspace_id', $workspaceId)],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'participants' => ['sometimes', 'array', 'list', 'max:25'],
            'participants.*' => ['array:name,role'],
            'participants.*.name' => ['required', 'string', 'max:120'],
            'participants.*.role' => ['nullable', 'string', 'max:120'],
            'incidents' => ['nullable', 'string', 'max:3000'],
            'location_name' => ['nullable', 'string', 'max:160'],
            'session_type' => ['required', Rule::in(['portrait', 'wedding', 'product', 'urban', 'landscape', 'event', 'automotive', 'nature', 'other'])],
            'status' => ['required', Rule::in(['planned', 'confirmed', 'completed', 'editing', 'delivered', 'cancelled'])],
            'description' => ['nullable', 'string', 'max:3000'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'client_name' => ['nullable', 'string', 'max:160'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->any()) {
                return;
            }
            $session = $this->route('session');
            $start = $this->input('time', $session?->time);
            $end = $this->input('end_time', $session?->end_time);
            if ($end && (! $start || substr($end, 0, 5) < substr($start, 0, 5))) {
                $validator->errors()->add('end_time', 'Indica un inicio y una hora final posterior, dentro del mismo día.');
            }
        });
    }
}
