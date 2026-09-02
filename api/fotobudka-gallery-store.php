<?php
declare(strict_types=1);

const IVP_BOOTH_GALLERY_FILE = __DIR__ . '/../admin/data/fotobudka-galleries.json';

function ivp_booth_gallery_defaults(): array
{
    return [
        'photos' => [
            ['id' => 'photo-01', 'image' => '/assets/fotobudka/gallery-01.webp', 'title' => 'Zábava pro všechny hosty', 'alt' => 'Hosté pózující v IV Budce'],
            ['id' => 'photo-02', 'image' => '/assets/fotobudka/gallery-02.webp', 'title' => 'IV Budka na místě', 'alt' => 'IV Budka připravená na akci', 'fit' => 'contain'],
            ['id' => 'photo-03', 'image' => '/assets/fotobudka/gallery-03.webp', 'title' => 'Vzpomínka ihned do ruky', 'alt' => 'Vytištěná fotografie z fotobudky'],
            ['id' => 'photo-04', 'image' => '/assets/fotobudka/gallery-04.webp', 'title' => 'Rekvizity a originální pózy', 'alt' => 'Hosté s rekvizitami ve fotokoutku'],
            ['id' => 'photo-05', 'image' => '/assets/fotobudka/gallery-05.webp', 'title' => 'Fotografie z večerní akce', 'alt' => 'Fotografie hostů z večerní akce'],
        ],
        'backgrounds' => [
            ['id' => 'background-01', 'image' => '/assets/fotobudka/background-01.webp', 'title' => 'Stříbrné třpytky', 'alt' => 'Stříbrné třpytivé pozadí pro fotobudku'],
            ['id' => 'background-02', 'image' => '/assets/fotobudka/background-02.webp', 'title' => 'Světelná srdíčka', 'alt' => 'Světlé pozadí se srdíčky pro fotobudku'],
            ['id' => 'background-03', 'image' => '/assets/fotobudka/background-03.webp', 'title' => 'Modré třpytky', 'alt' => 'Modré třpytivé pozadí pro fotobudku'],
            ['id' => 'background-04', 'image' => '/assets/fotobudka/background-04.webp', 'title' => 'Dřevo a květiny', 'alt' => 'Dřevěná stěna s květinami pro fotobudku'],
            ['id' => 'background-05', 'image' => '/assets/fotobudka/background-05.webp', 'title' => 'Zlatá světla', 'alt' => 'Černé pozadí se zlatými světly pro fotobudku'],
            ['id' => 'background-06', 'image' => '/assets/fotobudka/background-06.webp', 'title' => 'Zlaté třpytky', 'alt' => 'Zlaté třpytivé pozadí pro fotobudku'],
        ],
    ];
}

function ivp_booth_galleries(): array
{
    $decoded = json_decode((string) @file_get_contents(IVP_BOOTH_GALLERY_FILE), true);
    if (!is_array($decoded) || !isset($decoded['photos'], $decoded['backgrounds'])) return ivp_booth_gallery_defaults();
    return $decoded;
}

function ivp_clean_booth_galleries(array $payload): ?array
{
    $clean = [];
    foreach (['photos', 'backgrounds'] as $kind) {
        $items = $payload[$kind] ?? null;
        if (!is_array($items) || count($items) > 80) return null;
        $clean[$kind] = [];
        $seen = [];
        foreach ($items as $item) {
            if (!is_array($item)) return null;
            $image = trim((string) ($item['image'] ?? ''));
            $title = trim((string) ($item['title'] ?? ''));
            $alt = trim((string) ($item['alt'] ?? ''));
            $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($item['id'] ?? '')));
            if ($id === '') $id = $kind . '-' . bin2hex(random_bytes(5));
            if (isset($seen[$id]) || $image === '' || $title === '' || strlen($id) > 90 || strlen($image) > 500 || strlen($title) > 180 || strlen($alt) > 320) return null;
            if (!preg_match('~^(?:https://[^\s]+|/(?:assets|images)/[A-Za-z0-9_./% -]+\.(?:webp|png|jpe?g|gif))$~i', $image)) return null;
            $seen[$id] = true;
            $record = ['id' => $id, 'image' => $image, 'title' => $title, 'alt' => $alt !== '' ? $alt : $title];
            if (($item['fit'] ?? '') === 'contain') $record['fit'] = 'contain';
            $clean[$kind][] = $record;
        }
    }
    return $clean;
}

function ivp_write_booth_galleries(array $data): bool
{
    $directory = dirname(IVP_BOOTH_GALLERY_FILE);
    if (!is_dir($directory) && !@mkdir($directory, 0750, true) && !is_dir($directory)) return false;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temporary = IVP_BOOTH_GALLERY_FILE . '.tmp';
    if (@file_put_contents($temporary, $json . "\n", LOCK_EX) !== false && @rename($temporary, IVP_BOOTH_GALLERY_FILE)) return true;
    @unlink($temporary);
    return @file_put_contents(IVP_BOOTH_GALLERY_FILE, $json . "\n", LOCK_EX) !== false;
}
