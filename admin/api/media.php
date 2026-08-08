<?php
require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $files = [];
    foreach (glob(IVP_UPLOADS . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: [] as $file) {
        $files[] = ['name' => basename($file), 'url' => 'assets/uploads/' . rawurlencode(basename($file)), 'size' => filesize($file), 'date' => date('c', filemtime($file))];
    }
    usort($files, static fn(array $a, array $b): int => strcmp($b['date'], $a['date']));
    ivp_json(['ok' => true, 'items' => $files]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) ivp_json(['ok' => false, 'error' => 'Soubor se nepodařilo nahrát.'], 422);
$upload = $_FILES['file'];
if ((int) $upload['size'] > 8 * 1024 * 1024) ivp_json(['ok' => false, 'error' => 'Obrázek je větší než 8 MB.'], 422);
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($upload['tmp_name']);
$types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
if (!isset($types[$mime])) ivp_json(['ok' => false, 'error' => 'Povolené jsou JPG, PNG, WebP a GIF.'], 422);
if (@getimagesize($upload['tmp_name']) === false) ivp_json(['ok' => false, 'error' => 'Soubor není platný obrázek.'], 422);
if (!is_dir(IVP_UPLOADS)) mkdir(IVP_UPLOADS, 0755, true);
$base = preg_replace('/[^a-z0-9-]+/', '-', strtolower(pathinfo((string) $upload['name'], PATHINFO_FILENAME)));
$base = trim((string) $base, '-') ?: 'obrazek';
$name = $base . '-' . date('Ymd-His') . '.' . $types[$mime];
if (!move_uploaded_file($upload['tmp_name'], IVP_UPLOADS . '/' . $name)) ivp_json(['ok' => false, 'error' => 'Server nemůže obrázek uložit.'], 500);
ivp_json(['ok' => true, 'message' => 'Obrázek byl nahrán.', 'item' => ['name' => $name, 'url' => 'assets/uploads/' . rawurlencode($name)]]);
