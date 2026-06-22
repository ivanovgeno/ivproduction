# Ruční FTP aktualizace — Signature V3 + Sony A7

Cílový kořen subdomény:

`/www/domains/iv.socialhero.cz/`

## Soubory pro aktuální opravu

Nahrajte nebo přepište přesně těchto pět souborů:

1. `includes/header.php`
2. `includes/footer.php`
3. `assets/css/signature-v3.css`
4. `assets/js/interaction-v3.js`
5. `assets/js/scene.js`

Hlavička a patička používají nové verzování `20260622-signature3`, takže prohlížeč nebude používat staré CSS nebo JavaScript z cache.

## Co Signature V3 obsahuje

- obnovený animovaný 24K gold foil efekt,
- zlatý shimmer na CTA tlačítkách,
- A7-style procedurální 3D fotoaparát viditelný i bez externího modelu,
- automatické nahrazení procedurálního modelu skutečným GLB modelem,
- plynulé otáčení a zoom mezi sekcemi podle scrollu,
- zlaté 3D halo prstence a jemné částice,
- vlastní kurzor,
- magnetická tlačítka,
- spotlight efekt na kartách,
- navigaci mezi sekcemi a horní scroll progress.

## Skutečný 3D model

Volitelně nahrajte licencovaný GLB model:

`assets/3d/sony-a7.glb`

Výsledná cesta:

`/www/domains/iv.socialhero.cz/assets/3d/sony-a7.glb`

Pokud model není přítomen, web zobrazí detailní procedurální A7-style fotoaparát. Po nahrání skutečného modelu se fallback automaticky nahradí.

## Doporučené pořadí

1. `signature-v3.css`
2. `interaction-v3.js`
3. `scene.js`
4. `header.php`
5. `footer.php`
6. volitelně `sony-a7.glb`

## Kontrola

Po nahrání otevřete web v anonymním okně. Lze ověřit také tyto adresy:

- `https://iv.socialhero.cz/assets/css/signature-v3.css`
- `https://iv.socialhero.cz/assets/js/interaction-v3.js`
- `https://iv.socialhero.cz/assets/js/scene.js`

Všechny tři adresy musí vracet obsah bez chyby 404.
