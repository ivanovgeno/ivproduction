<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
require IVP_ROOT . '/api/wedding-partner-gallery-store.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ivp_json(['ok' => true, 'settings' => ivp_wedding_partner_galleries()]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();

$payload = ivp_read_payload();
$payload['version'] = ((int) (ivp_wedding_partner_galleries()['version'] ?? 0)) + 1;
$clean = ivp_clean_wedding_partner_galleries($payload);
if ($clean === null) ivp_json(['ok' => false, 'error' => 'Zkontrolujte popisky obrázků. Zapnutý slider musí obsahovat alespoň jednu fotografii.'], 422);

if (is_file(IVP_WEDDING_PARTNER_GALLERY_FILE)) {
    $history = IVP_HISTORY . '/wedding-partner-galleries';
    if (!is_dir($history)) @mkdir($history, 0750, true);
    @copy(IVP_WEDDING_PARTNER_GALLERY_FILE, $history . '/galerie-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json');
}
if (!ivp_write_wedding_partner_galleries($clean)) ivp_json(['ok' => false, 'error' => 'Galerie se nepodařilo uložit.'], 500);
ivp_json(['ok' => true, 'message' => 'Svatební galerie byly uloženy a publikovány.', 'settings' => $clean]);
