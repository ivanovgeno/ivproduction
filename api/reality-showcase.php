<?php
declare(strict_types=1);

require __DIR__ . '/reality-showcase-store.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

echo json_encode(['ok' => true, 'settings' => ivp_reality_showcase()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
