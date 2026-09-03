<?php
declare(strict_types=1);

require_once __DIR__ . '/inc/social-meta.php';

$allowed = [
    'index.html', 'svatby.html', 'reality.html', 'plesy.html', 'fotobudka.html', '360budka.html',
    'promo.html', 'reels.html', 'konference.html', 'podcast.html', 'portfolio.html', 'blog.html',
    'kontakt.html', 'ivshop.html', 'tehotenska-a-newborn-videa.html', 'ochrana-osobnich-udaju.html',
    'obchodni-podminky.html', 'marketingovy-souhlas.html',
];
$file = trim((string) ($_GET['file'] ?? 'index.html'));
if (!in_array($file, $allowed, true) || !is_file(__DIR__ . '/' . $file)) {
    http_response_code(404);
    readfile(__DIR__ . '/404.html');
    exit;
}

$route = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$html = (string) file_get_contents(__DIR__ . '/' . $file);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
echo ivp_social_apply($html, $route);
