<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$live = $root . '/content/package-ribbons-live.json';
$seed = $root . '/content/package-ribbons.json';
$defaults = json_decode((string) @file_get_contents($seed), true);
$saved = is_file($live) ? json_decode((string) @file_get_contents($live), true) : null;
$data = is_array($defaults) ? $defaults : [];

if (is_array($saved)) {
    $data['version'] = $saved['version'] ?? ($data['version'] ?? 1);
    $data['updatedAt'] = $saved['updatedAt'] ?? ($data['updatedAt'] ?? null);
    if (isset($saved['updatedBy'])) $data['updatedBy'] = $saved['updatedBy'];
    foreach (($data['services'] ?? []) as $key => $definition) {
        $stored = $saved['services'][$key] ?? null;
        if (!is_array($stored)) continue;
        $data['services'][$key]['x'] = $stored['x'] ?? ($definition['x'] ?? 0);
        $data['services'][$key]['y'] = $stored['y'] ?? ($definition['y'] ?? 0);
        $data['services'][$key]['scale'] = $stored['scale'] ?? ($definition['scale'] ?? 1);
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

if (!is_array($data) || !isset($data['services']) || !is_array($data['services'])) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Nastavení šerp se nepodařilo načíst.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode(['ok' => true, 'settings' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
