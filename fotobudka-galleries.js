(() => {
    'use strict';

    function render(gallery, items) {
        if (!gallery || !Array.isArray(items) || !items.length) return;
        gallery.innerHTML = '';
        items.forEach((item) => {
            const figure = document.createElement('figure');
            if (item.fit === 'contain') figure.classList.add('budka-gallery-contain');
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.alt || item.title || '';
            image.loading = 'lazy';
            image.decoding = 'async';
            const caption = document.createElement('figcaption');
            caption.textContent = item.title || '';
            figure.append(image, caption);
            gallery.append(figure);
        });
    }

    async function init() {
        try {
            const response = await fetch('/api/fotobudka-galleries.php', { headers: { Accept: 'application/json' }, cache: 'no-store' });
            const data = response.ok ? await response.json() : null;
            if (data?.ok) {
                render(document.querySelector('[data-gallery-kind="photos"] .budka-gallery'), data.galleries?.photos);
                render(document.querySelector('[data-gallery-kind="backgrounds"] .budka-gallery'), data.galleries?.backgrounds);
            }
        } catch (_) {
            // Statické fotografie v HTML zůstávají bezpečnou zálohou.
        }

        document.querySelectorAll('[data-photo-gallery]').forEach((shell) => {
            const gallery = shell.querySelector('.budka-gallery');
            if (!gallery) return;
            window.IVRollingSlider?.setup({
                root: shell,
                viewport: gallery,
                itemSelector: 'figure',
                previous: shell.querySelector('[data-gallery-prev]'),
                next: shell.querySelector('[data-gallery-next]'),
                speed: 27
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
