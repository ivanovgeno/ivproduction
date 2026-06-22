# Ruční FTP aktualizace — Elite V2 + Sony A7

Cílový kořen subdomény:

`/www/domains/iv.socialhero.cz/`

## Povinné soubory

Nahrajte nebo přepište přesně tyto soubory a zachovejte jejich složky:

1. `includes/header.php`
2. `includes/footer.php`
3. `assets/css/forms-services.css`
4. `assets/css/elite-v2.css`
5. `assets/css/camera-scene.css`
6. `assets/css/camera-scene-layer.css`
7. `assets/js/scene.js`

Soubory `header.php` a `footer.php` obsahují verzování assetů. Bez nich může prohlížeč dál zobrazovat starý vzhled z cache.

## Skutečný 3D model

Pro zobrazení 3D fotoaparátu nahrajte licencovaný GLB model:

8. `assets/3d/sony-a7.glb`

Pokud složka `assets/3d/` neexistuje, vytvořte ji. Název souboru musí být přesně `sony-a7.glb`.

Bez skutečného modelu se 3D scéna nezobrazí. Záměrně už nepoužíváme procedurální fallback, protože nepůsobil dostatečně realisticky. Web bez modelu zůstane čistý a plně funkční.

## Doporučené pořadí nahrávání

1. nejprve všechny CSS soubory,
2. potom `scene.js`,
3. potom `header.php` a `footer.php`,
4. nakonec volitelný `sony-a7.glb`.

Po nahrání otevřete web v anonymním okně. Díky verzování by nemělo být nutné ruční mazání cache, ale lze použít také `Ctrl + F5`.

## Kontrolní adresy

- `https://iv.socialhero.cz/assets/css/elite-v2.css`
- `https://iv.socialhero.cz/assets/css/forms-services.css`
- `https://iv.socialhero.cz/assets/js/scene.js`
- `https://iv.socialhero.cz/assets/3d/sony-a7.glb` — pouze pokud byl model nahrán

Pokud první tři adresy vrací obsah nebo soubor bez chyby 404, Elite V2 assety jsou na serveru. Pokud GLB vrací 404, web bude fungovat bez 3D kamery.
