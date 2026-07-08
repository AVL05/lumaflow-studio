<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhotoUpdateRequest;
use App\Http\Requests\PhotoUploadRequest;
use App\Http\Resources\PhotoResource;
use App\Models\Photo;
use App\Services\ActivityLogger;
use App\Services\ExifExtractorService;
use App\Support\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoController extends Controller
{
    public function __construct(private readonly ActivityLogger $activity) {}

    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['title', 'category', 'taken_at', 'created_at'], true) ? request('sort') : 'created_at';
        $direction = request('direction') === 'asc' ? 'asc' : 'desc';

        $photos = Photo::query()
            ->ownedBy(request()->user()->id)
            ->with(['session', 'albums', 'tags'])
            ->search(request('search'))
            ->category(request('category'))
            ->when(request('session_id'), fn ($query) => $query->where('session_id', request('session_id')))
            ->when(request('album_id'), fn ($query) => $query->whereHas('albums', fn ($albums) => $albums->where('albums.id', request('album_id'))))
            ->when(request('tag_id'), fn ($query) => $query->whereHas('tags', fn ($tags) => $tags->where('tags.id', request('tag_id'))))
            ->when(request('camera'), fn ($query) => $query->where('exif->camera_model', 'like', '%'.request('camera').'%'))
            ->when(request('lens'), fn ($query) => $query->where('exif->lens', 'like', '%'.request('lens').'%'))
            ->when(request('iso'), fn ($query) => $query->where('exif->iso', request('iso')))
            ->when(request('date'), fn ($query) => $query->whereDate('taken_at', request('date')))
            ->when(request('favorites') !== null && request('favorites') !== '', fn ($query) => $query->where('is_favorite', filter_var(request('favorites'), FILTER_VALIDATE_BOOLEAN)))
            ->orderBy($sort, $direction)
            ->paginate(min((int) request('per_page', 18), 60));

        return PhotoResource::collection($photos);
    }

    public function upload(PhotoUploadRequest $request, ExifExtractorService $exifExtractor): PhotoResource
    {
        $file = $request->file('photo');
        $name = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $filename = $name.'-'.Str::random(10).'.'.$file->extension();
        $path = $file->storeAs('photos/'.request()->user()->id, $filename, 'public');
        $exif = $exifExtractor->extract($file);

        $photo = request()->user()->photos()->create([
            ...$request->safe()->except('photo', 'album_ids', 'tag_ids'),
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'exif' => $exif,
            'taken_at' => $request->validated('taken_at') ?? $this->dateFromExif($exif),
        ]);

        $photo->albums()->sync($request->input('album_ids', []));
        $photo->tags()->sync($request->input('tag_ids', []));

        AuditLog::upload($request->user()->id, $photo->id, (int) $photo->file_size, (string) $photo->mime_type);

        // El timeline se ancla en la sesion cuando existe; si no, en la propia foto.
        $this->activity->log(
            $request->user(),
            $photo->session ?? $photo,
            ActivityLogger::PHOTO_UPLOADED,
            'Foto subida: '.($photo->title ?: $photo->file_name),
            ['photo_id' => $photo->id],
        );

        return new PhotoResource($photo->load(['session', 'albums', 'tags']));
    }

    public function update(PhotoUpdateRequest $request, Photo $photo): PhotoResource
    {
        abort_unless($photo->user_id === request()->user()->id, 404);

        $photo->update($request->safe()->except('album_ids', 'tag_ids'));
        $photo->albums()->sync($request->input('album_ids', []));
        $photo->tags()->sync($request->input('tag_ids', []));

        return new PhotoResource($photo->refresh()->load(['session', 'albums', 'tags']));
    }

    public function metadata(Photo $photo): PhotoResource
    {
        abort_unless($photo->user_id === request()->user()->id, 404);

        return new PhotoResource($photo->load(['session', 'albums', 'tags']));
    }

    public function destroy(Photo $photo): mixed
    {
        abort_unless($photo->user_id === request()->user()->id, 404);
        Storage::disk('public')->delete(array_filter([$photo->file_path, $photo->thumbnail_path]));
        $photo->delete();

        return response()->noContent();
    }

    private function dateFromExif(array $exif): ?string
    {
        if (! isset($exif['captured_at'])) {
            return null;
        }

        return date('Y-m-d', strtotime($exif['captured_at'])) ?: null;
    }
}
