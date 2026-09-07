<?php
declare(strict_types=1);

const IVP_WEDDING_PARTNER_GALLERY_FILE = __DIR__ . '/../admin/data/wedding-partner-galleries.json';

function ivp_wedding_partner_gallery_defaults(): array
{
    return [
        'version' => 1,
        'updatedAt' => null,
        'galleries' => [
            'marek-kyncl' => [
                'name' => 'Marek Kyncl Fotograf',
                'kind' => 'photographer',
                'credit' => 'Foto: Marek Kyncl',
                'enabled' => false,
                'images' => [],
            ],
            'scholz' => [
                'name' => 'Scholz foto a video',
                'kind' => 'photographer',
                'credit' => 'Foto: Scholz foto a video',
                'enabled' => false,
                'images' => [],
            ],
            'duhohratky' => [
                'name' => 'Duhohrátky',
                'kind' => 'service',
                'credit' => 'Realizace: Duhohrátky',
                'enabled' => false,
                'images' => [],
            ],
        ],
    ];
}

function ivp_wedding_partner_galleries(): array
{
    $defaults = ivp_wedding_partner_gallery_defaults();
    $saved = json_decode((string) @file_get_contents(IVP_WEDDING_PARTNER_GALLERY_FILE), true);
    if (!is_array($saved)) return $defaults;
    $defaults['version'] = (int) ($saved['version'] ?? 1);
    $defaults['updatedAt'] = $saved['updatedAt'] ?? null;
    foreach ($defaults['galleries'] as $key => $definition) {
        $stored = $saved['galleries'][$key] ?? null;
        if (!is_array($stored)) continue;
        $defaults['galleries'][$key]['enabled'] = (bool) ($stored['enabled'] ?? false);
        $defaults['galleries'][$key]['images'] = is_array($stored['images'] ?? null) ? $stored['images'] : [];
    }
    return $defaults;
}

function ivp_clean_wedding_partner_galleries(array $payload): ?array
{
    $defaults = ivp_wedding_partner_gallery_defaults();
    $incoming = $payload['galleries'] ?? null;
    if (!is_array($incoming)) return null;
    $clean = [];
    foreach ($defaults['galleries'] as $key => $definition) {
        $gallery = $incoming[$key] ?? null;
        if (!is_array($gallery)) return null;
        $images = $gallery['images'] ?? null;
        if (!is_array($images) || count($images) > 80) return null;
        $cleanImages = [];
        $seen = [];
        foreach ($images as $image) {
            if (!is_array($image)) return null;
            $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($image['id'] ?? '')));
            if ($id === '') $id = $key . '-' . bin2hex(random_bytes(5));
            $url = trim((string) ($image['image'] ?? ''));
            $title = trim((string) ($image['title'] ?? ''));
            $alt = trim((string) ($image['alt'] ?? ''));
            if (isset($seen[$id]) || $url === '' || $title === '' || strlen($id) > 90 || strlen($url) > 500 || strlen($title) > 180 || strlen($alt) > 320) return null;
            if (!preg_match('~^(?:https://[^\s]+|/(?:assets|images)/[A-Za-z0-9_./% -]+\.(?:webp|png|jpe?g|gif))$~i', $url)) return null;
            $seen[$id] = true;
            $cleanImages[] = ['id' => $id, 'image' => $url, 'title' => $title, 'alt' => $alt !== '' ? $alt : $title];
        }
        $enabled = (bool) ($gallery['enabled'] ?? false);
        if ($enabled && !$cleanImages) return null;
        $clean[$key] = $definition;
        $clean[$key]['enabled'] = $enabled;
        $clean[$key]['images'] = $cleanImages;
    }
    return [
        'version' => max(1, (int) ($payload['version'] ?? 1)),
        'updatedAt' => gmdate('c'),
        'galleries' => $clean,
    ];
}

function ivp_write_wedding_partner_galleries(array $data): bool
{
    $directory = dirname(IVP_WEDDING_PARTNER_GALLERY_FILE);
    if (!is_dir($directory) && !@mkdir($directory, 0750, true) && !is_dir($directory)) return false;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temporary = IVP_WEDDING_PARTNER_GALLERY_FILE . '.tmp';
    if (@file_put_contents($temporary, $json . "\n", LOCK_EX) !== false && @rename($temporary, IVP_WEDDING_PARTNER_GALLERY_FILE)) return true;
    @unlink($temporary);
    return @file_put_contents(IVP_WEDDING_PARTNER_GALLERY_FILE, $json . "\n", LOCK_EX) !== false;
}
