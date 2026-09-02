<?php
declare(strict_types=1);

const IVP_ROOT = __DIR__ . '/../..';
const IVP_ADMIN = __DIR__ . '/..';
const IVP_CONFIG = IVP_ADMIN . '/config.php';
const IVP_CONTENT = IVP_ROOT . '/content/site-content.json';
const IVP_HISTORY = IVP_ADMIN . '/data/history';
const IVP_UPLOADS = IVP_ROOT . '/assets/uploads';

// Warnings must never corrupt JSON responses returned by admin endpoints.
// WEDOS still records them in the PHP error log for diagnostics.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', '1');
}
session_name('ivp_admin');
session_start();

header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: https://i.ytimg.com; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'");

function ivp_config(): array
{
    $config = require IVP_CONFIG;
    return is_array($config) ? $config : [];
}

function ivp_is_logged_in(): bool
{
    return isset($_SESSION['ivp_user'], $_SESSION['ivp_last_activity'])
        && (time() - (int) $_SESSION['ivp_last_activity']) < 7200;
}

function ivp_require_auth(bool $api = false): void
{
    if (!ivp_is_logged_in()) {
        if ($api) {
            ivp_json(['ok' => false, 'error' => 'Přihlášení vypršelo. Přihlaste se znovu.'], 401);
        }
        header('Location: login.php');
        exit;
    }
    $_SESSION['ivp_last_activity'] = time();
}

