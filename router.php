<?php

declare(strict_types=1);

$root = realpath(__DIR__);
$uri = rawurldecode((string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'));
$requestedPath = realpath(__DIR__ . $uri);

// The built-in PHP server should serve existing assets directly.
if (
    $uri !== '/'
    && $root !== false
    && $requestedPath !== false
    && str_starts_with($requestedPath, $root . DIRECTORY_SEPARATOR)
    && is_file($requestedPath)
) {
    return false;
}

require __DIR__ . '/index.php';
