<?php
declare(strict_types=1);

const IVP_SOCIAL_META_SEED = __DIR__ . '/../content/social-meta.seed.json';
const IVP_SOCIAL_META_DATA = __DIR__ . '/../content/social-meta.json';

/** @return array{version:int,updatedAt:?string,items:array<string,array<string,string>>} */
function ivp_social_load(): array
{
    $seed = json_decode((string) @file_get_contents(IVP_SOCIAL_META_SEED), true);
    $runtime = is_file(IVP_SOCIAL_META_DATA) ? json_decode((string) @file_get_contents(IVP_SOCIAL_META_DATA), true) : null;
    $seedItems = is_array($seed['items'] ?? null) ? $seed['items'] : [];
    $runtimeItems = is_array($runtime['items'] ?? null) ? $runtime['items'] : [];
    return [
        'version' => max(1, (int) ($runtime['version'] ?? $seed['version'] ?? 1)),
        'updatedAt' => isset($runtime['updatedAt']) ? (string) $runtime['updatedAt'] : null,
        'items' => array_filter(array_replace($seedItems, $runtimeItems), 'is_array'),
    ];
}

function ivp_social_write(array $data): bool
{
    $directory = dirname(IVP_SOCIAL_META_DATA);
    if (!is_dir($directory)) @mkdir($directory, 0750, true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $payload = $json . "\n";
    $tmp = IVP_SOCIAL_META_DATA . '.tmp';
    if (@file_put_contents($tmp, $payload, LOCK_EX) !== false && @rename($tmp, IVP_SOCIAL_META_DATA)) return true;
    @unlink($tmp);
    return @file_put_contents(IVP_SOCIAL_META_DATA, $payload, LOCK_EX) !== false;
}

function ivp_social_absolute_image(string $image): string
{
    $image = trim($image);
    if ($image === '') return '';
    if (preg_match('~^https://~i', $image)) return $image;
    return 'https://www.ivproduction.cz/' . ltrim($image, '/');
}

function ivp_social_replace_meta(string $html, string $attribute, string $key, string $value): string
{
    $escaped = htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $pattern = '~<meta\b(?=[^>]*\b' . preg_quote($attribute, '~') . '\s*=\s*(["\'])' . preg_quote($key, '~') . '\1)[^>]*>~i';
    $replacement = static function (array $match) use ($escaped): string {
        if (preg_match('~\bcontent\s*=\s*(["\']).*?\1~i', $match[0])) {
            return (string) preg_replace_callback(
                '~(\bcontent\s*=\s*)(["\']).*?\2~i',
                static fn(array $contentMatch): string => $contentMatch[1] . '"' . $escaped . '"',
                $match[0],
                1
            );
        }
        return substr($match[0], 0, -1) . ' content="' . $escaped . '">';
    };
    if (preg_match($pattern, $html)) return (string) preg_replace_callback($pattern, $replacement, $html, 1);
    $tag = '<meta ' . $attribute . '="' . htmlspecialchars($key, ENT_QUOTES, 'UTF-8') . '" content="' . $escaped . '">';
    return (string) preg_replace('~</head>~i', '    ' . $tag . "\n</head>", $html, 1);
}

/** @param array<string,string>|null $fallback */
function ivp_social_apply(string $html, string $route, ?array $fallback = null): string
{
    $route = '/' . trim(parse_url($route, PHP_URL_PATH) ?: '/', '/');
    if ($route !== '/') $route .= '/';
    $stored = ivp_social_load()['items'][$route] ?? null;
    if (!is_array($stored) && !is_array($fallback)) return $html;
    $meta = array_merge($fallback ?? [], is_array($stored) ? $stored : []);
    $title = trim((string) ($meta['title'] ?? ''));
    $description = trim((string) ($meta['description'] ?? ''));
    $image = ivp_social_absolute_image((string) ($meta['image'] ?? ''));
    $imageAlt = trim((string) ($meta['imageAlt'] ?? $title));
    if ($title !== '') {
        $html = ivp_social_replace_meta($html, 'property', 'og:title', $title);
        $html = ivp_social_replace_meta($html, 'name', 'twitter:title', $title);
    }
    if ($description !== '') {
        $html = ivp_social_replace_meta($html, 'property', 'og:description', $description);
        $html = ivp_social_replace_meta($html, 'name', 'twitter:description', $description);
    }
    if ($image !== '') {
        $html = ivp_social_replace_meta($html, 'property', 'og:image', $image);
        $html = ivp_social_replace_meta($html, 'property', 'og:image:secure_url', $image);
        $html = ivp_social_replace_meta($html, 'name', 'twitter:image', $image);
    }
    if ($imageAlt !== '') {
        $html = ivp_social_replace_meta($html, 'property', 'og:image:alt', $imageAlt);
        $html = ivp_social_replace_meta($html, 'name', 'twitter:image:alt', $imageAlt);
    }
    $html = ivp_social_replace_meta($html, 'property', 'og:url', 'https://www.ivproduction.cz' . $route);
    $html = ivp_social_replace_meta($html, 'name', 'twitter:card', 'summary_large_image');
    return $html;
}

/** @return array{title:string,description:string,image:string,imageAlt:string} */
function ivp_social_defaults_from_html(string $html): array
{
    $read = static function (string $attribute, string $key) use ($html): string {
        $pattern = '~<meta\b(?=[^>]*\b' . preg_quote($attribute, '~') . '\s*=\s*(["\'])' . preg_quote($key, '~') . '\1)[^>]*\bcontent\s*=\s*(["\'])(.*?)\2[^>]*>~is';
        if (!preg_match($pattern, $html, $match)) {
            $pattern = '~<meta\b(?=[^>]*\bcontent\s*=\s*(["\'])(.*?)\1)(?=[^>]*\b' . preg_quote($attribute, '~') . '\s*=\s*(["\'])' . preg_quote($key, '~') . '\3)[^>]*>~is';
            return preg_match($pattern, $html, $match) ? html_entity_decode((string) $match[2], ENT_QUOTES | ENT_HTML5, 'UTF-8') : '';
        }
        return html_entity_decode((string) $match[3], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    };
    $title = $read('property', 'og:title') ?: $read('name', 'twitter:title');
    return [
        'title' => $title,
        'description' => $read('property', 'og:description') ?: $read('name', 'description'),
        'image' => $read('property', 'og:image'),
        'imageAlt' => $read('property', 'og:image:alt') ?: $title,
    ];
}
