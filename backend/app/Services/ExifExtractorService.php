<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class ExifExtractorService
{
    public function extract(UploadedFile $file): array
    {
        $base = [
            'camera_make' => null,
            'camera_model' => null,
            'lens' => null,
            'iso' => null,
            'aperture' => null,
            'shutter_speed' => null,
            'focal_length' => null,
            'captured_at' => null,
            'orientation' => null,
            'resolution' => null,
        ];

        $dimensions = @getimagesize($file->getRealPath());
        if ($dimensions) {
            $base['resolution'] = ['width' => $dimensions[0], 'height' => $dimensions[1]];
        }

        if (! function_exists('exif_read_data')) {
            return $base;
        }

        $exif = @exif_read_data($file->getRealPath(), null, true);
        if (! is_array($exif)) {
            return $base;
        }

        $ifd0 = $exif['IFD0'] ?? [];
        $exifData = $exif['EXIF'] ?? [];

        return [
            ...$base,
            'camera_make' => $ifd0['Make'] ?? null,
            'camera_model' => $ifd0['Model'] ?? null,
            'lens' => $exifData['UndefinedTag:0xA434'] ?? $exifData['LensModel'] ?? null,
            'iso' => $exifData['ISOSpeedRatings'] ?? null,
            'aperture' => isset($exifData['FNumber']) ? $this->ratio($exifData['FNumber']) : null,
            'shutter_speed' => isset($exifData['ExposureTime']) ? $exifData['ExposureTime'].'s' : null,
            'focal_length' => isset($exifData['FocalLength']) ? $this->ratio($exifData['FocalLength']).'mm' : null,
            'captured_at' => $exifData['DateTimeOriginal'] ?? null,
            'orientation' => $ifd0['Orientation'] ?? null,
        ];
    }

    private function ratio(string|int|float $value): string|float|int
    {
        if (! is_string($value) || ! str_contains($value, '/')) {
            return $value;
        }

        [$top, $bottom] = array_map('floatval', explode('/', $value));

        return $bottom > 0 ? round($top / $bottom, 2) : $value;
    }
}
