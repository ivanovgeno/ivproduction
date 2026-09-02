<?php
declare(strict_types=1);
require __DIR__ . '/../inc/bootstrap.php';
require IVP_ROOT . '/api/fotobudka-gallery-store.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ivp_json(['ok' => true, 'galleries' => ivp_booth_galleries()]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$clean = ivp_clean_booth_galleries(ivp_read_payload());
if ($clean === null) ivp_json(['ok' => false, 'error' => 'Některá fotografie obsahuje neplatné údaje.'], 422);
if (!$clean['photos'] || !$clean['backgrounds']) ivp_json(['ok' => false, 'error' => 'Každá galerie musí obsahovat alespoň jednu fotografii.'], 422);

if (is_file(IVP_BOOTH_GALLERY_FILE)) {
    if (!is_dir(IVP_HISTORY)) @mkdir(IVP_HISTORY, 0750, true);
    @copy(IVP_BOOTH_GALLERY_FILE, IVP_HISTORY . '/fotobudka-galerie-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json');
}
if (!ivp_write_booth_galleries($clean)) ivp_json(['ok' => false, 'error' => 'Galerie se nepodařilo uložit. Zkontrolujte práva složky admin/data.'], 500);
ivp_json(['ok' => true, 'message' => 'Galerie Fotobudky byly uloženy a jsou ihned na webu.', 'galleries' => $clean]);
