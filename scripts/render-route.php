<?php

declare(strict_types=1);

$route = trim((string) ($argv[1] ?? ''), '/');
$projectRoot = dirname(__DIR__);

$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = $route === '' ? '/' : '/' . $route;
$_ENV['STATIC_EXPORT'] = '1';

chdir($projectRoot);
require $projectRoot . '/index.php';
