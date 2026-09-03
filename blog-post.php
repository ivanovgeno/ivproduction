<?php
declare(strict_types=1);

require_once __DIR__ . '/api/blog-store.php';
require_once __DIR__ . '/inc/social-meta.php';

$slug = trim((string) ($_GET['slug'] ?? ''), '/');
$post = ivp_blog_find($slug);
if ($post === null || !class_exists('DOMDocument')) {
    http_response_code(404);
    readfile(__DIR__ . '/404.html');
    exit;
}

function ivp_post_first(DOMXPath $xpath, string $query): ?DOMElement
{
    $node = $xpath->query($query)?->item(0);
    return $node instanceof DOMElement ? $node : null;
}

function ivp_post_text(?DOMElement $element, string $value): void
{
    if (!$element) return;
    while ($element->firstChild) $element->removeChild($element->firstChild);
    $element->appendChild($element->ownerDocument->createTextNode($value));
}

function ivp_post_meta(DOMXPath $xpath, string $query, string $value): void
{
    $element = ivp_post_first($xpath, $query);
    if ($element) $element->setAttribute('content', $value);
}

function ivp_post_replace_html(DOMElement $target, string $html): void
{
    while ($target->firstChild) $target->removeChild($target->firstChild);
    $fragmentDocument = new DOMDocument('1.0', 'UTF-8');
    $previous = libxml_use_internal_errors(true);
    $fragmentDocument->loadHTML('<?xml encoding="utf-8"?><div id="fragment-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    $root = $fragmentDocument->getElementById('fragment-root');
    if (!$root) return;
    foreach (iterator_to_array($root->childNodes) as $child) $target->appendChild($target->ownerDocument->importNode($child, true));
}

$source = (string) ($post['sourceFile'] ?? '');
if ($source === '' || !is_file(__DIR__ . '/' . $source)) $source = 'trendy-svatebni-video-2026.html';
$document = new DOMDocument('1.0', 'UTF-8');
$previous = libxml_use_internal_errors(true);
$document->loadHTML((string) file_get_contents(__DIR__ . '/' . $source), LIBXML_HTML_NODEFDTD);
libxml_clear_errors();
libxml_use_internal_errors($previous);
$xpath = new DOMXPath($document);

$title = (string) $post['title'];
$seoTitle = (string) ($post['seoTitle'] ?? ($title . ' | Iv Production'));
$description = (string) ($post['metaDescription'] ?? $post['excerpt']);
$path = ivp_blog_public_path($post);
$canonical = 'https://www.ivproduction.cz' . $path;
$image = (string) $post['image'];
$absoluteImage = str_starts_with($image, 'http') ? $image : 'https://www.ivproduction.cz/' . ltrim($image, '/');

ivp_post_text(ivp_post_first($xpath, '//title'), $seoTitle);
$canonicalNode = ivp_post_first($xpath, '//link[@rel="canonical"]');
if ($canonicalNode) $canonicalNode->setAttribute('href', $canonical);
ivp_post_meta($xpath, '//meta[@name="description"]', $description);
ivp_post_meta($xpath, '//meta[@property="og:title"]', $title);
ivp_post_meta($xpath, '//meta[@property="og:description"]', $description);
ivp_post_meta($xpath, '//meta[@property="og:url"]', $canonical);
ivp_post_meta($xpath, '//meta[@property="og:image"]', $absoluteImage);
ivp_post_meta($xpath, '//meta[@property="og:image:secure_url"]', $absoluteImage);
ivp_post_meta($xpath, '//meta[@property="og:image:alt"]', (string) $post['imageAlt']);
ivp_post_meta($xpath, '//meta[@property="article:published_time"]', (string) $post['publishedAt']);
ivp_post_meta($xpath, '//meta[@property="article:modified_time"]', substr((string) $post['updatedAt'], 0, 10));
ivp_post_meta($xpath, '//meta[@property="article:section"]', (string) $post['category']);
ivp_post_meta($xpath, '//meta[@name="twitter:title"]', $title);
ivp_post_meta($xpath, '//meta[@name="twitter:description"]', $description);
ivp_post_meta($xpath, '//meta[@name="twitter:image"]', $absoluteImage);
ivp_post_meta($xpath, '//meta[@name="twitter:image:alt"]', (string) $post['imageAlt']);

$schema = [
    '@context' => 'https://schema.org', '@type' => 'Article',
    'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $canonical],
    'headline' => $title, 'description' => $description, 'image' => [$absoluteImage],
    'datePublished' => (string) $post['publishedAt'], 'dateModified' => substr((string) $post['updatedAt'], 0, 10),
    'inLanguage' => 'cs-CZ', 'articleSection' => (string) $post['category'],
    'author' => ['@type' => 'Organization', 'name' => 'Iv Production', 'url' => 'https://www.ivproduction.cz/'],
    'publisher' => ['@type' => 'Organization', 'name' => 'Iv Production', 'logo' => ['@type' => 'ImageObject', 'url' => 'https://www.ivproduction.cz/logo-light.png']],
];
ivp_post_text(ivp_post_first($xpath, '//script[@type="application/ld+json"]'), (string) json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
ivp_post_text(ivp_post_first($xpath, '//h1[1]'), $title);
ivp_post_text(ivp_post_first($xpath, '//*[contains(concat(" ",normalize-space(@class)," ")," article-hero__lead ")][1]'), (string) $post['excerpt']);
ivp_post_text(ivp_post_first($xpath, '//*[contains(concat(" ",normalize-space(@class)," ")," article-kicker ")][1]'), (string) ($post['kicker'] ?? $post['category']));
$heroImage = ivp_post_first($xpath, '//*[contains(concat(" ",normalize-space(@class)," ")," article-hero__media ")]//img[1]');
if ($heroImage) { $heroImage->setAttribute('src', $image); $heroImage->setAttribute('alt', (string) $post['imageAlt']); $heroImage->removeAttribute('srcset'); }
$metaItems = $xpath->query('//*[contains(concat(" ",normalize-space(@class)," ")," article-meta ")]/*');
if ($metaItems && $metaItems->length > 0 && $metaItems->item(0) instanceof DOMElement) ivp_post_text($metaItems->item(0), ivp_blog_date_cs((string) $post['publishedAt']));
if ($metaItems && $metaItems->length > 1 && $metaItems->item(1) instanceof DOMElement) ivp_post_text($metaItems->item(1), (string) ($post['readingTime'] ?? '5 minut čtení'));

$body = ivp_post_first($xpath, '//*[contains(concat(" ",normalize-space(@class)," ")," article-body ")]');
if ($body) {
    $bodyHtml = (string) $post['bodyHtml']
        . '<section class="article-cta"><h2>Chcete profesionální video pro svůj příběh?</h2><p>Probereme váš záměr, termín i nejvhodnější podobu výstupu.</p><a href="/kontakt/#poptavka" class="nav-cta article-cta__button">Nezávazná poptávka</a></section>';
    ivp_post_replace_html($body, $bodyHtml);
}

$toc = ivp_post_first($xpath, '//*[contains(concat(" ",normalize-space(@class)," ")," article-toc ")]//nav[1]');
if ($toc && $body) {
    while ($toc->firstChild) $toc->removeChild($toc->firstChild);
    $headings = $xpath->query('.//h2[not(ancestor::*[contains(concat(" ",normalize-space(@class)," ")," article-cta ")])]', $body);
    if ($headings) foreach ($headings as $index => $heading) {
        if (!$heading instanceof DOMElement) continue;
        $id = $heading->getAttribute('id') ?: ('kapitola-' . ($index + 1));
        $heading->setAttribute('id', $id);
        $link = $document->createElement('a');
        $link->setAttribute('href', '#' . $id);
        $link->appendChild($document->createTextNode(trim($heading->textContent)));
        $toc->appendChild($link);
    }
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
$rendered = (string) $document->saveHTML();
echo ivp_social_apply($rendered, $path, [
    'title' => $title,
    'description' => $description,
    'image' => $image,
    'imageAlt' => (string) $post['imageAlt'],
]);
