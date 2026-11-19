<?php

use App\Support\SentryScrubber;

require_once __DIR__.'/vendor/autoload.php';

$publicPath = __DIR__.'/public';
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '');
if ($uri !== '/' && is_file($publicPath.$uri)) {
    return false;
}

// artisan serve también se usa en el contenedor: nunca imprimir tokens de ruta.
$path = SentryScrubber::scrubUrl($_SERVER['REQUEST_URI']);
file_put_contents('php://stdout', sprintf("[%s] %s:%s [%s] URI: %s\n", date('D M j H:i:s Y'), $_SERVER['REMOTE_ADDR'], $_SERVER['REMOTE_PORT'], $_SERVER['REQUEST_METHOD'], $path));

require_once $publicPath.'/index.php';
