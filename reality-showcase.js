(() => {
    'use strict';

    const assetRoot = 'https://65d021d505.clvaw-cdnwnd.com/1c9a9ecdaf9b7ec4fb8d143d0ee9db08';
    const assetQuery = '?ph=65d021d505';
    const photos = [
        ['200001273-95f3295f34', '7M3%20%2810%29.webp'],
        ['200001277-bc36cbc397', '7M3%20%281%29.webp'],
        ['200001279-566c7566c9', '7M3%20%282%29.webp'],
        ['200001276-db48edb490', '7M3%20%283%29.webp'],
        ['200001281-8872488726', '7M3%20%284%29.webp'],
        ['200001283-2281e22820', '7M3%20%285%29.webp'],
        ['200001285-dd789dd78c', '7M3%20%286%29.webp'],
        ['200001289-b9489b948b', '7M3%20%288%29.webp'],
        ['200001294-802fb802fd', '7M3%20%289%29.webp'],
        ['200001295-a1202a1204', '7M3%20%2811%29.webp'],
        ['200001296-8eb4a8eb4d', '7M3%20%2812%29.webp'],
        ['200001297-b2088b208a', '7M3%20%2813%29.webp']
    ].map(([asset, file], index) => ({
        alt: `Ukázka profesionální realitní fotografie ${index + 1}`,
        full: `${assetRoot}/${asset}/${file}${assetQuery}`,
        thumb: `${assetRoot}/${asset}/700/${file}${assetQuery}`,
        title: `Realitní fotografie ${String(index + 1).padStart(2, '0')}`
    }));

    let lightbox;
    let lastTrigger;

    function ensureLightbox() {
        if (lightbox) return lightbox;
        lightbox = document.createElement('div');
        lightbox.className = 'reality-photo-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.innerHTML = `
            <div class="reality-photo-lightbox__backdrop" data-photo-close></div>
            <section class="reality-photo-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Náhled realitní fotografie">
                <button class="reality-photo-lightbox__close" type="button" data-photo-close aria-label="Zavřít fotografii">×</button>
                <img class="reality-photo-lightbox__image" alt="">
                <p class="reality-photo-lightbox__caption"></p>
            </section>`;
        document.body.append(lightbox);
        lightbox.querySelectorAll('[data-photo-close]').forEach((element) => element.addEventListener('click', closeLightbox));
        return lightbox;
    }

    function openPhoto(index, trigger) {
        const photo = photos[index];
        if (!photo) return;
        const modal = ensureLightbox();
        const image = modal.querySelector('.reality-photo-lightbox__image');
        image.src = photo.full;
        image.alt = photo.alt;
        modal.querySelector('.reality-photo-lightbox__caption').textContent = photo.title;
        lastTrigger = trigger;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.querySelector('.reality-photo-lightbox__close').focus();
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.querySelector('.reality-photo-lightbox__image').src = '';
        document.body.style.overflow = '';
        lastTrigger?.focus();
    }

    function photoCard(photo, index) {
        return `
            <button class="premium-work-slide reality-photo-slide" type="button" data-reality-photo="${index}" aria-label="Zvětšit: ${photo.title}">
                <img src="${photo.thumb}" alt="${photo.alt}" loading="lazy">
                <span class="portfolio-overlay">
                    <span class="portfolio-category">Realitní fotografie</span>
                    <span class="portfolio-title">${photo.title}</span>
                </span>
            </button>`;
    }

    function initPhotoSlider() {
        const slider = document.querySelector('[data-reality-photo-slider]');
        const viewport = slider?.querySelector('[data-reality-photo-track]');
        if (!slider || !viewport || photos.length < 2) return;

        viewport.innerHTML = photos.map(photoCard).join('');
        window.IVRollingSlider?.setup({
            root: slider,
            viewport,
            itemSelector: '[data-reality-photo]',
            previous: slider.querySelector('[data-photo-previous]'),
            next: slider.querySelector('[data-photo-next]'),
            speed: 28
        });
        viewport.addEventListener('click', (event) => {
            const trigger = event.target instanceof Element
                ? event.target.closest('[data-reality-photo]')
                : null;
            if (trigger) openPhoto(Number.parseInt(trigger.dataset.realityPhoto, 10), trigger);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeLightbox();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPhotoSlider, { once: true });
    } else {
        initPhotoSlider();
    }
})();
