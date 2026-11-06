<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Models\Concerns\CleansUpWorkflowRelations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable(['user_id', 'workspace_id', 'is_demo', 'client_id', 'location_id', 'title', 'specialty', 'workflow_key', 'status', 'event_date', 'description', 'budget', 'deposit_amount', 'contract_status', 'contract_url', 'contract_signed_at', 'project_type', 'participants', 'start_date', 'end_date', 'delivery_due_date', 'external_links', 'briefing', 'briefing_revision'])]
class Job extends Model
{
    use BelongsToWorkspace, CleansUpWorkflowRelations, HasFactory;

    protected $table = 'photography_jobs';

    public const STATUSES = ['lead', 'quoted', 'contract_pending', 'confirmed', 'preparation', 'shoot', 'editing', 'review', 'delivered', 'closed', 'cancelled'];

    public const CONTRACT_STATUSES = ['not_required', 'draft', 'sent', 'signed', 'declined'];

    public const PROJECT_TYPES = ['photography', 'audiovisual', 'personal'];

    protected function casts(): array
    {
        return ['event_date' => 'date', 'budget' => 'decimal:2', 'deposit_amount' => 'decimal:2', 'contract_signed_at' => 'datetime', 'participants' => 'array', 'external_links' => 'array', 'briefing' => 'array', 'briefing_revision' => 'integer', 'start_date' => 'date', 'end_date' => 'date', 'delivery_due_date' => 'date'];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($q) => $q->where(fn ($i) => $i->where('title', 'like', "%{$search}%")->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%"))));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function shots(): HasMany
    {
        return $this->hasMany(Shot::class)->orderBy('position')->orderBy('id');
    }

    public function stages(): HasMany
    {
        return $this->hasMany(PostproductionStage::class)->orderBy('position')->orderBy('id');
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function gearItems(): BelongsToMany
    {
        return $this->belongsToMany(GearItem::class)->whereExists(function ($query): void {
            $query->selectRaw('1')->from('photography_jobs as gear_job')
                ->whereColumn('gear_job.id', 'gear_item_job.job_id')
                ->whereColumn('gear_job.workspace_id', 'gear_items.workspace_id');
        });
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject')->latest();
    }

    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'job_location')->whereExists(function ($query): void {
            $query->selectRaw('1')->from('photography_jobs as location_job')
                ->whereColumn('location_job.id', 'job_location.job_id')
                ->whereColumn('location_job.workspace_id', 'locations.workspace_id');
        });
    }
}
