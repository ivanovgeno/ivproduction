# Nasazení na WEDOS

## 1. Vytvoření čistého balíčku

Spusťte:

```bash
node scripts/build-wedos-package.mjs
```

Na hosting nahrajte **obsah** složky `release/wedos`, nikoli celý pracovní repozitář. Balíček neobsahuje GitHub workflow, vývojové skripty, dokumentaci ani historické zálohy.

## 2. Nastavení hostingu

- nastavte PHP 8.5 (web vyžaduje minimálně PHP 8.1);
- zapněte rozšíření Fileinfo a GD s podporou WebP;
- aktivujte HTTPS certifikát pro `ivproduction.cz` i `www.ivproduction.cz`;
- ověřte, že WEDOS respektuje soubory `.htaccess`;
- ponechte zapisovatelný webový kořen a zejména `content`, `admin/data`, `assets/uploads` a `portfolio-data.js` pro administrační rozhraní.

Google recenze zůstávají v ručním režimu. Soubor `api/private/google-reviews-config.php` se vytváří až při budoucím zapnutí schváleného Google API a do veřejného repozitáře nepatří.

## 3. Povinný test po nahrání

1. Otevřete `/kontakt-handler.php?health=1`; očekávaná odpověď obsahuje `"ok":true`.
2. Odešlete testovací poptávku a ověřte její přijetí na `video@ivproduction.cz` i složku Spam.
3. Přihlaste se do `/admin/`, ihned změňte jednorázové heslo a nahrajte zkušební JPG. Výsledkem musí být WebP v `assets/uploads`.
4. Uložte zkušební změnu textu a následně ji vraťte. Tím se ověří zápis do HTML, JSON a historie.
5. Zkontrolujte, že HTTP a doména bez `www` přesměrují na `https://www.ivproduction.cz/` a neexistující URL zobrazí vlastní stránku 404.
6. Ověřte volby „Pouze nezbytné“ a „Povolit externí obsah“ pro mapu, Matterport a YouTube.

## 4. SEO migrace z Webnode

- Doménu nepřevádějte na jiný název; mění se pouze hosting.
- Před změnou DNS nahrajte a otestujte celý balíček na WEDOSu.
- Na WEDOSu musí zůstat soubor `.htaccess`. Udržuje historické Webnode URL a všechny ostatní staré adresy směruje jediným přesměrováním 301 na nejbližší obsah.
- Po přepnutí DNS ověřte `https://www.ivproduction.cz/robots.txt` a `https://www.ivproduction.cz/sitemap.xml`.
- V Google Search Console ponechte stejnou službu domény a znovu odešlete sitemapu. Nástroj Změna adresy se nepoužívá, protože doména zůstává stejná.
- Webnode nerušte, dokud na nové doméně neprojdou formuláře, HTTPS, staré URL a několikadenní kontrola indexace.

Přímý upload videa je omezen nižší hodnotou z limitu aplikace 200 MB a aktuálního PHP limitu hostingu. Pro větší videa používejte v administraci YouTube odkaz.
