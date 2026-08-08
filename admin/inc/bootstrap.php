<?php
declare(strict_types=1);

const IVP_ROOT = __DIR__ . '/../..';
const IVP_ADMIN = __DIR__ . '/..';
const IVP_CONFIG = IVP_ADMIN . '/config.php';
const IVP_CONTENT = IVP_ROOT . '/content/site-content.json';
const IVP_HISTORY = IVP_ADMIN . '/data/history';
const IVP_UPLOADS = IVP_ROOT . '/assets/uploads';

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
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'");

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
        'blog.html' => 'Blog', 'kalkulacka.html' => 'Kalkulačka',
        'jak-vybrat-svatebniho-kameramana.html' => 'Článek: výběr kameramana',
        'jak-pripravit-firemni-video.html' => 'Článek: firemní video',
        'proc-video-pomaha-prodat-nemovitost.html' => 'Článek: prodej nemovitosti',
        'hudba-ve-videu.html' => 'Článek: hudba ve videu',
        'trendy-svatebni-video-2026.html' => 'Článek: trendy 2026',
        'video-pro-socialni-site.html' => 'Článek: sociální sítě',
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

function ivp_content(): array
{
    $data = json_decode((string) @file_get_contents(IVP_CONTENT), true);
    return is_array($data) ? $data : ['version' => 1, 'pages' => []];
}

function ivp_write_content(array $data): bool
{
    if (!is_dir(IVP_HISTORY)) {
        mkdir(IVP_HISTORY, 0750, true);
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
    return file_put_contents($tmp, $json . "\n", LOCK_EX) !== false && rename($tmp, IVP_CONTENT);
}
