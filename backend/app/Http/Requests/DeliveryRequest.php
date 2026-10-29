<?php

namespace App\Http\Requests;

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
            'client_id' => ['required', Rule::exists('clients', 'id')->where('workspace_id', $workspaceId)],
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->where('workspace_id', $workspaceId)],
            'title' => ['required', 'string', 'max:180'],
            'status' => ['required', Rule::in(['draft', 'pending', 'delivered', 'approved', 'archived'])],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'payment_status' => ['nullable', Rule::in(['pending', 'partial', 'paid'])],
            'amount_paid' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'delivery_date' => ['nullable', 'date'],
            'gallery_url' => ['nullable', 'url:http,https', 'not_regex:~^https?://[^/?#]*@~i', 'max:2048'],
            'gallery_provider' => ['nullable', 'string', 'max:50'],
            'gallery_password' => ['nullable', 'string', 'max:255'],
            'gallery_expires_at' => ['nullable', 'date', 'after_or_equal:today'],
            'private_notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
