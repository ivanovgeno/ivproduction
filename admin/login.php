<?php
require __DIR__ . '/inc/bootstrap.php';
if (ivp_is_logged_in()) { header('Location: index.php'); exit; }
$error = '';
$rateFile = IVP_ADMIN . '/data/login-rate.json';
$rateKey = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$rates = json_decode((string) @file_get_contents($rateFile), true);
$rates = is_array($rates) ? $rates : [];
$attempt = $rates[$rateKey] ?? ['count' => 0, 'since' => time()];
if (time() - (int) $attempt['since'] > 900) $attempt = ['count' => 0, 'since' => time()];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ((int) $attempt['count'] >= 8) {
        $error = 'Příliš mnoho pokusů. Zkuste přihlášení znovu za 15 minut.';
    } else {
    $config = ivp_config();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $computed = hash_pbkdf2('sha256', $password, (string) $config['password_salt'], (int) $config['password_iterations'], 64, false);
    if (hash_equals((string) $config['username'], $username) && hash_equals((string) $config['password_hash'], $computed)) {
        session_regenerate_id(true);
        $_SESSION['ivp_user'] = $username;
        $_SESSION['ivp_last_activity'] = time();
        unset($rates[$rateKey]);
        @file_put_contents($rateFile, json_encode($rates), LOCK_EX);
        header('Location: index.php'); exit;
    }
    $attempt['count'] = (int) $attempt['count'] + 1;
    $rates[$rateKey] = $attempt;
    @file_put_contents($rateFile, json_encode($rates), LOCK_EX);
    usleep(350000);
    $error = 'Nesprávné uživatelské jméno nebo heslo.';
    }
}
?>
<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Přihlášení | Iv Production</title><link rel="stylesheet" href="assets/admin.css?v=20260827-final"></head><body class="login-page"><main class="login-card"><img src="../logo-light.png" alt="Iv Production"><p class="eyebrow">SPRÁVA WEBU</p><h1>Vítejte zpět</h1><p class="muted">Přihlaste se pro úpravu obsahu webu.</p><?php if ($error): ?><div class="login-error"><?= htmlspecialchars($error) ?></div><?php endif; ?><form method="post" class="form-stack"><label>Uživatelské jméno<input name="username" autocomplete="username" required autofocus></label><label>Heslo<input type="password" name="password" autocomplete="current-password" required></label><button class="primary" type="submit">Přihlásit se</button></form><a class="back-link" href="../">← Zpět na web</a></main></body></html>
