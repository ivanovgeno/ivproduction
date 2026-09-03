<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
require_once IVP_ROOT . '/inc/social-meta.php';
require_once IVP_ROOT . '/api/blog-store.php';
ivp_require_auth(true);

/** @return array<string,array{label:string,file:?string,defaults:array<string,string>}> */
function ivp_social_catalog(): array
{
    $static = [
        '/' => ['Homepage', 'index.html'],
        '/svatby/' => ['Svatby', 'svatby.html'],
        '/reality/' => ['Reality', 'reality.html'],
        '/plesy/' => ['Plesy', 'plesy.html'],
        '/ivbudka/' => ['Fotobudka', 'fotobudka.html'],
        '/ivbudka360/' => ['360° Budka', '360budka.html'],
        '/aftermovie-promo-hudebniklipy/' => ['Aftermovie & promo', 'promo.html'],
        '/reels/' => ['Reels', 'reels.html'],
        '/konference/' => ['Konference', 'konference.html'],
        '/podcast/' => ['Podcast', 'podcast.html'],
        '/ukazky/' => ['Portfolio', 'portfolio.html'],
        '/svatebni-blog/' => ['Blog', 'blog.html'],
        '/kontakt/' => ['Kontakt', 'kontakt.html'],
        '/ivshop/' => ['IV shop', 'ivshop.html'],
        '/tehotenska-a-newborn-videa/' => ['Těhotenská a newborn videa', 'tehotenska-a-newborn-videa.html'],
        '/ochrana-osobnich-udaju/' => ['Ochrana osobních údajů', 'ochrana-osobnich-udaju.html'],
        '/obchodni-podminky/' => ['Obchodní podmínky', 'obchodni-podminky.html'],
        '/marketingovy-souhlas/' => ['Marketingový souhlas', 'marketingovy-souhlas.html'],
    ];
    $catalog = [];
    foreach ($static as $route => [$label, $file]) {
        $html = (string) @file_get_contents(IVP_ROOT . '/' . $file);
        $catalog[$route] = ['label' => $label, 'file' => $file, 'defaults' => ivp_social_defaults_from_html($html)];
    }
    foreach (ivp_blog_load()['posts'] as $post) {
        if (($post['status'] ?? 'draft') !== 'published') continue;
        $route = ivp_blog_public_path($post);
        $image = (string) ($post['image'] ?? '');
        $catalog[$route] = [
            'label' => 'Článek · ' . (string) ($post['title'] ?? 'Bez názvu'),
            'file' => null,
            'defaults' => [
                'title' => (string) ($post['title'] ?? ''),
                'description' => (string) ($post['metaDescription'] ?? $post['excerpt'] ?? ''),
                'image' => $image,
                'imageAlt' => (string) ($post['imageAlt'] ?? $post['title'] ?? ''),
            ],
        ];
    }
    return $catalog;
}

function ivp_social_runtime_data(): array
{
    $decoded = is_file(IVP_SOCIAL_META_DATA) ? json_decode((string) @file_get_contents(IVP_SOCIAL_META_DATA), true) : null;
    return is_array($decoded) && is_array($decoded['items'] ?? null)
        ? $decoded
        : ['version' => 1, 'updatedAt' => null, 'items' => []];
}

$catalog = ivp_social_catalog();
$effective = ivp_social_load();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $seed = json_decode((string) @file_get_contents(IVP_SOCIAL_META_SEED), true);
    $seedItems = is_array($seed['items'] ?? null) ? $seed['items'] : [];
    $runtime = ivp_social_runtime_data();
    $items = [];
    foreach ($catalog as $route => $page) {
        $recommended = array_replace($page['defaults'], $seedItems[$route] ?? []);
        $current = array_replace($recommended, $runtime['items'][$route] ?? []);
        $current['image'] = (string) ($current['image'] ?? '');
        $items[] = [
            'key' => $route,
            'label' => $page['label'],
            'url' => 'https://www.ivproduction.cz' . $route,
            'defaults' => $page['defaults'],
            'recommended' => $recommended,
            'current' => $current,
            'customized' => isset($runtime['items'][$route]),
        ];
    }
    ivp_json(['ok' => true, 'items' => $items, 'updatedAt' => $effective['updatedAt']]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$key = (string) ($payload['key'] ?? '');
if (!isset($catalog[$key])) ivp_json(['ok' => false, 'error' => 'Vybraná stránka není platná.'], 422);

$title = mb_substr(trim((string) ($payload['title'] ?? '')), 0, 110, 'UTF-8');
$description = mb_substr(trim((string) ($payload['description'] ?? '')), 0, 240, 'UTF-8');
$image = trim((string) ($payload['image'] ?? ''));
$imageAlt = mb_substr(trim((string) ($payload['imageAlt'] ?? $title)), 0, 220, 'UTF-8');
if ($title === '' || $description === '' || $image === '') {
    ivp_json(['ok' => false, 'error' => 'Vyplňte titulek, popis a obrázek sociální karty.'], 422);
}
$isLocalImage = preg_match('~^/(?:assets|images|partners)/[A-Za-z0-9._/-]+\.(?:webp|png|jpe?g|gif)$~i', $image);
$parts = parse_url($image);
$isHttpsImage = filter_var($image, FILTER_VALIDATE_URL) && strtolower((string) ($parts['scheme'] ?? '')) === 'https';
if (!$isLocalImage && !$isHttpsImage) ivp_json(['ok' => false, 'error' => 'Obrázek musí být z Médií nebo platná HTTPS adresa.'], 422);

$runtime = ivp_social_runtime_data();
$runtime['items'][$key] = ['title' => $title, 'description' => $description, 'image' => $image, 'imageAlt' => $imageAlt];
$runtime['version'] = ((int) ($runtime['version'] ?? 1)) + 1;
$runtime['updatedAt'] = gmdate('c');
if (!ivp_social_write($runtime)) ivp_json(['ok' => false, 'error' => 'Nastavení sdílení se nepodařilo uložit. Zkontrolujte oprávnění složky content.'], 500);

ivp_json([
    'ok' => true,
    'message' => 'Náhled pro sociální sítě byl publikován.',
    'item' => ['key' => $key, 'title' => $title, 'description' => $description, 'image' => $image, 'imageAlt' => $imageAlt],
    'updatedAt' => $runtime['updatedAt'],
]);
