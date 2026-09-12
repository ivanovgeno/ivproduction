<?php
declare(strict_types=1);

require __DIR__ . '/integrations-store.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

$settings = ivp_integrations_load();
$public = [];
foreach (($settings['providers'] ?? []) as $key => $provider) {
    if (!is_array($provider)) continue;
    $public[$key] = [
        'enabled' => (bool) ($provider['enabled'] ?? false),
        'id' => (string) ($provider['id'] ?? ''),
    ];
    if ($key === 'googleAds') $public[$key]['conversionLabel'] = (string) ($provider['conversionLabel'] ?? '');
}

echo json_encode([
    'ok' => true,
    'leadTracking' => (bool) ($settings['leadTracking'] ?? true),
    'providers' => $public,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
