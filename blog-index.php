<?php
declare(strict_types=1);

require_once __DIR__ . '/api/blog-store.php';
require_once __DIR__ . '/inc/social-meta.php';

function ivp_blog_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function ivp_blog_image_css(string $value): string
{
    return str_replace(["'", "\n", "\r", "\\"], ['', '', '', '/'], $value);
}

$data = ivp_blog_load();
$posts = array_values(array_filter($data['posts'], static fn(array $post): bool => ($post['status'] ?? 'draft') === 'published'));
usort($posts, static fn(array $a, array $b): int => strcmp((string) ($b['publishedAt'] ?? ''), (string) ($a['publishedAt'] ?? '')));
$featured = null;
foreach ($posts as $post) if (!empty($post['featured'])) { $featured = $post; break; }
if ($featured === null && $posts) $featured = $posts[0];

$featuredHtml = '';
if ($featured !== null) {
    $featuredHtml = '<article class="featured-article" data-blog-category="' . ivp_blog_escape(ivp_blog_category_key((string) $featured['category'])) . '">'
        . '<div class="featured-image" style="background-image:url(\'' . ivp_blog_image_css((string) $featured['image']) . '\')"></div>'
        . '<div class="featured-content"><span class="featured-label">Doporučený článek</span>'
        . '<h2>' . ivp_blog_escape((string) $featured['title']) . '</h2>'
        . '<p>' . ivp_blog_escape((string) $featured['excerpt']) . '</p>'
        . '<a href="' . ivp_blog_escape(ivp_blog_public_path($featured)) . '" class="btn btn-primary">Číst článek →</a></div></article>';
}

$cards = [];
foreach ($posts as $post) {
    if ($featured !== null && ($post['id'] ?? '') === ($featured['id'] ?? '')) continue;
    $cards[] = '<a href="' . ivp_blog_escape(ivp_blog_public_path($post)) . '" class="blog-card" data-blog-category="' . ivp_blog_escape(ivp_blog_category_key((string) $post['category'])) . '">'
        . '<div class="blog-image" style="background-image:url(\'' . ivp_blog_image_css((string) $post['image']) . '\')"><span class="blog-category">' . ivp_blog_escape((string) $post['category']) . '</span></div>'
        . '<div class="blog-content"><span class="blog-date">' . ivp_blog_escape(ivp_blog_date_cs((string) $post['publishedAt'])) . '</span>'
        . '<h3>' . ivp_blog_escape((string) $post['title']) . '</h3><p>' . ivp_blog_escape((string) $post['excerpt']) . '</p>'
        . '<span class="blog-read-more">Číst více →</span></div></a>';
}
$gridHtml = '<div class="blog-grid">' . implode("\n", $cards) . '</div>';

$template = (string) file_get_contents(__DIR__ . '/blog.html');
$template = (string) preg_replace('~<!-- BLOG_FEATURED_START -->.*?<!-- BLOG_FEATURED_END -->~s', '<!-- BLOG_FEATURED_START -->' . $featuredHtml . '<!-- BLOG_FEATURED_END -->', $template, 1);
$template = (string) preg_replace('~<!-- BLOG_GRID_START -->.*?<!-- BLOG_GRID_END -->~s', '<!-- BLOG_GRID_START -->' . $gridHtml . '<!-- BLOG_GRID_END -->', $template, 1);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
echo ivp_social_apply($template, '/svatebni-blog/');
