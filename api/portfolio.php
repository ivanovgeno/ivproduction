<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

$path = __DIR__ . '/../portfolio-data.js';
$source = (string) @file_get_contents($path);
$items = [];
if (preg_match('/window\.IVPortfolioProjects\s*=\s*(\[.*\])\s*;/s', $source, $match)) {
    $decoded = json_decode($match[1], true);
    if (is_array($decoded)) $items = $decoded;
}

echo json_encode([
    'ok' => true,
    'items' => $items,
    'updatedAt' => @filemtime($path) ?: null,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
