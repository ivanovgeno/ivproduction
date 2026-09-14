<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
require IVP_ROOT . '/api/reality-showcase-store.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ivp_json(['ok' => true, 'settings' => ivp_reality_showcase()]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();

$payload = ivp_read_payload();
$payload['version'] = ((int) (ivp_reality_showcase()['version'] ?? 0)) + 1;
$payload['updatedAt'] = gmdate('c');
$clean = ivp_clean_reality_showcase($payload);
if ($clean === null) ivp_json(['ok' => false, 'error' => 'Zkontrolujte fotografie, popisky a Matterport odkazy.'], 422);
if (($clean['photos']['enabled'] ?? false) && empty($clean['photos']['images'])) {
    ivp_json(['ok' => false, 'error' => 'Zapnutý slider musí obsahovat alespoň jednu fotografii.'], 422);
}

if (is_file(IVP_REALITY_SHOWCASE_FILE)) {
    $history = IVP_HISTORY . '/reality-showcase';
    if (!is_dir($history)) @mkdir($history, 0750, true);
    @copy(IVP_REALITY_SHOWCASE_FILE, $history . '/reality-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json');
}
if (!ivp_write_reality_showcase($clean)) ivp_json(['ok' => false, 'error' => 'Realitní galerie se nepodařilo uložit.'], 500);
ivp_json(['ok' => true, 'message' => 'Realitní fotografie a Matterport prohlídky byly publikovány.', 'settings' => $clean]);
