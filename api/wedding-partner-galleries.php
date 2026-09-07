<?php
declare(strict_types=1);

require __DIR__ . '/wedding-partner-gallery-store.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

echo json_encode(
    ['ok' => true, 'settings' => ivp_wedding_partner_galleries()],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
