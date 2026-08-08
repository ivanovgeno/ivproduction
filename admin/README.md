# Iv Production admin

Serverová administrace pro úpravu viditelného obsahu, odkazů, SEO údajů a obrázků napříč webem.

## Požadavky

- PHP 8.1 nebo novější
- zapisovatelný soubor `content/site-content.json`
- zapisovatelné složky `admin/data/history`, `admin/data` a `assets/uploads`
- HTTPS v produkci

GitHub Pages PHP nespouští. Administrace se aktivuje až po nasazení stejného repozitáře na PHP hosting.

## Přístup

Administrace je na `/admin/`. První přihlášení používá jednorázové údaje předané vlastníkovi webu. Po prvním přihlášení je nutné změnit heslo v části **Přístup**.

## Ukládání a zálohy

Publikované změny jsou v `content/site-content.json`. Před každým uložením vznikne serverová záloha; systém zachovává posledních 30 verzí. Nahraná média se ukládají do `assets/uploads` a server ověřuje skutečný MIME typ i velikost souboru.
