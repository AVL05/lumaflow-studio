<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'workspace_id', 'name', 'description', 'definition', 'revision'])]
class ProjectTemplate extends Model
{
    use BelongsToWorkspace;

    protected $attributes = ['revision' => 0];

    protected function casts(): array
    {
        return ['definition' => 'array', 'revision' => 'integer'];
    }
}
