<?php

declare(strict_types=1);

session_start();

$site = require __DIR__ . '/config/site.php';
require __DIR__ . '/includes/functions.php';

$route = current_path();
$route = preg_replace('/\.(php|html)$/', '', $route) ?? '';

$allowedRoutes = array_merge(
    ['', 'portfolio', 'blog', 'kontakt'],
    array_keys($site['services']),
    array_keys($site['legal'])
);

if (!in_array($route, $allowedRoutes, true)) {
    http_response_code(404);
    $route = '404';
}

$pageTitle = route_title($site, $route);
require __DIR__ . '/includes/header.php';

if ($route === '') {
    require __DIR__ . '/pages/home.php';
} elseif (isset($site['services'][$route])) {
    $service = $site['services'][$route];
    require __DIR__ . '/pages/service.php';
} elseif ($route === 'portfolio') {
    require __DIR__ . '/pages/portfolio.php';
} elseif ($route === 'blog') {
    require __DIR__ . '/pages/blog.php';
} elseif ($route === 'kontakt') {
    require __DIR__ . '/pages/contact.php';
} elseif (isset($site['legal'][$route])) {
    $legal = $site['legal'][$route];
    require __DIR__ . '/pages/legal.php';
} else {
    require __DIR__ . '/pages/404.php';
}

require __DIR__ . '/includes/footer.php';
