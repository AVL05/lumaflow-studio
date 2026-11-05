<?php

namespace App\Http\Requests;

use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeliveryReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->route('delivery')) {
            app(WorkspaceAuthorizer::class)->requireAccessOr404($this->user(), $this->route('delivery'));
        }

        return true;
    }

    public function rules(): array
    {
        $publish = $this->route()->getActionMethod() === 'publish';
        $portal = $this->route()->getActionMethod() === 'portal';

        return [
            'version' => [$publish || $portal ? 'required' : 'sometimes', 'integer', 'min:0', 'max:2147483646'],
            'revision_number' => ['sometimes', 'integer', 'min:1', 'max:2147483647'],
            'request_id' => [$publish || $this->route('action') === 'comment' ? 'required' : 'sometimes', 'uuid'],
            'message' => [in_array($this->route('action'), ['comment', 'request-changes'], true) ? 'required' : 'sometimes', 'string', 'max:2000'],
            'gallery_url' => [$publish ? 'required' : 'sometimes', 'url:https', 'not_regex:~^https://[^/?#]*@~i', 'max:2048'],
            'gallery_provider' => ['nullable', 'string', 'max:50'],
            'gallery_password' => ['nullable', 'string', 'max:255'],
            'delivery_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'action' => [$portal ? 'required' : 'sometimes', Rule::in(['revoke', 'rotate', 'expiry'])],
            'expires_on' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
