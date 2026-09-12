<?php
declare(strict_types=1);

const IVP_INTEGRATIONS_FILE = __DIR__ . '/../admin/data/integrations.json';

function ivp_integration_definitions(): array
{
    return [
        'gtm' => ['label' => 'Google Tag Manager', 'placeholder' => 'GTM-XXXXXXX', 'pattern' => '~^GTM-[A-Z0-9]{4,12}$~i],
        'ga4' => ['label' => 'Google Analytics 4', 'placeholder' => 'G-XXXXXXXXXX', 'pattern' => '~^G-[A-Z0-9]{5,15}$~i],
        'googleAds' => ['label' => 'Google Ads a remarketing', 'placeholder' => 'AW-123456789', 'pattern' => '~^AW-[0-9]{5,15}$~i', 'extra' => 'conversionLabel'],
        'metaPixel' => ['label' => 'Meta Pixel', 'placeholder' => '123456789012345', 'pattern' => '~^[0-9]{5,20}$~'],
        'microsoftClarity' => ['label' => 'Microsoft Clarity', 'placeholder' => 'abc123def4', 'pattern' => '~^[a-z0-9]{5,20}$~i],
        'tiktokPixel' => ['label' => 'TikTok Pixel', 'placeholder' => 'CXXXXXXXXXXXXXXXXX', 'pattern' => '~^[A-Z0-9]{10,30}$~i],
        'linkedinInsight' => ['label' => 'LinkedIn Insight Tag', 'placeholder' => '1234567', 'pattern' => '~^[0-9]{3,15}$~'],
        'pinterestTag' => ['label' => 'Pinterest Tag', 'placeholder' => '1234567890123', 'pattern' => '~^[0-9]{5,30}$~'],
        'sklikRetargeting' => ['label' => 'Sklik retargeting', 'placeholder' => '123456', 'pattern' => '~^[0-9]{3,20}$~'],
        'hotjar' => ['label' => 'Hotjar', 'placeholder' => '1234567', 'pattern' => '~^[0-9]{3,15}$~'],
    ];
}

function ivp_integrations_defaults(): array
{
    $providers = [];
    foreach (ivp_integration_definitions() as $key => $definition) {
        $providers[$key] = ['enabled' => false, 'id' => ''];
        if (($definition['extra'] ?? '') === 'conversionLabel') $providers[$key]['conversionLabel'] = '';
    }
    return ['version' => 1, 'updatedAt' => null, 'leadTracking' => true, 'providers' => $providers];
}

function ivp_integrations_load(): array
{
    $defaults = ivp_integrations_defaults();
    $saved = json_decode((string) @file_get_contents(IVP_INTEGRATIONS_FILE), true);
    if (!is_array($saved)) return $defaults;
    $defaults['version'] = max(1, (int) ($saved['version'] ?? 1));
    $defaults['updatedAt'] = $saved['updatedAt'] ?? null;
    $defaults['leadTracking'] = (bool) ($saved['leadTracking'] ?? true);
    foreach ($defaults['providers'] as $key => $provider) {
        $stored = $saved['providers'][$key] ?? null;
        if (!is_array($stored)) continue;
        $defaults['providers'][$key]['enabled'] = (bool) ($stored['enabled'] ?? false);
        $defaults['providers'][$key]['id'] = trim((string) ($stored['id'] ?? ''));
        if (array_key_exists('conversionLabel', $provider)) {
            $defaults['providers'][$key]['conversionLabel'] = trim((string) ($stored['conversionLabel'] ?? ''));
        }
    }
    return $defaults;
}

function ivp_integrations_clean(array $payload): ?array
{
    $incoming = $payload['providers'] ?? null;
    if (!is_array($incoming)) return null;
    $providers = [];
    foreach (ivp_integration_definitions() as $key => $definition) {
        $item = $incoming[$key] ?? null;
        if (!is_array($item)) return null;
        $id = strtoupper(trim((string) ($item['id'] ?? '')));
        if (in_array($key, ['microsoftClarity'], true)) $id = strtolower($id);
        $enabled = (bool) ($item['enabled'] ?? false);
        if ($id !== '' && !preg_match((string) $definition['pattern'], $id)) return null;
        if ($enabled && $id === '') return null;
        $providers[$key] = ['enabled' => $enabled, 'id' => $id];
        if (($definition['extra'] ?? '') === 'conversionLabel') {
            $label = trim((string) ($item['conversionLabel'] ?? ''));
            if ($label !== '' && !preg_match('~^[A-Za-z0-9_-]{3,100}$~', $label)) return null;
            $providers[$key]['conversionLabel'] = $label;
        }
    }
    return [
        'version' => max(1, (int) ($payload['version'] ?? 1)),
        'updatedAt' => gmdate('c'),
        'leadTracking' => (bool) ($payload['leadTracking'] ?? true),
        'providers' => $providers,
    ];
}

function ivp_integrations_write(array $data): bool
{
    $directory = dirname(IVP_INTEGRATIONS_FILE);
    if (!is_dir($directory) && !@mkdir($directory, 0750, true) && !is_dir($directory)) return false;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $temporary = IVP_INTEGRATIONS_FILE . '.tmp';
    if (@file_put_contents($temporary, $json . "\n", LOCK_EX) !== false && @rename($temporary, IVP_INTEGRATIONS_FILE)) return true;
    @unlink($temporary);
    return @file_put_contents(IVP_INTEGRATIONS_FILE, $json . "\n", LOCK_EX) !== false;
}
