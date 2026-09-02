<?php
require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $content = ivp_content();
    ivp_json([
        'ok' => true,
        'pages' => ivp_pages(),
        'content' => $content,
        'storage' => ivp_storage_status(),
        'csrf' => ivp_csrf(),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$page = (string) ($payload['page'] ?? '');
$mode = (string) ($payload['mode'] ?? 'replace');
$records = $payload['records'] ?? null;
if (!ivp_valid_page($page) || !is_array($records)) ivp_json(['ok' => false, 'error' => 'Neplatná stránka nebo data.'], 422);
if (!in_array($mode, ['replace', 'patch'], true)) ivp_json(['ok' => false, 'error' => 'Neplatný režim uložení.'], 422);
if (count($records) > 1200) ivp_json(['ok' => false, 'error' => 'Příliš mnoho položek.'], 422);

$allowedProperties = ['text-node', 'href', 'src', 'alt', 'poster', 'data-video', 'content', 'title', 'placeholder', 'json-ld', 'style-background-image', 'css-var'];
$clean = [];
foreach ($records as $record) {
    if (!is_array($record)) continue;
    $selector = trim((string) ($record['selector'] ?? ''));
    $property = (string) ($record['property'] ?? '');
    $value = (string) ($record['value'] ?? '');
    $node = max(0, min(30, (int) ($record['node'] ?? 0)));
    if ($selector === '' || strlen($selector) > 600 || !in_array($property, $allowedProperties, true) || strlen($value) > 20000) continue;
    if (in_array($property, ['style-background-image', 'css-var'], true)
        && $value !== ''
        && !preg_match('~^(?:https://|/)?[a-zA-Z0-9][a-zA-Z0-9_./%?&=:+~-]*$~D', $value)) continue;
    $item = ['selector' => $selector, 'property' => $property, 'value' => $value];
    if ($property === 'text-node' || $property === 'json-ld') $item['node'] = $node;
    if ($property === 'css-var') {
        $styleName = (string) ($record['styleName'] ?? '');
        if ($styleName !== '--hero-image') continue;
        $item['styleName'] = $styleName;
    }
    $clean[] = $item;
}

if (!ivp_sync_static_seo($page, $clean)) {
    ivp_json(['ok' => false, 'error' => 'SEO údaje se nepodařilo zapsat přímo do HTML stránky.'], 500);
}

$data = ivp_content();
$data['version'] = ((int) ($data['version'] ?? 0)) + 1;
$data['updatedAt'] = gmdate('c');
$data['updatedBy'] = (string) $_SESSION['ivp_user'];
if ($mode === 'patch') {
    $recordKey = static function (array $record): string {
        return implode('|', [
            (string) ($record['selector'] ?? ''),
            (string) ($record['property'] ?? ''),
            (string) ($record['node'] ?? ''),
            (string) ($record['styleName'] ?? ''),
        ]);
    };
    $merged = [];
    foreach (($data['pages'][$page] ?? []) as $existing) {
        if (is_array($existing)) $merged[$recordKey($existing)] = $existing;
    }
    foreach ($clean as $item) $merged[$recordKey($item)] = $item;
    $data['pages'][$page] = array_values($merged);
} else {
    $data['pages'][$page] = array_values($clean);
}
if (!ivp_write_content($data)) ivp_json(['ok' => false, 'error' => 'Obsah se nepodařilo uložit. Zkontrolujte oprávnění složky content.'], 500);
ivp_json(['ok' => true, 'message' => 'Změny byly publikovány.', 'updatedAt' => $data['updatedAt'], 'version' => $data['version']]);
