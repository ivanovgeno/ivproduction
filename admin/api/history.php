<?php
require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $files = glob(IVP_HISTORY . '/content-*.json') ?: [];
    rsort($files);
    $items = array_map(static function (string $file): array {
        $data = json_decode((string) file_get_contents($file), true) ?: [];
        return ['file' => basename($file), 'date' => date('c', filemtime($file)), 'version' => $data['version'] ?? null, 'updatedBy' => $data['updatedBy'] ?? null];
    }, $files);
    ivp_json(['ok' => true, 'items' => $items]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$file = basename((string) ($payload['file'] ?? ''));
if (!preg_match('/^content-\d{8}-\d{6}-[a-f0-9]{4}\.json$/', $file)) ivp_json(['ok' => false, 'error' => 'Neplatná záloha.'], 422);
$source = IVP_HISTORY . '/' . $file;
if (!is_file($source)) ivp_json(['ok' => false, 'error' => 'Záloha neexistuje.'], 404);
$data = json_decode((string) file_get_contents($source), true);
if (!is_array($data)) ivp_json(['ok' => false, 'error' => 'Záloha je poškozená.'], 422);
$data['version'] = ((int) ($data['version'] ?? 0)) + 1;
$data['updatedAt'] = gmdate('c');
$data['updatedBy'] = (string) $_SESSION['ivp_user'];
if (!ivp_write_content($data)) ivp_json(['ok' => false, 'error' => 'Zálohu se nepodařilo obnovit.'], 500);
ivp_json(['ok' => true, 'message' => 'Záloha byla obnovena.']);
