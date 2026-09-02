<?php
declare(strict_types=1);
require __DIR__ . '/fotobudka-gallery-store.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit;
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
echo json_encode(['ok' => true, 'galleries' => ivp_booth_galleries()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
