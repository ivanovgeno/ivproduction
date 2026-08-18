<?php
require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

const IVP_PORTFOLIO_DATA = IVP_ROOT . '/portfolio-data.js';

function ivp_youtube_embed_url(string $value): string
{
    $value = trim($value);
    if ($value === '') return '';
    if (!filter_var($value, FILTER_VALIDATE_URL)) return $value;
    $parts = parse_url($value);
    $host = strtolower((string) ($parts['host'] ?? ''));
    $path = trim((string) ($parts['path'] ?? ''), '/');
    $id = '';
    if ($host === 'youtu.be') $id = explode('/', $path)[0] ?? '';
    if (str_ends_with($host, 'youtube.com')) {
        if (str_starts_with($path, 'embed/')) $id = explode('/', substr($path, 6))[0] ?? '';
        elseif (str_starts_with($path, 'shorts/')) $id = explode('/', substr($path, 7))[0] ?? '';
        else {
            parse_str((string) ($parts['query'] ?? ''), $query);
            $id = (string) ($query['v'] ?? '');
        }
    }
    return preg_match('/^[A-Za-z0-9_-]{6,20}$/', $id) ? 'https://www.youtube-nocookie.com/embed/' . $id : $value;
}

function ivp_portfolio_projects(): array
{
    $source = (string) @file_get_contents(IVP_PORTFOLIO_DATA);
    if (preg_match('/window\\.IVPortfolioProjects\\s*=\\s*(\\[.*\\])\\s*;/s', $source, $match)) {
        $decoded = json_decode($match[1], true);
        if (is_array($decoded)) return $decoded;
    }
    return [];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ivp_json(['ok' => true, 'items' => ivp_portfolio_projects()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$items = $payload['items'] ?? null;
if (!is_array($items) || count($items) > 50) ivp_json(['ok' => false, 'error' => 'Neplatný seznam videí.'], 422);

$allowedCategories = ['svatby', 'reality', 'plesy', 'fotobudka', '360budka', 'promo', 'konference', 'podcast', 'reels'];
$clean = [];
foreach ($items as $item) {
    if (!is_array($item)) continue;
    $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($item['id'] ?? '')));
    $video = ivp_youtube_embed_url((string) ($item['video'] ?? ''));
    $image = trim((string) ($item['image'] ?? ''));
    if ($id === '' || strlen($id) > 80 || strlen($video) > 500 || strlen($image) > 500) continue;
    if ($video !== '' && !preg_match('~^(https://www\\.youtube(?:-nocookie)?\\.com/embed/[A-Za-z0-9_-]{6,20}|assets/uploads/[A-Za-z0-9._-]+\\.(?:mp4|webm))$~', $video)) continue;
    if ($image !== '' && !preg_match('~^(?:https://[^\\s]+|[A-Za-z0-9_./-]+\\.(?:webp|png|jpe?g|gif))$~i', $image)) continue;
    $clean[] = [
        'id' => $id,
        'title' => substr(trim((string) ($item['title'] ?? '')), 0, 240),
        'label' => substr(trim((string) ($item['label'] ?? '')), 0, 160),
        'categories' => array_values(array_intersect($allowedCategories, array_map('strval', (array) ($item['categories'] ?? [])))),
        'image' => $image,
        'alt' => substr(trim((string) ($item['alt'] ?? '')), 0, 400),
        'video' => $video,
    ];
}
if (count($clean) !== count($items)) ivp_json(['ok' => false, 'error' => 'Některá položka obsahuje neplatný odkaz nebo údaje.'], 422);

$json = json_encode($clean, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false || file_put_contents(IVP_PORTFOLIO_DATA . '.tmp', "window.IVPortfolioProjects = {$json};\n", LOCK_EX) === false || !rename(IVP_PORTFOLIO_DATA . '.tmp', IVP_PORTFOLIO_DATA)) {
    ivp_json(['ok' => false, 'error' => 'Videa se nepodařilo uložit.'], 500);
}
ivp_json(['ok' => true, 'message' => 'Video projekty byly uloženy.', 'items' => $clean]);
