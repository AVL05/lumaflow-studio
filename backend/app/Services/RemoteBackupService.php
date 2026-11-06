<?php

namespace App\Services;

use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class RemoteBackupService
{
    public const PREFIX = 'database/';

    public function assertConfigured(): void
    {
        $config = config('filesystems.disks.backup_s3');
        foreach (['key', 'secret', 'region', 'bucket', 'endpoint'] as $key) {
            if (! is_string($config[$key] ?? null) || trim($config[$key]) === '') {
                throw new RuntimeException('Configuracion B2 incompleta.');
            }
        }
        $url = parse_url($config['endpoint']);
        if (($url['scheme'] ?? '') !== 'https'
            || ($url['host'] ?? '') !== 's3.'.$config['region'].'.backblazeb2.com'
            || isset($url['user']) || isset($url['pass']) || isset($url['query']) || isset($url['fragment'])
            || isset($url['port']) || ! in_array($url['path'] ?? '', ['', '/'], true)
            || ($config['driver'] ?? '') !== 's3' || $config['visibility'] !== 'private' || ! $config['throw']) {
            throw new RuntimeException('B2 exige endpoint HTTPS regional y disk privado.');
        }
    }

    private function disk(): FilesystemAdapter
    {
        $this->assertConfigured();

        return Storage::disk('backup_s3');
    }

    public static function recognizedName(string $name): bool
    {
        return basename($name) === $name && DataBackupService::isRecognizedBackup($name);
    }

    private static function nameFromKey(string $key): ?string
    {
        $name = substr($key, strlen(self::PREFIX));
        if (str_ends_with($name, '.sha256')) {
            $name = substr($name, 0, -7);
        }

        return str_starts_with($key, self::PREFIX) && self::recognizedName($name) ? $name : null;
    }

    // SDK/HTTP exception messages can contain credentials or signed URLs.
    private function safely(callable $operation): mixed
    {
        try {
            return $operation();
        } catch (Throwable) {
            throw new RuntimeException('Operacion de backup B2 fallida. Revise configuracion, permisos y conectividad en privado.');
        }
    }

    public function listBackups(): array
    {
        return $this->safely(function () {
            $names = [];
            foreach ($this->disk()->files(rtrim(self::PREFIX, '/')) as $key) {
                $name = self::nameFromKey($key);
                if ($name !== null && $key === self::PREFIX.$name) {
                    $names[] = $name;
                }
            }
            rsort($names);

            return $names;
        });
    }

    public function upload(string $file): array
    {
        return $this->safely(function () use ($file) {
            $name = basename($file);
            $backups = app(DataBackupService::class);
            if (! self::recognizedName($name) || ! $backups->verifyChecksum($file)) {
                throw new RuntimeException('Backup local no verificado.');
            }
            $disk = $this->disk();
            foreach ([$name, $name.'.sha256'] as $object) {
                if ($disk->exists(self::PREFIX.$object)) {
                    throw new RuntimeException('El backup remoto ya existe.');
                }
            }
            foreach ([$name, $name.'.sha256'] as $object) {
                $stream = fopen(dirname($file).DIRECTORY_SEPARATOR.$object, 'rb');
                try {
                    if ($stream === false || ! $disk->put(self::PREFIX.$object, $stream, ['visibility' => 'private'])) {
                        throw new RuntimeException('Upload fallido.');
                    }
                } finally {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }
            }
            $verified = $this->verify($name);
            if ($verified['bytes'] !== filesize($file) || ! hash_equals($verified['sha256'], $backups::sha256($file))) {
                throw new RuntimeException('El objeto remoto no coincide con el local.');
            }

            return $verified;
        });
    }

    public function verify(string $name): array
    {
        return $this->withDownloaded($name, fn ($file) => [
            'name' => $name, 'bytes' => filesize($file), 'sha256' => DataBackupService::sha256($file),
        ]);
    }

    public function withDownloaded(string $name, callable $operation): mixed
    {
        return $this->safely(function () use ($name, $operation) {
            if (! self::recognizedName($name)) {
                throw new RuntimeException('Basename remoto no permitido.');
            }
            $disk = $this->disk();
            $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'lumaflow-b2-'.bin2hex(random_bytes(16));
            if (! mkdir($dir, 0700)) {
                throw new RuntimeException('No se pudo crear temporal privado.');
            }
            $file = $dir.DIRECTORY_SEPARATOR.$name;
            try {
                foreach ([$name, $name.'.sha256'] as $object) {
                    $key = self::PREFIX.$object;
                    if (! $disk->exists($key)) {
                        throw new RuntimeException('Falta objeto o checksum.');
                    }
                    $source = $disk->readStream($key);
                    $target = fopen($dir.DIRECTORY_SEPARATOR.$object, 'xb');
                    try {
                        if (! is_resource($source) || $target === false || stream_copy_to_stream($source, $target) === false) {
                            throw new RuntimeException('Download fallido.');
                        }
                    } finally {
                        if (is_resource($source)) {
                            fclose($source);
                        }
                        if (is_resource($target)) {
                            fclose($target);
                        }
                    }
                    chmod($dir.DIRECTORY_SEPARATOR.$object, 0600);
                    if ($disk->size($key) !== filesize($dir.DIRECTORY_SEPARATOR.$object)) {
                        throw new RuntimeException('Tamano remoto incorrecto.');
                    }
                }
                if (filesize($file) === 0 || ! app(DataBackupService::class)->verifyChecksum($file)) {
                    throw new RuntimeException('Checksum remoto incorrecto.');
                }

                return $operation($file);
            } finally {
                $clean = true;
                foreach ([$file, $file.'.sha256'] as $temporary) {
                    if (is_file($temporary) && ! @unlink($temporary)) {
                        $clean = false;
                    }
                }
                if (! @rmdir($dir) || ! $clean) {
                    throw new RuntimeException('Limpieza temporal fallida.');
                }
            }
        });
    }

    public function prune(int $keepDaily, int $keepWeekly, bool $dryRun = false): array
    {
        return $this->safely(function () use ($keepDaily, $keepWeekly, $dryRun) {
            if ($keepDaily < 1 || $keepWeekly < 0) {
                throw new RuntimeException('Retencion invalida.');
            }
            $disk = $this->disk();
            $names = $this->listBackups();
            $complete = array_values(array_filter($names, fn ($name) => $disk->exists(self::PREFIX.$name.'.sha256')));
            $versions = [];
            // B2 DeleteObject by name only adds a marker. Purge exact versions.
            if ($disk instanceof AwsS3V3Adapter) {
                foreach ($disk->getClient()->getPaginator('ListObjectVersions', [
                    'Bucket' => config('filesystems.disks.backup_s3.bucket'), 'Prefix' => self::PREFIX,
                ]) as $page) {
                    foreach (['Versions', 'DeleteMarkers'] as $kind) {
                        foreach ($page[$kind] ?? [] as $version) {
                            $name = self::nameFromKey($version['Key']);
                            if ($name !== null) {
                                $names[] = $name;
                                $versions[] = [...$version, 'marker' => $kind === 'DeleteMarkers'];
                            }
                        }
                    }
                }
            }
            $names = array_values(array_unique($names));
            $deleted = array_values(array_unique([
                ...array_diff($names, $complete),
                ...DataBackupService::selectForRetention($complete, $keepDaily, $keepWeekly),
            ]));
            if (! $dryRun) {
                if ($disk instanceof AwsS3V3Adapter) {
                    $objects = [];
                    foreach ($versions as $version) {
                        if (in_array(self::nameFromKey($version['Key']), $deleted, true)
                            || ! $version['IsLatest'] || $version['marker']) {
                            $objects[] = ['Key' => $version['Key'], 'VersionId' => $version['VersionId']];
                        }
                    }
                    foreach (array_chunk($objects, 1000) as $chunk) {
                        $result = $disk->getClient()->deleteObjects([
                            'Bucket' => config('filesystems.disks.backup_s3.bucket'), 'Delete' => ['Objects' => $chunk, 'Quiet' => true],
                        ]);
                        if (! empty($result['Errors'])) {
                            throw new RuntimeException('Purge de versiones fallido.');
                        }
                    }
                } else {
                    // Filesystem fakes have no object versions.
                    foreach ($deleted as $name) {
                        if (! $disk->delete([self::PREFIX.$name, self::PREFIX.$name.'.sha256'])) {
                            throw new RuntimeException('Prune fallido.');
                        }
                    }
                }
            }

            return ['deleted' => $deleted, 'kept' => array_values(array_diff($names, $deleted))];
        });
    }
}
