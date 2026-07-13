<?php
declare(strict_types=1);

/**
 * IV Production — private Google Business Profile review proxy.
 *
 * This endpoint is meant for a PHP 8.4 hosting environment. It deliberately
 * keeps OAuth credentials on the server and exposes only the review data that
 * the public website needs to render.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300, stale-while-revalidate=3600');
header('X-Content-Type-Options: nosniff');

const IVP_DEFAULT_CACHE_TTL = 21600; // 6 hours
const IVP_MAX_PAGES = 100;

/** @param array<string, mixed> $payload */
function ivp_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** @return array<string, mixed> */
function ivp_read_json_file(string $path): array
{
    if (!is_file($path) || !is_readable($path)) {
        return [];
    }

    $content = file_get_contents($path);
    if ($content === false) {
        return [];
    }

    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

/** @return array<string, string> */
function ivp_load_config(): array
{
    $config = [];

    // Preferred: an absolute path outside the public web directory, supplied
    // by the host in an environment variable.
    $externalPath = getenv('IVP_GOOGLE_REVIEWS_CONFIG');
    if (is_string($externalPath) && $externalPath !== '' && is_file($externalPath)) {
        $loaded = require $externalPath;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }

    // Shared-hosting fallback. This file is blocked from public access by the
    // .htaccess file in api/private and is ignored by Git.
    if ($config === []) {
        $localPath = __DIR__ . '/private/google-reviews-config.php';
        if (is_file($localPath)) {
            $loaded = require $localPath;
            if (is_array($loaded)) {
                $config = $loaded;
            }
        }
    }

    foreach ([
        'google_client_id',
        'google_client_secret',
        'google_refresh_token',
        'google_business_account_id',
        'google_business_location_id',
        'google_maps_url',
        'google_write_review_url',
    ] as $key) {
        $environmentValue = getenv('IVP_' . strtoupper($key));
        if (is_string($environmentValue) && $environmentValue !== '') {
            $config[$key] = $environmentValue;
        }
    }

    return array_map(
        static fn (mixed $value): string => is_string($value) ? trim($value) : '',
        $config
    );
}

/** @param array<string, string> $config */
function ivp_is_configured(array $config): bool
{
    foreach ([
        'google_client_id',
        'google_client_secret',
        'google_refresh_token',
        'google_business_account_id',
        'google_business_location_id',
    ] as $required) {
        if (($config[$required] ?? '') === '') {
            return false;
        }
    }

    return true;
}

/**
 * @param array<string, string> $headers
 * @return array{status: int, body: string}
 */
function ivp_request(string $url, array $headers = [], ?string $body = null): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL extension is not available.');
    }

    $curl = curl_init($url);
    if ($curl === false) {
        throw new RuntimeException('Unable to initialise cURL.');
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_USERAGENT => 'IV-Production-Google-Reviews/1.0',
    ]);

    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false) {
        throw new RuntimeException('Google request failed: ' . $error);
    }

    return ['status' => $status, 'body' => (string) $response];
}

/** @param array<string, string> $config */
function ivp_get_access_token(array $config): string
{
    $body = http_build_query([
        'client_id' => $config['google_client_id'],
        'client_secret' => $config['google_client_secret'],
        'refresh_token' => $config['google_refresh_token'],
        'grant_type' => 'refresh_token',
    ], '', '&', PHP_QUERY_RFC3986);

    $response = ivp_request(
        'https://oauth2.googleapis.com/token',
        ['Content-Type: application/x-www-form-urlencoded'],
        $body
    );
    $data = json_decode($response['body'], true);

    if ($response['status'] < 200 || $response['status'] >= 300 || !is_array($data) || empty($data['access_token'])) {
        throw new RuntimeException('OAuth token refresh was rejected.');
    }

    return (string) $data['access_token'];
}

function ivp_rating_value(mixed $value): int
{
    if (is_numeric($value)) {
        return max(0, min(5, (int) $value));
    }

    return match ((string) $value) {
        'ONE' => 1,
        'TWO' => 2,
        'THREE' => 3,
        'FOUR' => 4,
        'FIVE' => 5,
        default => 0,
    };
}

/** @param array<string, mixed> $review
 *  @return array<string, mixed>
 */
