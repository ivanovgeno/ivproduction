<?php
declare(strict_types=1);

function redirect_to_form(string $status, string $returnTo = 'kontakt.html'): void
{
    $allowedPages = [
        'kontakt.html',
        'svatby.html',
        'plesy.html',
        'reality.html',
        'fotobudka.html',
        '360budka.html',
        'reels.html',
        'konference.html',
        'podcast.html',
    ];
    if (!in_array($returnTo, $allowedPages, true)) {
        $returnTo = 'kontakt.html';
    }
    header('Location: ' . $returnTo . '?status=' . rawurlencode($status) . '#poptavka', true, 303);
    exit;
}

// The frontend uses this same-origin check to distinguish PHP hosting from a
// static GitHub Pages deployment without ever exposing credentials.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['health'] ?? '') === '1') {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo '{"ok":true,"service":"ivp-contact"}';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to_form('error');
}

$returnValue = $_POST['return_to'] ?? 'kontakt.html';
$returnTo = is_string($returnValue) ? trim($returnValue) : 'kontakt.html';

// Honeypot: bots fill this field, real visitors never see it.
if (!empty($_POST['company'] ?? '')) {
    redirect_to_form('sent', $returnTo);
}

function clean_field(string $key, int $limit = 2000): string
{
    $rawValue = $_POST[$key] ?? '';
    $values = is_array($rawValue) ? $rawValue : [$rawValue];
    $cleanValues = [];
    foreach ($values as $value) {
        if (is_array($value)) {
            continue;
        }
        $value = trim((string) $value);
        $value = preg_replace('/[\r\n]+/', ' ', $value) ?? '';
        if ($value !== '') {
            $cleanValues[] = $value;
        }
    }
    $value = implode(', ', $cleanValues);
    $value = preg_replace('/[\r\n]+/', "\n", $value) ?? '';
    return substr($value, 0, $limit);
}

$name = clean_field('name', 120);
$email = clean_field('email', 254);
$service = clean_field('service', 100);
$message = clean_field('message', 4000);
$consentValue = $_POST['consent'] ?? '';
$consent = is_string($consentValue) ? $consentValue : '';

if ($name === '' || $message === '' || $consent !== '1' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_to_form('error', $returnTo);
}

// Blocks header injection before the address is used in Reply-To.
if (preg_match('/[\r\n]/', $email)) {
    redirect_to_form('error', $returnTo);
}

$recipient = 'video@ivproduction.cz';
$subject = $service !== '' ? 'Nová poptávka – ' . $service : 'Nová poptávka z webu IV Production';

$fieldLabels = [
    'name' => 'Jméno a příjmení',
    'email' => 'E-mail',
    'phone' => 'Telefon',
    'service' => 'Služba',
    'date' => 'Termín',
    'event_date' => 'Termín',
    'address' => 'Místo / adresa',
    'event_type' => 'Typ akce',
    'package' => 'Balíček / rozsah',
    'extras' => 'Doplňkové služby',
    'guest_count' => 'Počet hostů / osob',
    'student_count' => 'Počet studentů',
    'class_count' => 'Počet tříd',
    'venue_name' => 'Název místa / sálu',
    'preferred_duration' => 'Požadovaná délka',
    'backdrop' => 'Pozadí',
    'outdoor_plan' => 'Umístění / mokrá varianta',
    'branding' => 'Grafika / branding',
    'property_type' => 'Typ nemovitosti',
    'floor_area' => 'Plocha nemovitosti',
    'listing_status' => 'Stav nabídky',
    'services' => 'Požadované služby',
    'brand' => 'Firma / značka / projekt',
    'industry' => 'Obor',
    'content_goal' => 'Cíl obsahu',
    'quantity' => 'Počet výstupů',
    'channels' => 'Kanály / formáty',
    'filming_location' => 'Místo natáčení',
    'deadline' => 'Požadovaný termín dodání',
    'event_duration' => 'Délka akce',
    'attendee_count' => 'Počet účastníků',
    'livestream_platform' => 'Platforma streamu',
    'episode_count' => 'Počet epizod',
    'episode_length' => 'Délka epizody',
    'outputs' => 'Požadované výstupy',
    'launch_date' => 'Plánovaný start',
    'message' => 'Doplňující informace',
];

$bodyLines = [];
$addedTerm = false;
foreach ($fieldLabels as $key => $label) {
    $value = clean_field($key, $key === 'message' ? 4000 : 1000);
    if ($value === '') {
        continue;
    }
    if (($key === 'date' || $key === 'event_date') && $addedTerm) {
        continue;
    }
    if ($key === 'date' || $key === 'event_date') {
        $addedTerm = true;
    }
    if ($key === 'message') {
        $bodyLines[] = '';
        $bodyLines[] = $label . ':';
        $bodyLines[] = $value;
    } else {
        $bodyLines[] = $label . ': ' . $value;
    }
}
$body = implode("\n", $bodyLines);

$headers = [
    'From: IV Production web <noreply@ivproduction.cz>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = mail($recipient, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
redirect_to_form($sent ? 'sent' : 'error', $returnTo);
