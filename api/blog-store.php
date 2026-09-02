<?php
declare(strict_types=1);

const IVP_BLOG_SEED = __DIR__ . '/../content/blog-posts.seed.json';
const IVP_BLOG_DATA = __DIR__ . '/../content/blog-posts.json';
const IVP_BLOG_HISTORY = __DIR__ . '/../admin/data/history';

/** @return array{version:int,updatedAt:?string,posts:array<int,array<string,mixed>>} */
function ivp_blog_load(): array
{
    $path = is_file(IVP_BLOG_DATA) ? IVP_BLOG_DATA : IVP_BLOG_SEED;
    $decoded = json_decode((string) @file_get_contents($path), true);
    if (!is_array($decoded) || !is_array($decoded['posts'] ?? null)) {
        return ['version' => 1, 'updatedAt' => null, 'posts' => []];
    }
    $decoded['version'] = max(1, (int) ($decoded['version'] ?? 1));
    $decoded['updatedAt'] = isset($decoded['updatedAt']) ? (string) $decoded['updatedAt'] : null;
    $decoded['posts'] = array_values(array_filter($decoded['posts'], 'is_array'));
    return $decoded;
}

function ivp_blog_write(array $data): bool
{
    if (!is_dir(IVP_BLOG_HISTORY)) @mkdir(IVP_BLOG_HISTORY, 0750, true);
    if (is_file(IVP_BLOG_DATA)) {
        $backup = IVP_BLOG_HISTORY . '/blog-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json';
        @copy(IVP_BLOG_DATA, $backup);
        $backups = glob(IVP_BLOG_HISTORY . '/blog-*.json') ?: [];
        rsort($backups);
        foreach (array_slice($backups, 30) as $old) @unlink($old);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $payload = $json . "\n";
    $tmp = IVP_BLOG_DATA . '.tmp';
    if (file_put_contents($tmp, $payload, LOCK_EX) !== false && rename($tmp, IVP_BLOG_DATA)) return true;
    @unlink($tmp);
    return file_put_contents(IVP_BLOG_DATA, $payload, LOCK_EX) !== false;
}

function ivp_blog_slug(string $value): string
{
    $value = mb_strtolower(trim($value), 'UTF-8');
    $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    $value = $ascii !== false ? $ascii : $value;
    $value = (string) preg_replace('/[^a-z0-9]+/', '-', strtolower($value));
    return trim($value, '-');
}

function ivp_blog_clean_text(mixed $value, int $limit): string
{
    $value = trim((string) $value);
    return mb_substr($value, 0, $limit, 'UTF-8');
}

function ivp_blog_sanitize_html(string $source): string
{
    if (!class_exists('DOMDocument')) {
        return strip_tags($source, '<p><h2><h3><ul><ol><li><strong><em><a><blockquote><br>');
    }
    $document = new DOMDocument('1.0', 'UTF-8');
    $previous = libxml_use_internal_errors(true);
    $document->loadHTML('<?xml encoding="utf-8"?><div id="ivp-blog-root">' . $source . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    $root = $document->getElementById('ivp-blog-root');
    if (!$root) return '';

    $allowed = ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br', 'div'];
    $walk = function (DOMNode $node) use (&$walk, $allowed): void {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                $tag = strtolower($child->tagName);
                if (!in_array($tag, $allowed, true)) {
                    while ($child->firstChild) $node->insertBefore($child->firstChild, $child);
                    $node->removeChild($child);
                    continue;
                }
                foreach (iterator_to_array($child->attributes) as $attribute) {
                    if ($tag === 'a' && in_array(strtolower($attribute->name), ['href', 'title'], true)) continue;
                    if (in_array($tag, ['h2', 'h3'], true) && strtolower($attribute->name) === 'id') continue;
                    if ($tag === 'div' && strtolower($attribute->name) === 'class' && $attribute->value === 'article-note') continue;
                    $child->removeAttribute($attribute->name);
                }
                if ($tag === 'a') {
                    $href = trim($child->getAttribute('href'));
                    if ($href !== '' && !preg_match('~^(?:https?://|mailto:|tel:|/|#)~i', $href)) $child->removeAttribute('href');
                    if (preg_match('~^https?://~i', $href)) {
                        $child->setAttribute('target', '_blank');
                        $child->setAttribute('rel', 'noopener');
                    }
                }
            }
            $walk($child);
        }
    };
    $walk($root);
    $html = '';
    foreach ($root->childNodes as $child) $html .= $document->saveHTML($child);
    return trim($html);
}

/** @param array<string,mixed> $post */
function ivp_blog_public_path(array $post): string
{
    $path = trim((string) ($post['path'] ?? ''));
    if (preg_match('~^/(?:l/)?[a-z0-9-]+/$~', $path)) return $path;
    return '/clanky/' . ivp_blog_slug((string) ($post['slug'] ?? $post['title'] ?? 'clanek')) . '/';
}

/** @return array<string,mixed>|null */
function ivp_blog_find(string $slugOrPath): ?array
{
    $needle = trim($slugOrPath, '/');
    foreach (ivp_blog_load()['posts'] as $post) {
        if (($post['status'] ?? 'draft') !== 'published') continue;
        $slug = trim((string) ($post['slug'] ?? ''));
        $path = trim((string) ($post['path'] ?? ''), '/');
        if ($needle === $slug || $needle === $path || str_ends_with($path, '/' . $needle)) return $post;
    }
    return null;
}

function ivp_blog_category_key(string $category): string
{
    $normalized = mb_strtolower($category, 'UTF-8');
    if (str_contains($normalized, 'svat')) return 'svatby';
    if (str_contains($normalized, 'real')) return 'reality';
    if (str_contains($normalized, 'promo') || str_contains($normalized, 'soci')) return 'promo';
    return 'tipy';
}

function ivp_blog_date_cs(string $value): string
{
    $timestamp = strtotime($value);
    if ($timestamp === false) return $value;
    $months = [1 => 'ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
    return date('j', $timestamp) . '. ' . $months[(int) date('n', $timestamp)] . ' ' . date('Y', $timestamp);
}
