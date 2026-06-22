<?php

declare(strict_types=1);

session_start();

$site = require __DIR__ . '/config/site.php';
require __DIR__ . '/includes/functions.php';

$route = current_path();
$route = preg_replace('/\.(php|html)$/', '', $route) ?? '';
if ($route === 'index') {
    $route = '';
}

if ($route === 'kontakt' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = (string) ($_POST['csrf_token'] ?? '');
    $honeypot = trim((string) ($_POST['website'] ?? ''));
    $name = trim((string) ($_POST['name'] ?? ''));
    $email = filter_var(trim((string) ($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    $phone = trim((string) ($_POST['phone'] ?? ''));
    $serviceName = trim((string) ($_POST['service'] ?? ''));
    $date = trim((string) ($_POST['date'] ?? ''));
    $location = trim((string) ($_POST['location'] ?? ''));
    $budget = trim((string) ($_POST['budget'] ?? ''));
    $message = trim((string) ($_POST['message'] ?? ''));
    $consent = isset($_POST['consent']);

    if ($honeypot !== '') {
        header('Location: /kontakt', true, 303);
        exit;
    }

    if (!verify_csrf($token)) {
        flash('error', 'Platnost formuláře vypršela. Obnovte stránku a odešlete jej znovu.');
    } elseif ($name === '' || !$email || $message === '' || !$consent) {
        flash('error', 'Vyplňte jméno, platný e-mail, zprávu a potvrďte souhlas se zpracováním údajů.');
    } else {
        $subject = 'Nová poptávka z webu IV Production';
        $body = implode("\n", [
            'Jméno: ' . $name,
            'E-mail: ' . $email,
            'Telefon: ' . $phone,
            'Služba: ' . $serviceName,
            'Termín: ' . $date,
            'Místo: ' . $location,
            'Rozpočet: ' . $budget,
            '',
            'Zpráva:',
            $message,
        ]);
        $headers = 'From: web@ivproduction.cz' . "\r\n" .
            'Reply-To: ' . $email . "\r\n" .
            'Content-Type: text/plain; charset=UTF-8';

        if (mail($site['email'], $subject, $body, $headers)) {
            flash('success', 'Děkujeme. Poptávku jsme přijali a ozveme se co nejdříve.');
            unset($_SESSION['csrf_token']);
        } else {
            flash('error', 'Poptávku se nepodařilo odeslat. Napište nám prosím přímo na ' . $site['email'] . '.');
        }
    }

    header('Location: /kontakt', true, 303);
    exit;
}

$allowedRoutes = array_merge(
    ['', 'portfolio', 'blog', 'kontakt'],
    array_keys($site['services']),
    array_keys($site['legal'])
);

if (!in_array($route, $allowedRoutes, true)) {
    http_response_code(404);
    $route = '404';
}

$pageTitle = route_title($site, $route);
require __DIR__ . '/includes/header.php';

if ($route === '') {
    require __DIR__ . '/pages/home.php';
} elseif (isset($site['services'][$route])) {
    $service = $site['services'][$route];
    require __DIR__ . '/pages/service.php';
} elseif ($route === 'portfolio') {
    require __DIR__ . '/pages/portfolio.php';
} elseif ($route === 'blog') {
    require __DIR__ . '/pages/blog.php';
} elseif ($route === 'kontakt') {
    require __DIR__ . '/pages/contact.php';
} elseif (isset($site['legal'][$route])) {
    $legal = $site['legal'][$route];
    require __DIR__ . '/pages/legal.php';
} else {
    require __DIR__ . '/pages/404.php';
}

require __DIR__ . '/includes/footer.php';
