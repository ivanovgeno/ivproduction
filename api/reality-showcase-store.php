<?php
declare(strict_types=1);

const IVP_REALITY_SHOWCASE_FILE = __DIR__ . '/../admin/data/reality-showcase.json';

function ivp_reality_showcase_defaults(): array
{
    $assetRoot = 'https://65d021d505.clvaw-cdnwnd.com/1c9a9ecdaf9b7ec4fb8d143d0ee9db08';
    $assetQuery = '?ph=65d021d505';
    $source = [
        ['200001273-95f3295f34', '7M3%20%2810%29.webp'],
        ['200001277-bc36cbc397', '7M3%20%281%29.webp'],
        ['200001279-566c7566c9', '7M3%20%282%29.webp'],
        ['200001276-db48edb490', '7M3%20%283%29.webp'],
        ['200001281-8872488726', '7M3%20%284%29.webp'],
        ['200001283-2281e22820', '7M3%20%285%29.webp'],
        ['200001285-dd789dd78c', '7M3%20%286%29.webp'],
        ['200001289-b9489b948b', '7M3%20%288%29.webp'],
        ['200001294-802fb802fd', '7M3%20%289%29.webp'],
        ['200001295-a1202a1204', '7M3%20%2811%29.webp'],
        ['200001296-8eb4a8eb4d', '7M3%20%2812%29.webp'],
        ['200001297-b2088b208a', '7M3%20%2813%29.webp'],
    ];
    $images = [];
    foreach ($source as $index => [$asset, $file]) {
        $number = $index + 1;
        $images[] = [
            'id' => 'reality-photo-' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            'image' => $assetRoot . '/' . $asset . '/700/' . $file . $assetQuery,
            'full' => $assetRoot . '/' . $asset . '/' . $file . $assetQuery,
            'title' => 'Realitní fotografie ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            'alt' => 'Ukázka profesionální realitní fotografie ' . $number,
        ];
    }

    return [
        'version' => 1,
        'updatedAt' => null,
        'photos' => ['enabled' => true, 'images' => $images],
        'tours' => [[
            'id' => 'matterport-sk4my8rkjob',
            'enabled' => true,
            'url' => 'https://my.matterport.com/show/?m=Sk4my8rkJoB',
            'eyebrow' => 'MATTERPORT 3D',
            'title' => 'Nemovitost otevřená zájemcům 24/7',
            'description' => 'Interaktivní prohlídka umožní projít dispozici, vnímat návaznost místností a lépe se rozhodnout ještě před osobní návštěvou.',
        ]],
    ];
}

function ivp_reality_showcase(): array
{
    $defaults = ivp_reality_showcase_defaults();
    $saved = json_decode((string) @file_get_contents(IVP_REALITY_SHOWCASE_FILE), true);
    if (!is_array($saved)) return $defaults;
    $clean = ivp_clean_reality_showcase($saved);
    return $clean ?? $defaults;
}

function ivp_reality_image_url(string $url): bool
{
    return (bool) preg_match('~^(?:https://[^\s]+|/(?:assets|images)/[A-Za-z0-9_./% -]+\.(?:webp|png|jpe?g|gif)(?:\?[^\s]*)?)$~i', $url);
}

function ivp_reality_matterport_url(string $url): bool
{
    $parts = parse_url($url);
    if (!is_array($parts) || strtolower((string) ($parts['scheme'] ?? '')) !== 'https') return false;
    if (strtolower((string) ($parts['host'] ?? '')) !== 'my.matterport.com') return false;
    if (rtrim((string) ($parts['path'] ?? ''), '/') !== '/show') return false;
    parse_str((string) ($parts['query'] ?? ''), $query);
    return isset($query['m']) && is_string($query['m']) && (bool) preg_match('/^[A-Za-z0-9_-]{5,80}$/', $query['m']);
}

function ivp_clean_reality_showcase(array $payload): ?array
{
    $photos = $payload['photos'] ?? null;
    $images = is_array($photos) ? ($photos['images'] ?? null) : null;
    $tours = $payload['tours'] ?? null;
    if (!is_array($photos) || !is_array($images) || !is_array($tours) || count($images) > 100 || count($tours) > 30) return null;

    $cleanImages = [];
    $seen = [];
    foreach ($images as $image) {
        if (!is_array($image)) return null;
        $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($image['id'] ?? '')));
        if ($id === '') $id = 'reality-photo-' . bin2hex(random_bytes(5));
        $url = trim((string) ($image['image'] ?? ''));
        $full = trim((string) ($image['full'] ?? $url));
        $title = trim((string) ($image['title'] ?? ''));
        $alt = trim((string) ($image['alt'] ?? ''));
        if (isset($seen[$id]) || strlen($id) > 90 || strlen($url) > 700 || strlen($full) > 700 || strlen($title) > 180 || strlen($alt) > 320) return null;
        if ($url === '' || $title === '' || !ivp_reality_image_url($url) || !ivp_reality_image_url($full)) return null;
        $seen[$id] = true;
        $cleanImages[] = ['id' => $id, 'image' => $url, 'full' => $full, 'title' => $title, 'alt' => $alt !== '' ? $alt : $title];
    }

    $cleanTours = [];
    $seen = [];
    foreach ($tours as $tour) {
        if (!is_array($tour)) return null;
        $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($tour['id'] ?? '')));
        if ($id === '') $id = 'matterport-' . bin2hex(random_bytes(5));
        $url = trim((string) ($tour['url'] ?? ''));
        $eyebrow = trim((string) ($tour['eyebrow'] ?? 'MATTERPORT 3D'));
        $title = trim((string) ($tour['title'] ?? ''));
        $description = trim((string) ($tour['description'] ?? ''));
        if (isset($seen[$id]) || strlen($id) > 90 || strlen($url) > 700 || strlen($eyebrow) > 80 || strlen($title) > 180 || strlen($description) > 600) return null;
        if ($url === '' || $title === '' || $description === '' || !ivp_reality_matterport_url($url)) return null;
        $seen[$id] = true;
        $cleanTours[] = ['id' => $id, 'enabled' => (bool) ($tour['enabled'] ?? false), 'url' => $url, 'eyebrow' => $eyebrow !== '' ? $eyebrow : 'MATTERPORT 3D', 'title' => $title, 'description' => $description];
    }

    return [
        'version' => max(1, (int) ($payload['version'] ?? 1)),
        'updatedAt' => $payload['updatedAt'] ?? null,
        'photos' => ['enabled' => (bool) ($photos['enabled'] ?? false), 'images' => $cleanImages],
        'tours' => $cleanTours,
    ];
}

function ivp_write_reality_showcase(array $data): bool
{
    $directory = dirname(IVP_REALITY_SHOWCASE_FILE);
    if (!is_dir($directory) && !@mkdir($directory, 0750, true) && !is_dir($directory)) return false;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temporary = IVP_REALITY_SHOWCASE_FILE . '.tmp';
    if (@file_put_contents($temporary, $json . "\n", LOCK_EX) !== false && @rename($temporary, IVP_REALITY_SHOWCASE_FILE)) return true;
    @unlink($temporary);
    return @file_put_contents(IVP_REALITY_SHOWCASE_FILE, $json . "\n", LOCK_EX) !== false;
}
