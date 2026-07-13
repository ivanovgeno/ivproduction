# Google recenze — jednoduché spuštění na PHP hostingu

Tato příprava zobrazí po nasazení na klasický PHP 8.4 hosting všechny Google Business Profile recenze i odpovědi IV Production. Na GitHub Pages zůstávají bezpečně viditelné stávající ukázkové recenze; PHP soubory se tam nespouštějí.

## Co musí být hotové u Google

1. Schválený přístup **Basic API Access** pro Google Business Profile API. Pokud projekt vrací kvótu `0`, je nutné nejprve dokončit schválení u Google.
2. OAuth klient typu **Web application** v Google Cloud.
3. OAuth oprávnění `https://www.googleapis.com/auth/business.manage` a vytvořený obnovovací token (refresh token).
4. ID účtu a lokace ve tvaru `accounts/{ACCOUNT_ID}/locations/{LOCATION_ID}`.

## Nasazení na hosting

1. Nahrajte celý web na hosting s **PHP 8.4**, HTTPS a rozšířením **cURL**.
2. Zkopírujte `api/private/google-reviews-config.example.php` jako `api/private/google-reviews-config.php`.
3. Vyplňte jen těchto pět údajů:
   - `google_client_id`
   - `google_client_secret`
   - `google_refresh_token`
   - `google_business_account_id`
   - `google_business_location_id`
4. Doplňte veřejné odkazy `google_maps_url` a `google_write_review_url`.
5. Složka `api/cache/` musí být zapisovatelná pro PHP (obvykle oprávnění 750 nebo 770 podle hostingu).
6. Otevřete `https://vas-web.cz/api/google-reviews.php`. Správná odpověď je JSON se stavem `ok`.

Poté se hlavní stránka přepne z ukázkových karet na aktuální Google recenze automaticky. Data se obnovují nejvýše jednou za šest hodin; při dočasném výpadku Google zůstane návštěvníkům dostupná poslední uložená verze.

## Bezpečnost

- Skutečný `google-reviews-config.php` se nikdy nenahrává do GitHubu.
- Ještě bezpečnější je uložit konfigurační soubor mimo veřejnou složku webu a nastavit na hostingu proměnnou `IVP_GOOGLE_REVIEWS_CONFIG` s jeho úplnou cestou.
- OAuth údaje nepatří do JavaScriptu, HTML ani do Google Tag Manageru.
- Soubory `api/private/` a `api/cache/` jsou pro webový prohlížeč zablokované přes `.htaccess`.
