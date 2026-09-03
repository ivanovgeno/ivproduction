<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

const IVP_EQUIPMENT = IVP_ROOT . '/content/equipment-live.json';
const IVP_EQUIPMENT_SEED = IVP_ROOT . '/content/equipment.json';
const IVP_EQUIPMENT_CATEGORIES = ['cameras', 'lenses', 'stabilization', 'audioLights'];

function ivp_equipment_data(): array
{
    $source = is_file(IVP_EQUIPMENT) ? IVP_EQUIPMENT : IVP_EQUIPMENT_SEED;
    $data = json_decode((string) @file_get_contents($source), true);
    if (!is_array($data)) return ['version' => 1, 'updatedAt' => null, 'categories' => []];
    return $data;
}

function ivp_equipment_image_is_safe(string $value): bool
{
    if ($value === '') return true;
    if (str_starts_with($value, '/') && !str_starts_with($value, '//') && !preg_match('~[\x00-\x20"\'\\<>]~', $value)) return true;
    $parts = parse_url($value);
    return filter_var($value, FILTER_VALIDATE_URL)
        && is_array($parts)
        && strtolower((string) ($parts['scheme'] ?? '')) === 'https';
}

function ivp_write_equipment(array $data): bool
{
    $history = IVP_HISTORY . '/equipment';
    if (!is_dir($history)) @mkdir($history, 0750, true);
    if (is_file(IVP_EQUIPMENT)) {
        @copy(IVP_EQUIPMENT, $history . '/equipment-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json');
        $backups = glob($history . '/equipment-*.json') ?: [];
        rsort($backups);
        foreach (array_slice($backups, 30) as $old) @unlink($old);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temporary = IVP_EQUIPMENT . '.tmp';
    if (@file_put_contents($temporary, $json . "\n", LOCK_EX) !== false && @rename($temporary, IVP_EQUIPMENT)) return true;
    @unlink($temporary);
    return @file_put_contents(IVP_EQUIPMENT, $json . "\n", LOCK_EX) !== false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ivp_json(['ok' => true, 'equipment' => ivp_equipment_data()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$categories = $payload['categories'] ?? null;
if (!is_array($categories)) ivp_json(['ok' => false, 'error' => 'Neplatná data techniky.'], 422);

$clean = [];
$ids = [];
foreach (IVP_EQUIPMENT_CATEGORIES as $category) {
    $items = $categories[$category] ?? null;
    if (!is_array($items) || count($items) > 100) ivp_json(['ok' => false, 'error' => 'Neplatná kategorie techniky.'], 422);
    $clean[$category] = [];
    foreach ($items as $item) {
        if (!is_array($item)) ivp_json(['ok' => false, 'error' => 'Neplatná položka techniky.'], 422);
        $id = preg_replace('/[^a-z0-9-]/', '', strtolower(trim((string) ($item['id'] ?? ''))));
        $name = trim((string) ($item['name'] ?? ''));
        $description = trim((string) ($item['description'] ?? ''));
        $image = trim((string) ($item['image'] ?? ''));
        $alt = trim((string) ($item['alt'] ?? ''));
        if ($id === '' || isset($ids[$id]) || strlen($id) > 90 || $name === '' || strlen($name) > 360 || strlen($description) > 2400 || strlen($alt) > 520 || !ivp_equipment_image_is_safe($image)) {
            ivp_json(['ok' => false, 'error' => 'Některá položka techniky obsahuje neplatné nebo příliš dlouhé údaje.'], 422);
        }
        $ids[$id] = true;
        $clean[$category][] = ['id' => $id, 'name' => $name, 'description' => $description, 'image' => $image, 'alt' => $alt !== '' ? $alt : $name];
    }
}

$current = ivp_equipment_data();
$data = [
    'version' => ((int) ($current['version'] ?? 0)) + 1,
    'updatedAt' => gmdate('c'),
    'updatedBy' => (string) ($_SESSION['ivp_user'] ?? 'admin'),
    'categories' => $clean,
];
if (!ivp_write_equipment($data)) ivp_json(['ok' => false, 'error' => 'Techniku se nepodařilo uložit. Zkontrolujte oprávnění složky content.'], 500);
ivp_json(['ok' => true, 'message' => 'Technika byla uložena a publikována.', 'equipment' => $data]);
