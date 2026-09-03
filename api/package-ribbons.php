<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$live = $root . '/content/package-ribbons-live.json';
$seed = $root . '/content/package-ribbons.json';
$source = is_file($live) ? $live : $seed;
$data = json_decode((string) @file_get_contents($source), true);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

if (!is_array($data) || !isset($data['services']) || !is_array($data['services'])) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Nastavení šerp se nepodařilo načíst.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode(['ok' => true, 'settings' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
