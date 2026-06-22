# Ruční FTP aktualizace — Sony A7 scéna

Cílový kořen subdomény:

`/www/domains/iv.socialhero.cz/`

Nahrajte nebo přepište tyto soubory:

1. `assets/js/scene.js`
2. `assets/css/camera-scene.css`
3. `assets/css/camera-scene-layer.css`

Volitelně nahrajte licencovaný skutečný model:

4. `assets/3d/sony-a7.glb`

Pokud složka `assets/3d/` neexistuje, vytvořte ji. Název souboru musí být přesně `sony-a7.glb`.

Model není nutný pro spuštění webu. Bez něj se automaticky zobrazí vestavěný procedurální A7-style fotoaparát.

Po nahrání vymažte cache prohlížeče nebo použijte `Ctrl + F5`.

## Kontrola

- `https://iv.socialhero.cz/assets/js/scene.js`
- `https://iv.socialhero.cz/assets/css/camera-scene.css`
- `https://iv.socialhero.cz/assets/css/camera-scene-layer.css`
- `https://iv.socialhero.cz/assets/3d/sony-a7.glb` — pouze pokud byl model nahrán

Pokud model vrací chybu 404, web použije fallback kameru. Pokud se po nahrání modelu nezobrazí, zkontrolujte velikost souboru, název a oprávnění souboru.
