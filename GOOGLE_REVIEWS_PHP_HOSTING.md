# Google recenze — GitHub Pages nyní, PHP hosting později

Web má dva automatické a bezpečné režimy. Na GitHub Pages načítá GitHub Actions všechny Google Business Profile recenze i odpovědi do veřejného souboru `google-reviews.json`. Po přesunu na klasický PHP 8.4 hosting web přednostně použije přímý serverový endpoint `api/google-reviews.php`. Přístupové údaje nejsou v žádné veřejné části webu.

## Co musí být hotové u Google

1. Schválený přístup **Basic API Access** pro Google Business Profile API. Pokud projekt vrací kvótu `0`, je nutné nejprve dokončit schválení u Google.
2. OAuth klient typu **Web application** v Google Cloud.
3. OAuth oprávnění `https://www.googleapis.com/auth/business.manage` a vytvořený obnovovací token (refresh token).
4. ID účtu a lokace ve tvaru `accounts/{ACCOUNT_ID}/locations/{LOCATION_ID}`.

## Spuštění teď na GitHub Pages

1. Otevřete repozitář **ivanovgeno/ivproduction** na GitHubu.
2. Klikněte nahoře na **Settings** → vlevo **Secrets and variables** → **Actions**.
3. Zvolte **New repository secret** a postupně založte těchto pět Secrets. Hodnoty nikam jinam nevkládejte:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_BUSINESS_ACCOUNT_ID`
   - `GOOGLE_BUSINESS_LOCATION_ID`
4. V **Settings** → **Actions** → **General** přejděte úplně dolů na **Workflow permissions** a zvolte **Read and write permissions**. Potvrďte **Save**.
5. Otevřete záložku **Actions**, vyberte workflow **Synchronizovat Google recenze**, klikněte **Run workflow** a potom zelené **Run workflow**.
6. Po úspěšném dokončení se automaticky vytvoří commit s `google-reviews.json`. Během několika minut se aktuální recenze objeví na GitHub Pages.

Workflow se pak spustí automaticky každých 6 hodin. V případě dočasné chyby Google zůstane na webu poslední úspěšně uložená verze.

### Když se workflow nezdaří

- Chyba `quota_limit_value: 0` znamená, že Google ještě neschválil **Basic API Access**. Po schválení spusťte workflow znovu.
- Chyba o chybějícím Secretu znamená, že se název v GitHubu neshoduje přesně s názvem uvedeným výše.
- Ověřte, že OAuth klient má oprávnění `https://www.googleapis.com/auth/business.manage` a že refresh token patří stejnému Google účtu, který spravuje firemní profil.

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

Poté se hlavní stránka přepne na aktuální Google recenze automaticky. PHP endpoint data ukládá nejvýše jednou za šest hodin; při dočasném výpadku Google zůstane návštěvníkům dostupná poslední uložená verze. Soubor z GitHub Actions zůstává navíc jako bezpečná záloha.

## Bezpečnost

- Skutečný `google-reviews-config.php` se nikdy nenahrává do GitHubu.
- Ještě bezpečnější je uložit konfigurační soubor mimo veřejnou složku webu a nastavit na hostingu proměnnou `IVP_GOOGLE_REVIEWS_CONFIG` s jeho úplnou cestou.
- OAuth údaje nepatří do JavaScriptu, HTML ani do Google Tag Manageru.
- Soubory `api/private/` a `api/cache/` jsou pro webový prohlížeč zablokované přes `.htaccess`.
