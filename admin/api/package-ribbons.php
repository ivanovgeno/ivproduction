<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

const IVP_RIBBON_LIVE = IVP_ROOT . '/content/package-ribbons-live.json';
const IVP_RIBBON_SEED = IVP_ROOT . '/content/package-ribbons.json';

function ivp_ribbon_settings(): array
{
    $defaults = json_decode((string) @file_get_contents(IVP_RIBBON_SEED), true);
    if (!is_array($defaults)) return ['version' => 1, 'updatedAt' => null, 'services' => []];
    if (!is_file(IVP_RIBBON_LIVE)) return $defaults;
    $saved = json_decode((string) @file_get_contents(IVP_RIBBON_LIVE), true);
    if (!is_array($saved)) return $defaults;

    $defaults['version'] = $saved['version'] ?? ($defaults['version'] ?? 1);
    $defaults['updatedAt'] = $saved['updatedAt'] ?? ($defaults['updatedAt'] ?? null);
    if (isset($saved['updatedBy'])) $defaults['updatedBy'] = $saved['updatedBy'];
    foreach (($defaults['services'] ?? []) as $key => $definition) {
        $stored = $saved['services'][$key] ?? null;
        if (!is_array($stored)) continue;
        $defaults['services'][$key]['x'] = $stored['x'] ?? ($definition['x'] ?? 0);
        $defaults['services'][$key]['y'] = $stored['y'] ?? ($definition['y'] ?? 0);
        $defaults['services'][$key]['scale'] = $stored['scale'] ?? ($definition['scale'] ?? 1);
    }
    return $defaults;
}

function ivp_write_ribbon_settings(array $data): bool
{
    $history = IVP_HISTORY . '/package-ribbons';
    if (!is_dir($history)) @mkdir($history, 0750, true);
    if (is_file(IVP_RIBBON_LIVE)) {
        @copy(IVP_RIBBON_LIVE, $history . '/package-ribbons-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json');
        $backups = glob($history . '/package-ribbons-*.json') ?: [];
        rsort($backups);
        foreach (array_slice($backups, 30) as $old) @unlink($old);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temporary = IVP_RIBBON_LIVE . '.tmp';
    if (@file_put_contents($temporary, $json . "\n", LOCK_EX) !== false && @rename($temporary, IVP_RIBBON_LIVE)) return true;
    @unlink($temporary);
    return @file_put_contents(IVP_RIBBON_LIVE, $json . "\n", LOCK_EX) !== false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $defaults = json_decode((string) @file_get_contents(IVP_RIBBON_SEED), true);
    ivp_json(['ok' => true, 'settings' => ivp_ribbon_settings(), 'defaults' => is_array($defaults) ? $defaults : ['services' => []]]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$incoming = $payload['services'] ?? null;
$seed = json_decode((string) @file_get_contents(IVP_RIBBON_SEED), true);
$definitions = is_array($seed['services'] ?? null) ? $seed['services'] : [];
if (!is_array($incoming) || !$definitions) ivp_json(['ok' => false, 'error' => 'Neplatná data nastavení šerp.'], 422);

$services = [];
foreach ($definitions as $key => $definition) {
    $item = $incoming[$key] ?? null;
    if (!is_array($item)) ivp_json(['ok' => false, 'error' => 'Chybí nastavení některé šerpy.'], 422);
    $x = filter_var($item['x'] ?? null, FILTER_VALIDATE_INT);
    $y = filter_var($item['y'] ?? null, FILTER_VALIDATE_INT);
    $scale = filter_var($item['scale'] ?? null, FILTER_VALIDATE_FLOAT);
    if ($x === false || $y === false || $scale === false || $x < -60 || $x > 60 || $y < -60 || $y > 60 || $scale < 0.5 || $scale > 2) {
        ivp_json(['ok' => false, 'error' => 'Posun musí být od −60 do 60 px a velikost od 50 do 200 %.'], 422);
    }
    $services[$key] = [
        'label' => (string) ($definition['label'] ?? $key),
        'ribbonLabel' => (string) ($definition['ribbonLabel'] ?? ''),
        'x' => (int) $x,
        'y' => (int) $y,
        'scale' => round((float) $scale, 2),
    ];
}

$current = ivp_ribbon_settings();
$data = [
    'version' => ((int) ($current['version'] ?? 0)) + 1,
    'updatedAt' => gmdate('c'),
    'updatedBy' => (string) ($_SESSION['ivp_user'] ?? 'admin'),
    'services' => $services,
];
if (!ivp_write_ribbon_settings($data)) ivp_json(['ok' => false, 'error' => 'Nastavení šerp se nepodařilo uložit.'], 500);
ivp_json(['ok' => true, 'message' => 'Nastavení šerp bylo uloženo a publikováno.', 'settings' => $data]);
