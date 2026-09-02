<?php
declare(strict_types=1);

require_once __DIR__ . '/api/blog-store.php';
$base = (string) file_get_contents(__DIR__ . '/sitemap.xml');
$entries = [];
foreach (ivp_blog_load()['posts'] as $post) {
    if (($post['status'] ?? 'draft') !== 'published') continue;
    $path = ivp_blog_public_path($post);
    if (str_contains($base, '<loc>https://www.ivproduction.cz' . $path . '</loc>')) continue;
    $modified = substr((string) ($post['updatedAt'] ?? $post['publishedAt'] ?? date('Y-m-d')), 0, 10);
    $entries[] = "    <url>\n        <loc>https://www.ivproduction.cz" . htmlspecialchars($path, ENT_XML1) . "</loc>\n        <lastmod>{$modified}</lastmod>\n        <changefreq>monthly</changefreq>\n        <priority>0.6</priority>\n    </url>";
}
if ($entries) $base = str_replace('</urlset>', implode("\n", $entries) . "\n</urlset>", $base);
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
echo $base;
