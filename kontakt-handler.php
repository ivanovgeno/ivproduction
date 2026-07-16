<?php
declare(strict_types=1);

function redirect_to_contact(string $status): void
{
    header('Location: kontakt.html?status=' . rawurlencode($status), true, 303);
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
    redirect_to_contact('error');
}

// Honeypot: bots fill this field, real visitors never see it.
if (!empty($_POST['company'] ?? '')) {
    redirect_to_contact('sent');
}

function clean_field(string $key, int $limit = 2000): string
{
    $value = trim((string) ($_POST[$key] ?? ''));
    $value = preg_replace('/[\r\n]+/', "\n", $value) ?? '';
    return substr($value, 0, $limit);
}

$name = clean_field('name', 120);
$email = clean_field('email', 254);
$phone = clean_field('phone', 80);
$service = clean_field('service', 100);
$date = clean_field('date', 40);
$eventDate = clean_field('event_date', 40);
$address = clean_field('address', 200);
$message = clean_field('message', 4000);
$consent = (string) ($_POST['consent'] ?? '');

if ($name === '' || $message === '' || $consent !== '1' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_to_contact('error');
}

// Blocks header injection before the address is used in Reply-To.
if (preg_match('/[\r\n]/', $email)) {
    redirect_to_contact('error');
}

$recipient = 'video@ivproduction.cz';
$subject = 'Nová poptávka z webu IV Production';
$body = implode("\n", [
    'Jméno: ' . $name,
    'E-mail: ' . $email,
    'Telefon: ' . ($phone !== '' ? $phone : 'neuveden'),
    'Služba: ' . ($service !== '' ? $service : 'neuvedena'),
    'Termín: ' . ($date !== '' ? $date : ($eventDate !== '' ? $eventDate : 'neuveden')),
    'Místo konání: ' . ($address !== '' ? $address : 'neuvedeno'),
    '',
    'Zpráva:',
    $message,
]);

$headers = [
    'From: IV Production web <noreply@ivproduction.cz>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = mail($recipient, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
redirect_to_contact($sent ? 'sent' : 'error');
