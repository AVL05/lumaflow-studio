<?php

namespace App\Http\Requests;

use App\Models\Session;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeliveryRequest extends FormRequest
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
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('workspace_id', $workspaceId)],
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->where('workspace_id', $workspaceId)],
            'version' => ['sometimes', 'integer', 'min:0', 'max:2147483646'],
            'title' => ['required', 'string', 'max:180'],
            'status' => ['required', Rule::in(['draft', 'pending', 'delivered', 'approved', 'archived'])],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'payment_status' => ['nullable', Rule::in(['pending', 'partial', 'paid'])],
            'amount_paid' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'delivery_date' => ['nullable', 'date'],
            'gallery_url' => ['nullable', ($this->route('delivery')?->gallery_url === $this->input('gallery_url') ? 'url:http,https' : 'url:https'), 'not_regex:~^https?://[^/?#]*@~i', 'max:2048'],
            'gallery_provider' => ['nullable', 'string', 'max:50'],
            'gallery_password' => ['nullable', 'string', 'max:255'],
            'gallery_expires_at' => ['nullable', 'date', ...($this->route('delivery')?->gallery_expires_at?->toDateString() === $this->input('gallery_expires_at') ? [] : ['after_or_equal:today'])],
            'private_notes' => ['nullable', 'string', 'max:3000'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $delivery = $this->route('delivery');
            $jobId = $this->route('job')?->id ?? $this->input('job_id', $delivery?->job_id);
            $sessionId = $this->input('session_id', $delivery?->session_id);
            if ($delivery && (int) $jobId === (int) $delivery->job_id && (int) $sessionId === (int) $delivery->session_id) {
                return;
            }
            if ($jobId && $sessionId) {
                $session = Session::query()->whereKey($sessionId)->first();
                if ($session?->job_id && (int) $session->job_id !== (int) $jobId) {
                    $validator->errors()->add('session_id', 'La jornada pertenece a otro proyecto.');
                }
            }
        }];
    }
}
