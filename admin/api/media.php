<?php
require __DIR__ . '/../inc/bootstrap.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $files = [];
    foreach (glob(IVP_UPLOADS . '/*.{webp,mp4,webm}', GLOB_BRACE) ?: [] as $file) {
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $files[] = [
            'name' => basename($file),
            'url' => 'assets/uploads/' . rawurlencode(basename($file)),
            'size' => filesize($file),
            'date' => date('c', filemtime($file)),
            'type' => in_array($extension, ['mp4', 'webm'], true) ? 'video' : 'image',
        ];
    }
    usort($files, static fn(array $a, array $b): int => strcmp($b['date'], $a['date']));
    ivp_json(['ok' => true, 'items' => $files]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
if (!isset($_FILES['file'])) ivp_json(['ok' => false, 'error' => 'Vyberte soubor k nahrání.'], 422);
$upload = $_FILES['file'];
if ($upload['error'] !== UPLOAD_ERR_OK) {
    $message = in_array($upload['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
        ? 'Soubor překračuje limit nastavený na hostingu.'
        : 'Soubor se nepodařilo nahrát.';
    ivp_json(['ok' => false, 'error' => $message], 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string) $finfo->file($upload['tmp_name']);
$imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$videoTypes = ['video/mp4' => 'mp4', 'video/webm' => 'webm'];
$isImage = in_array($mime, $imageTypes, true);
$isVideo = isset($videoTypes[$mime]);
if (!$isImage && !$isVideo) ivp_json(['ok' => false, 'error' => 'Povolené jsou obrázky JPG, PNG, WebP a GIF nebo videa MP4 a WebM.'], 422);

$limit = $isVideo ? 200 * 1024 * 1024 : 12 * 1024 * 1024;
if ((int) $upload['size'] > $limit) {
    ivp_json(['ok' => false, 'error' => $isVideo ? 'Video je větší než 200 MB.' : 'Obrázek je větší než 12 MB.'], 422);
}
if (!is_dir(IVP_UPLOADS) && !mkdir(IVP_UPLOADS, 0755, true) && !is_dir(IVP_UPLOADS)) {
    ivp_json(['ok' => false, 'error' => 'Server nemůže vytvořit složku pro média.'], 500);
}

$base = preg_replace('/[^a-z0-9-]+/', '-', strtolower(pathinfo((string) $upload['name'], PATHINFO_FILENAME)));
$base = trim((string) $base, '-') ?: ($isVideo ? 'video' : 'obrazek');
$suffix = date('Ymd-His') . '-' . bin2hex(random_bytes(2));

if ($isVideo) {
    $name = $base . '-' . $suffix . '.' . $videoTypes[$mime];
    if (!move_uploaded_file($upload['tmp_name'], IVP_UPLOADS . '/' . $name)) ivp_json(['ok' => false, 'error' => 'Server nemůže video uložit.'], 500);
    ivp_json(['ok' => true, 'message' => 'Video bylo nahráno.', 'item' => ['name' => $name, 'url' => 'assets/uploads/' . rawurlencode($name), 'type' => 'video']]);
}

$size = @getimagesize($upload['tmp_name']);
if ($size === false || ($size[0] * $size[1]) > 40000000) ivp_json(['ok' => false, 'error' => 'Soubor není platný obrázek nebo má příliš velké rozměry.'], 422);
if (!function_exists('imagecreatefromstring') || !function_exists('imagewebp')) {
    ivp_json(['ok' => false, 'error' => 'Hosting nemá zapnutou PHP knihovnu GD s podporou WebP.'], 500);
}
$binary = file_get_contents($upload['tmp_name']);
$image = $binary === false ? false : @imagecreatefromstring($binary);
if ($image === false) ivp_json(['ok' => false, 'error' => 'Obrázek se nepodařilo načíst.'], 422);
if (function_exists('imagepalettetotruecolor')) @imagepalettetotruecolor($image);
imagealphablending($image, true);
imagesavealpha($image, true);
$name = $base . '-' . $suffix . '.webp';
$saved = imagewebp($image, IVP_UPLOADS . '/' . $name, 84);
imagedestroy($image);
if (!$saved) ivp_json(['ok' => false, 'error' => 'Server nemůže obrázek převést do WebP.'], 500);
ivp_json(['ok' => true, 'message' => 'Obrázek byl převeden do WebP a nahrán.', 'item' => ['name' => $name, 'url' => 'assets/uploads/' . rawurlencode($name), 'type' => 'image']]);
