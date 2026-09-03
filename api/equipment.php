<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$live = $root . '/content/equipment-live.json';
$seed = $root . '/content/equipment.json';
$source = is_file($live) ? $live : $seed;
$data = json_decode((string) @file_get_contents($source), true);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

if (!is_array($data) || !isset($data['categories']) || !is_array($data['categories'])) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Techniku se nepodařilo načíst.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode(['ok' => true, 'equipment' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
