(() => {
    'use strict';

    const categoryKeys = ['cameras', 'lenses', 'stabilization', 'audioLights'];

    function createItem(item) {
        const card = document.createElement('div');
        card.className = 'tech-item';
        card.dataset.equipmentId = String(item.id || '');

        if (item.image) {
            const image = document.createElement('img');
            image.className = 'tech-img';
            image.src = item.image;
            image.alt = item.alt || item.name || '';
            image.width = 1024;
            image.height = 1024;
            image.decoding = 'async';
            image.loading = 'lazy';
            card.append(image);
        } else {
            const empty = document.createElement('div');
            empty.className = 'tech-media-empty';
            empty.setAttribute('aria-hidden', 'true');
            card.append(empty);
        }

        const name = document.createElement('div');
        name.className = 'tech-name';
        name.textContent = item.name || '';
        const description = document.createElement('div');
        description.className = 'tech-desc';
        description.textContent = item.description || '';
        card.append(name, description);
        return card;
    }

    function render(data) {
        const categories = data?.equipment?.categories;
        if (!categories) return;
        categoryKeys.forEach(key => {
            const grid = document.querySelector(`[data-equipment-category="${key}"]`);
            if (!grid || !Array.isArray(categories[key])) return;
            grid.replaceChildren(...categories[key].map(createItem));
        });
        document.dispatchEvent(new CustomEvent('ivp:equipment-rendered'));
    }

    fetch('/api/equipment.php', { cache: 'no-store', credentials: 'same-origin' })
        .then(response => response.ok ? response.json() : null)
        .then(render)
        .catch(() => { /* The HTML fallback remains fully usable. */ });
})();