function ivp_csrf(): string
{
    if (empty($_SESSION['ivp_csrf'])) {
        $_SESSION['ivp_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['ivp_csrf'];
}

function ivp_require_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['_csrf'] ?? '';
    if (!is_string($token) || !hash_equals(ivp_csrf(), $token)) {
        ivp_json(['ok' => false, 'error' => 'Neplatný bezpečnostní token. Obnovte stránku.'], 403);
    }
}

function ivp_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ivp_read_payload(): array
{
    $payload = json_decode((string) file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function ivp_pages(): array
{
    $labels = [
        'index.html' => 'Homepage', 'kontakt.html' => 'Kontakt', 'portfolio.html' => 'Portfolio',
        'svatby.html' => 'Svatby', 'reality.html' => 'Reality', 'plesy.html' => 'Plesy',
        'fotobudka.html' => 'Fotobudka', '360budka.html' => 'Fotobudka 360°', 'promo.html' => 'Aftermovie & promo',
        'reels.html' => 'Reels', 'konference.html' => 'Konference', 'podcast.html' => 'Podcast',
        'ochrana-osobnich-udaju.html' => 'Ochrana osobních údajů',
        'obchodni-podminky.html' => 'Obchodní podmínky',
        'marketingovy-souhlas.html' => 'Marketingový souhlas',
    ];
    return array_filter($labels, static fn(string $file): bool => is_file(IVP_ROOT . '/' . $file), ARRAY_FILTER_USE_KEY);
}

function ivp_valid_page(string $page): bool
{
    return isset(ivp_pages()[$page]);
}

function ivp_replace_tag_attribute(string $html, string $tag, string $matchAttribute, string $matchValue, string $targetAttribute, string $value): string
{
    $pattern = '~<' . preg_quote($tag, '~') . '\\b[^>]*\\b' . preg_quote($matchAttribute, '~') . '\\s*=\\s*"' . preg_quote($matchValue, '~') . '"[^>]*>~i';
    return (string) preg_replace_callback($pattern, static function (array $match) use ($targetAttribute, $value): string {
        $escaped = htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $tagHtml = $match[0];
        $attributePattern = '~(\\b' . preg_quote($targetAttribute, '~') . '\\s*=\\s*)".*?"~i';
        if (preg_match($attributePattern, $tagHtml)) {
            return (string) preg_replace_callback($attributePattern, static fn(array $attribute): string => $attribute[1] . '"' . $escaped . '"', $tagHtml, 1);
        }
        return substr($tagHtml, 0, -1) . ' ' . $targetAttribute . '="' . $escaped . '">';
    }, $html, 1);
}

/** @param array<int, array<string, mixed>> $records */
function ivp_sync_static_seo(string $page, array $records): bool
{
    $path = IVP_ROOT . '/' . $page;
    $html = file_get_contents($path);
    if ($html === false) return false;
    $changed = false;

    $metaSelectors = [
        'meta[name="description"]' => ['name', 'description'],
        'meta[property="og:title"]' => ['property', 'og:title'],
        'meta[property="og:description"]' => ['property', 'og:description'],
        'meta[property="og:url"]' => ['property', 'og:url'],
        'meta[property="og:image"]' => ['property', 'og:image'],
        'meta[property="og:image:secure_url"]' => ['property', 'og:image:secure_url'],
        'meta[name="twitter:title"]' => ['name', 'twitter:title'],
        'meta[name="twitter:description"]' => ['name', 'twitter:description'],
        'meta[name="twitter:image"]' => ['name', 'twitter:image'],
    ];

    foreach ($records as $record) {
        $selector = (string) ($record['selector'] ?? '');
        $property = (string) ($record['property'] ?? '');
        $value = (string) ($record['value'] ?? '');
        $before = $html;

        if ($selector === 'title' && $property === 'title') {
            $escaped = htmlspecialchars($value, ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $html = (string) preg_replace_callback('~(<title\\b[^>]*>).*?(</title>)~is', static fn(array $match): string => $match[1] . $escaped . $match[2], $html, 1);
        } elseif ($selector === 'link[rel="canonical"]' && $property === 'href') {
            $html = ivp_replace_tag_attribute($html, 'link', 'rel', 'canonical', 'href', $value);
        } elseif (isset($metaSelectors[$selector]) && $property === 'content') {
            [$matchAttribute, $matchValue] = $metaSelectors[$selector];
            $html = ivp_replace_tag_attribute($html, 'meta', $matchAttribute, $matchValue, 'content', $value);
        } elseif ($selector === 'script[type="application/ld+json"]' && $property === 'json-ld') {
            $decoded = json_decode($value, true);
            if (!is_array($decoded)) continue;
            $normalized = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($normalized === false) continue;
            $target = max(0, (int) ($record['node'] ?? 0));
            $seen = 0;
            $html = (string) preg_replace_callback('~(<script\\b[^>]*type="application/ld\\+json"[^>]*>).*?(</script>)~is', static function (array $match) use (&$seen, $target, $normalized): string {
                if ($seen++ !== $target) return $match[0];
                return $match[1] . "\n" . $normalized . "\n" . $match[2];
            }, $html);
        }
        if ($html !== $before) $changed = true;
    }

    if (!$changed) return true;
    $tmp = $path . '.admin-tmp';
    if (@file_put_contents($tmp, $html, LOCK_EX) !== false && @rename($tmp, $path)) return true;
    @unlink($tmp);

    // Some shared hostings allow replacing an existing file but not creating a
    // temporary sibling. Keep publishing available in that configuration too.
    return @file_put_contents($path, $html, LOCK_EX) !== false;
}

function ivp_content(): array
{
    $data = json_decode((string) @file_get_contents(IVP_CONTENT), true);
    return is_array($data) ? $data : ['version' => 1, 'pages' => []];
}

function ivp_storage_status(): array
{
    $contentDirectory = dirname(IVP_CONTENT);
    $historyDirectory = is_dir(IVP_HISTORY) ? IVP_HISTORY : dirname(IVP_HISTORY);

    return [
        'content' => is_file(IVP_CONTENT) ? is_writable(IVP_CONTENT) : is_writable($contentDirectory),
        'contentDirectory' => is_dir($contentDirectory) && is_writable($contentDirectory),
        'history' => is_dir($historyDirectory) && is_writable($historyDirectory),
        'pages' => is_writable(IVP_ROOT),
    ];
}

function ivp_write_content(array $data): bool
{
    if (!is_dir(IVP_HISTORY)) {
        @mkdir(IVP_HISTORY, 0750, true);
    }
    if (is_file(IVP_CONTENT)) {
        $backup = IVP_HISTORY . '/content-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json';
        @copy(IVP_CONTENT, $backup);
        $backups = glob(IVP_HISTORY . '/content-*.json') ?: [];
        rsort($backups);
        foreach (array_slice($backups, 30) as $old) {
            @unlink($old);
        }
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $tmp = IVP_CONTENT . '.tmp';
    $payload = $json . "\n";
    if (@file_put_contents($tmp, $payload, LOCK_EX) !== false && @rename($tmp, IVP_CONTENT)) return true;
    @unlink($tmp);

    return @file_put_contents(IVP_CONTENT, $payload, LOCK_EX) !== false;
}
