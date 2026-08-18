# Iv Production admin

Serverová administrace pro úpravu viditelného obsahu, odkazů, statických SEO údajů, obrázků a videí napříč webem.

## Požadavky

- PHP 8.1 nebo novější s rozšířeními Fileinfo a GD (včetně podpory WebP)
- zapisovatelný soubor `content/site-content.json`
- zapisovatelné složky `admin/data/history`, `admin/data` a `assets/uploads`
- HTTPS v produkci

GitHub Pages PHP nespouští. Administrace se aktivuje až po nasazení stejného repozitáře na PHP hosting.

## Přístup

Administrace je na `/admin/`. První přihlášení používá jednorázové údaje předané vlastníkovi webu. Po prvním přihlášení je nutné změnit heslo v části **Přístup**.

## Ukládání a zálohy

Publikované změny jsou v `content/site-content.json`. SEO titulek, meta popis, canonical, Open Graph, Twitter metadata a JSON-LD se současně zapisují přímo do HTML, aby je viděly i vyhledávače a sociální sítě bez JavaScriptu. Před každým uložením vznikne serverová záloha; systém zachovává posledních 30 verzí.

Nahraná média se ukládají do `assets/uploads` a server ověřuje skutečný MIME typ i velikost souboru. JPG, PNG, WebP a GIF se při nahrání převádějí do WebP; MP4 a WebM zůstávají ve zdrojovém formátu. Video projekty lze spravovat samostatně pomocí běžného odkazu z YouTube, YouTube Shorts či youtu.be nebo cestou k nahranému MP4/WebM.