function ivp_public_review(array $review): array
{
    $reviewer = is_array($review['reviewer'] ?? null) ? $review['reviewer'] : [];
    $reply = is_array($review['reviewReply'] ?? null) ? $review['reviewReply'] : [];

    return [
        'reviewId' => (string) ($review['reviewId'] ?? ''),
        'rating' => ivp_rating_value($review['starRating'] ?? 0),
        'comment' => (string) ($review['comment'] ?? ''),
        'createTime' => (string) ($review['createTime'] ?? ''),
        'updateTime' => (string) ($review['updateTime'] ?? ''),
        'reviewer' => [
            'displayName' => (string) ($reviewer['displayName'] ?? 'Google uživatel'),
            'profilePhotoUrl' => (string) ($reviewer['profilePhotoUrl'] ?? ''),
        ],
        'reviewReply' => [
            'comment' => (string) ($reply['comment'] ?? ''),
            'updateTime' => (string) ($reply['updateTime'] ?? ''),
        ],
    ];
}

/**
 * @param array<string, string> $config
 * @return array<string, mixed>
 */
function ivp_fetch_reviews(array $config): array
{
    $token = ivp_get_access_token($config);
    $accountId = rawurlencode($config['google_business_account_id']);
    $locationId = rawurlencode($config['google_business_location_id']);
    $endpoint = "https://mybusiness.googleapis.com/v4/accounts/{$accountId}/locations/{$locationId}/reviews";
    $reviews = [];
    $pageToken = '';
    $averageRating = 0.0;
    $totalReviewCount = 0;

    for ($page = 0; $page < IVP_MAX_PAGES; $page++) {
        $query = http_build_query(array_filter([
            'pageSize' => 50,
            'pageToken' => $pageToken,
            'orderBy' => 'updateTime desc',
        ], static fn (mixed $value): bool => $value !== ''), '', '&', PHP_QUERY_RFC3986);
        $response = ivp_request($endpoint . '?' . $query, ["Authorization: Bearer {$token}"]);
        $data = json_decode($response['body'], true);

        if ($response['status'] < 200 || $response['status'] >= 300 || !is_array($data)) {
            throw new RuntimeException('Google Business Profile review request was rejected.');
        }

        if ($page === 0) {
            $averageRating = (float) ivp_rating_value($data['averageRating'] ?? 0);
            $totalReviewCount = is_numeric($data['totalReviewCount'] ?? null) ? (int) $data['totalReviewCount'] : 0;
        }

        foreach (($data['reviews'] ?? []) as $review) {
            if (is_array($review)) {
                $reviews[] = ivp_public_review($review);
            }
        }

        $pageToken = is_string($data['nextPageToken'] ?? null) ? $data['nextPageToken'] : '';
        if ($pageToken === '') {
            break;
        }
    }

    return [
        'status' => 'ok',
        'cached' => false,
        'updatedAt' => gmdate('c'),
        'rating' => $averageRating,
        'reviewCount' => $totalReviewCount > 0 ? $totalReviewCount : count($reviews),
        'reviews' => $reviews,
        'googleMapsUrl' => $config['google_maps_url'] ?? '',
        'writeReviewUrl' => $config['google_write_review_url'] ?? '',
    ];
}

function ivp_cached_response(string $cacheFile, int $ttl): ?array
{
    $cached = ivp_read_json_file($cacheFile);
    $updatedAt = isset($cached['updatedAt']) ? strtotime((string) $cached['updatedAt']) : false;

    if ($cached === [] || $updatedAt === false || (time() - $updatedAt) > $ttl) {
        return null;
    }

    $cached['cached'] = true;
    return $cached;
}

$config = ivp_load_config();
if (!ivp_is_configured($config)) {
    ivp_json([
        'status' => 'configuration_required',
        'message' => 'Google reviews are not configured on this server yet.',
    ], 503);
}

$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/google-reviews.json';
$ttl = is_numeric($config['cache_ttl_seconds'] ?? null)
    ? max(300, min(86400, (int) $config['cache_ttl_seconds']))
    : IVP_DEFAULT_CACHE_TTL;

if ($cached = ivp_cached_response($cacheFile, $ttl)) {
    ivp_json($cached);
}

try {
    $payload = ivp_fetch_reviews($config);

    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0750, true);
    }
    file_put_contents($cacheFile, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    ivp_json($payload);
} catch (Throwable $exception) {
    error_log('[IV Production] Google reviews sync failed: ' . $exception->getMessage());

    // Keep the review section working during a short Google outage or rate
    // limit. The frontend marks no error to visitors and uses this stale cache.
    $stale = ivp_read_json_file($cacheFile);
    if ($stale !== []) {
        $stale['cached'] = true;
        $stale['stale'] = true;
        ivp_json($stale);
    }

    ivp_json([
        'status' => 'temporarily_unavailable',
        'message' => 'Google reviews are temporarily unavailable.',
    ], 503);
}
