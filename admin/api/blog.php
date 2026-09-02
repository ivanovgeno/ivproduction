<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
require_once IVP_ROOT . '/api/blog-store.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = ivp_blog_load();
    usort($data['posts'], static fn(array $a, array $b): int => strcmp((string) ($b['publishedAt'] ?? ''), (string) ($a['publishedAt'] ?? '')));
    ivp_json(['ok' => true, 'posts' => $data['posts'], 'version' => $data['version'], 'updatedAt' => $data['updatedAt']]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$payload = ivp_read_payload();
$action = (string) ($payload['action'] ?? 'save');
$data = ivp_blog_load();

if ($action === 'delete') {
    $id = ivp_blog_clean_text($payload['id'] ?? '', 120);
    $before = count($data['posts']);
    $data['posts'] = array_values(array_filter($data['posts'], static fn(array $post): bool => (string) ($post['id'] ?? '') !== $id));
    if ($before === count($data['posts'])) ivp_json(['ok' => false, 'error' => 'Článek nebyl nalezen.'], 404);
    $data['version'] = ((int) $data['version']) + 1;
    $data['updatedAt'] = gmdate('c');
    if (!ivp_blog_write($data)) ivp_json(['ok' => false, 'error' => 'Článek se nepodařilo odstranit. Zkontrolujte oprávnění složky content.'], 500);
    ivp_json(['ok' => true, 'message' => 'Článek byl odstraněn.']);
}

if ($action !== 'save') ivp_json(['ok' => false, 'error' => 'Neplatná operace.'], 422);
$incoming = is_array($payload['post'] ?? null) ? $payload['post'] : [];
$id = ivp_blog_clean_text($incoming['id'] ?? '', 120);
$existingIndex = null;
foreach ($data['posts'] as $index => $post) {
    if ((string) ($post['id'] ?? '') === $id && $id !== '') { $existingIndex = $index; break; }
}
$existing = $existingIndex !== null ? $data['posts'][$existingIndex] : [];

$title = ivp_blog_clean_text($incoming['title'] ?? '', 180);
$slug = ivp_blog_slug(ivp_blog_clean_text($incoming['slug'] ?? $title, 180));
$excerpt = ivp_blog_clean_text($incoming['excerpt'] ?? '', 700);
$category = ivp_blog_clean_text($incoming['category'] ?? 'Tipy a triky', 80);
$publishedAt = ivp_blog_clean_text($incoming['publishedAt'] ?? date('Y-m-d'), 10);
$image = ivp_blog_clean_text($incoming['image'] ?? '', 500);
$imageAlt = ivp_blog_clean_text($incoming['imageAlt'] ?? $title, 300);
$bodyHtml = ivp_blog_sanitize_html((string) ($incoming['bodyHtml'] ?? ''));
$status = ($incoming['status'] ?? '') === 'published' ? 'published' : 'draft';
if ($title === '' || $slug === '' || $excerpt === '' || $image === '' || $bodyHtml === '') {
    ivp_json(['ok' => false, 'error' => 'Vyplňte název, krátký úvod, titulní fotografii a obsah článku.'], 422);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $publishedAt)) ivp_json(['ok' => false, 'error' => 'Datum publikace není platné.'], 422);
foreach ($data['posts'] as $index => $post) {
    if ($index === $existingIndex) continue;
    if ((string) ($post['slug'] ?? '') === $slug) ivp_json(['ok' => false, 'error' => 'Tuto adresu už používá jiný článek.'], 422);
}

$now = gmdate('c');
$post = array_merge($existing, [
    'id' => $id !== '' ? $id : 'post-' . date('YmdHis') . '-' . bin2hex(random_bytes(3)),
    'slug' => $slug,
    'path' => $existing['path'] ?? '/clanky/' . $slug . '/',
    'sourceFile' => $existing['sourceFile'] ?? null,
    'title' => $title,
    'seoTitle' => ivp_blog_clean_text($incoming['seoTitle'] ?? ($title . ' | Iv Production'), 220),
    'metaDescription' => ivp_blog_clean_text($incoming['metaDescription'] ?? $excerpt, 320),
    'excerpt' => $excerpt,
    'category' => $category,
    'kicker' => ivp_blog_clean_text($incoming['kicker'] ?? $category, 120),
    'publishedAt' => $publishedAt,
    'readingTime' => ivp_blog_clean_text($incoming['readingTime'] ?? '5 minut čtení', 60),
    'image' => $image,
    'imageAlt' => $imageAlt,
    'bodyHtml' => $bodyHtml,
    'status' => $status,
    'featured' => !empty($incoming['featured']),
    'createdAt' => $existing['createdAt'] ?? $now,
    'updatedAt' => $now,
]);
if ($existingIndex === null) $data['posts'][] = $post;
else $data['posts'][$existingIndex] = $post;
if (!empty($post['featured'])) {
    foreach ($data['posts'] as &$item) if (($item['id'] ?? '') !== $post['id']) $item['featured'] = false;
    unset($item);
}
$data['version'] = ((int) $data['version']) + 1;
$data['updatedAt'] = $now;
if (!ivp_blog_write($data)) ivp_json(['ok' => false, 'error' => 'Článek se nepodařilo uložit. Zkontrolujte oprávnění složky content.'], 500);
ivp_json(['ok' => true, 'message' => $status === 'published' ? 'Článek byl publikován.' : 'Koncept byl uložen.', 'post' => $post]);
