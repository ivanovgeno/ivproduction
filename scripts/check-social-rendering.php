<?php
declare(strict_types=1);

require_once __DIR__ . '/../inc/social-meta.php';

$files = [
    '/' => 'index.html',
    '/svatby/' => 'svatby.html',
    '/reality/' => 'reality.html',
    '/plesy/' => 'plesy.html',
    '/ivbudka/' => 'fotobudka.html',
    '/ivbudka360/' => '360budka.html',
    '/aftermovie-promo-hudebniklipy/' => 'promo.html',
    '/reels/' => 'reels.html',
    '/konference/' => 'konference.html',
    '/podcast/' => 'podcast.html',
    '/ukazky/' => 'portfolio.html',
    '/svatebni-blog/' => 'blog.html',
    '/kontakt/' => 'kontakt.html',
    '/ivshop/' => 'ivshop.html',
    '/tehotenska-a-newborn-videa/' => 'tehotenska-a-newborn-videa.html',
    '/ochrana-osobnich-udaju/' => 'ochrana-osobnich-udaju.html',
    '/obchodni-podminky/' => 'obchodni-podminky.html',
    '/marketingovy-souhlas/' => 'marketingovy-souhlas.html',
];
$expected = ivp_social_load()['items'];
$errors = [];

foreach ($files as $route => $file) {
    $html = ivp_social_apply((string) file_get_contents(__DIR__ . '/../' . $file), $route);
    $document = new DOMDocument('1.0', 'UTF-8');
    $previous = libxml_use_internal_errors(true);
    $document->loadHTML($html, LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    $xpath = new DOMXPath($document);
    $meta = static function (DOMXPath $xpath, string $attribute, string $key): string {
        $nodes = $xpath->query('//meta[@' . $attribute . '="' . $key . '"]');
        return $nodes && $nodes->length === 1 && $nodes->item(0) instanceof DOMElement
            ? $nodes->item(0)->getAttribute('content')
            : '';
    };
    $item = $expected[$route] ?? [];
    $checks = [
        'og:title' => [$meta($xpath, 'property', 'og:title'), (string) ($item['title'] ?? '')],
        'og:description' => [$meta($xpath, 'property', 'og:description'), (string) ($item['description'] ?? '')],
        'og:image' => [$meta($xpath, 'property', 'og:image'), ivp_social_absolute_image((string) ($item['image'] ?? ''))],
        'og:url' => [$meta($xpath, 'property', 'og:url'), 'https://www.ivproduction.cz' . $route],
        'twitter:card' => [$meta($xpath, 'name', 'twitter:card'), 'summary_large_image'],
        'twitter:title' => [$meta($xpath, 'name', 'twitter:title'), (string) ($item['title'] ?? '')],
    ];
    foreach ($checks as $name => [$actual, $wanted]) {
        if ($actual !== $wanted) $errors[] = $route . ': ' . $name . ' neodpovídá uložené hodnotě';
    }
}

if ($errors) {
    fwrite(STDERR, "Kontrola serverového vykreslení sociálních karet selhala:\n- " . implode("\n- ", $errors) . "\n");
    exit(1);
}

echo 'Serverové vykreslení sociálních karet: ' . count($files) . " hlavních stránek prošlo.\n";
