<?php
declare(strict_types=1);

require __DIR__ . '/../inc/bootstrap.php';
require __DIR__ . '/../../api/integrations-store.php';
ivp_require_auth(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ivp_json(['ok' => true, 'settings' => ivp_integrations_load(), 'definitions' => ivp_integration_definitions()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ivp_json(['ok' => false, 'error' => 'Nepodporovaná metoda.'], 405);
ivp_require_csrf();
$current = ivp_integrations_load();
$clean = ivp_integrations_clean(ivp_read_payload());
if ($clean === null) ivp_json(['ok' => false, 'error' => 'Některé ID nemá správný formát nebo je zapnutá služba bez vyplněného ID.'], 422);
$clean['version'] = ((int) ($current['version'] ?? 0)) + 1;
$clean['updatedBy'] = (string) ($_SESSION['ivp_user'] ?? 'admin');
if (!ivp_integrations_write($clean)) ivp_json(['ok' => false, 'error' => 'Integrace se nepodařilo uložit.'], 500);
ivp_json(['ok' => true, 'message' => 'Integrace byly uloženy a publikovány.', 'settings' => $clean]);
