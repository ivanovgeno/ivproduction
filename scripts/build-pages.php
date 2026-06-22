<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$output = $root . '/_site';
$site = require $root . '/config/site.php';
$basePathEnv = getenv('PAGES_BASE_PATH');
$basePath = $basePathEnv === false ? '/ivproduction' : rtrim($basePathEnv, '/');

function removeDirectory(string $path): void
{
    if (!is_dir($path)) {
        return;
    }

    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($items as $item) {
        $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }

    rmdir($path);
}

function renderRoute(string $route, string $root): string
{
    $command = escapeshellarg(PHP_BINARY)
        . ' '
        . escapeshellarg($root . '/scripts/render-route.php')
        . ' '
        . escapeshellarg($route);

    $html = shell_exec($command);
    if (!is_string($html) || trim($html) === '') {
        throw new RuntimeException('Nepodařilo se vyrenderovat cestu: ' . $route);
    }

    return $html;
}

function applyBasePath(string $content, string $basePath): string
{
    if ($basePath === '') {
        return $content;
    }

    return str_replace(
        ['href="/', 'src="/', 'action="/', 'poster="/', "url('/", 'url("/'],
        [
            'href="' . $basePath . '/',
            'src="' . $basePath . '/',
            'action="' . $basePath . '/',
            'poster="' . $basePath . '/',
            "url('" . $basePath . '/',
            'url("' . $basePath . '/',
        ],
        $content
    );
}

removeDirectory($output);
mkdir($output, 0777, true);

$routes = array_merge(
    ['', 'portfolio', 'blog', 'kontakt'],
    array_keys($site['services']),
    array_keys($site['legal'])
);

foreach ($routes as $route) {
    $destination = $route === ''
        ? $output . '/index.html'
        : $output . '/' . $route . '/index.html';
    $directory = dirname($destination);

    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    file_put_contents($destination, renderRoute($route, $root));
}

file_put_contents($output . '/404.html', renderRoute('stranka-neexistuje', $root));

$allowedExtensions = [
    'avif', 'css', 'gif', 'ico', 'jpeg', 'jpg', 'js', 'json', 'm4v', 'mov',
    'mp3', 'mp4', 'ogg', 'pdf', 'png', 'svg', 'txt', 'webm', 'webp', 'woff', 'woff2', 'xml'
];
$ignoredDirectories = ['.git', '.github', '_site', 'config', 'includes', 'pages', 'scripts'];

$iterator = new RecursiveIteratorIterator(
    new RecursiveCallbackFilterIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
        static function (SplFileInfo $item) use ($ignoredDirectories): bool {
            return !$item->isDir() || !in_array($item->getFilename(), $ignoredDirectories, true);
        }
    )
);

foreach ($iterator as $file) {
    if (!$file->isFile() || !in_array(strtolower($file->getExtension()), $allowedExtensions, true)) {
        continue;
    }

    $relativePath = ltrim(str_replace($root, '', $file->getPathname()), DIRECTORY_SEPARATOR);
    $target = $output . DIRECTORY_SEPARATOR . $relativePath;
    $directory = dirname($target);

    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    copy($file->getPathname(), $target);
}

$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($output, FilesystemIterator::SKIP_DOTS)
);

foreach ($files as $file) {
    if (!$file->isFile() || !in_array(strtolower($file->getExtension()), ['html', 'css'], true)) {
        continue;
    }

    $content = file_get_contents($file->getPathname());
    if (is_string($content)) {
        file_put_contents($file->getPathname(), applyBasePath($content, $basePath));
    }
}

file_put_contents($output . '/.nojekyll', '');
echo "GitHub Pages build připraven v {$output}\n";
