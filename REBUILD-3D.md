# IV Production — 3D 24K rebuild

## Větve

- `main` — současná produkční verze
- `backup/pre-php-2026-06-22` — neměnná záloha původního webu
- `feature/php-rebuild` — nový PHP základ
- `feature/3d-24k-rebuild` — kompletní cinematic 3D redesign

## Vizuální systém

Nová identita je založená na kombinaci:

- obsidian black,
- stínované 24K gold,
- champagne highlights,
- filmové zrno,
- kovové PBR materiály,
- Cormorant Garamond pro emotivní akcenty,
- Outfit pro UI a běžný text.

Zlatá není jedna plochá barva. Používá několik odstínů od hlubokého stínu přes klasické zlato až po světlý odlesk.

## 3D vrstva

Soubor `assets/js/scene.js` vytváří procedurální objektiv pomocí Three.js:

- kovové válce a prstence,
- transparentní sklo,
- devítilamelová clona,
- zlaté PBR materiály,
- částice,
- dynamická světla,
- reakce na pohyb kurzoru,
- rozložení komponent při scrollování.

Scéna se nenačítá při `prefers-reduced-motion`. Na mobilu používá nižší pixel ratio a menší počet částic.

## PHP

Minimální doporučená verze: PHP 8.2.

Web používá:

- front controller `index.php`,
- společné PHP komponenty,
- čisté URL přes `.htaccess`,
- centrální konfiguraci služeb,
- CSRF tokeny,
- honeypot ochranu formuláře,
- validaci e-mailu a povinných polí,
- Post/Redirect/Get po odeslání formuláře.

## Kontaktní formulář

Vývojová verze používá PHP `mail()`. Před ostrým spuštěním je nutné:

1. doplnit SMTP poskytovatele,
2. nastavit SPF, DKIM a DMARC,
3. otestovat doručení na `video@ivproduction.cz`,
4. přidat serverové rate limiting,
5. zapnout ukládání poptávek do databáze nebo CRM.

## Požadavky hostingu

- Apache s `mod_rewrite`, případně ekvivalentní nginx pravidla,
- PHP 8.2+,
- HTTPS,
- funkční SMTP,
- možnost nastavit bezpečnostní hlavičky,
- dostatečný limit pro budoucí upload briefů.

## Před produkčním nasazením

- převést Three.js z CDN do lokálního bundlu,
- připnout konkrétní verzi závislosti,
- nahradit dočasné obrázky finálními fotografiemi a náhledy videí,
- komprimovat obrázky do AVIF/WebP,
- připravit MP4/WebM showreel,
- otestovat Safari/iOS a slabší Android zařízení,
- provést Lighthouse a Core Web Vitals audit,
- právně zkontrolovat GDPR a obchodní podmínky,
- otestovat všechny legacy `.html` redirecty.

## Další plánované etapy

1. interaktivní showreel,
2. případové studie portfolia,
3. konfigurátor fotobudky a 360° koutku,
4. administrační rozhraní,
5. databáze poptávek,
6. SMTP a automatické odpovědi,
7. SEO strukturovaná data pro videa,
8. optimalizace a finální nasazení.
