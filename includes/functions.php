<?php

declare(strict_types=1);

function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function url(string $path = ''): string
{
    $path = trim($path, '/');
    return $path === '' ? '/' : '/' . $path;
}

function current_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    return trim($path, '/');
}

function is_active(string $path): bool
{
    return current_path() === trim($path, '/');
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function verify_csrf(?string $token): bool
{
    return is_string($token)
        && isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function flash(string $key, ?string $value = null): ?string
{
    if ($value !== null) {
        $_SESSION['_flash'][$key] = $value;
        return null;
    }

    $message = $_SESSION['_flash'][$key] ?? null;
    unset($_SESSION['_flash'][$key]);
    return $message;
}

function route_title(array $site, string $route): string
{
    if ($route === '') {
        return 'Profesionální video produkce a fotobudky';
    }
    if (isset($site['services'][$route])) {
        return $site['services'][$route]['title'];
    }
    if (isset($site['legal'][$route])) {
        return $site['legal'][$route]['title'];
    }

    return match ($route) {
        'portfolio' => 'Portfolio',
        'blog' => 'Blog',
        'kontakt' => 'Kontakt',
        default => 'Stránka nenalezena',
    };
}
