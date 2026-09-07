(() => {
    'use strict';

    const section = document.querySelector('[data-wedding-partner-galleries]');
    const list = section?.querySelector('[data-wedding-partner-list]');
    if (!section || !list) return;

    function createGallery(key, gallery) {
        const article = document.createElement('article');
        article.className = 'wedding-partner-gallery';
        article.dataset.partnerGallery = key;

        const header = document.createElement('header');
        header.className = 'wedding-partner-gallery__header';
        const heading = document.createElement('div');
        const eyebrow = document.createElement('p');
        eyebrow.className = 'wedding-partner-gallery__eyebrow';
        eyebrow.textContent = gallery.kind === 'photographer' ? 'Ukázky práce fotografa' : 'Ukázky partnerské služby';
        const title = document.createElement('h3');
        title.textContent = gallery.name;
        const notice = document.createElement('p');
        notice.className = 'wedding-partner-gallery__notice';
        notice.textContent = gallery.kind === 'photographer'
            ? `Všechny fotografie v tomto slideru jsou prací: ${gallery.name}.`
            : `Všechny fotografie v tomto slideru představují realizace: ${gallery.name}.`;
        heading.append(eyebrow, title, notice);
        header.append(heading);

        const slider = document.createElement('div');
        slider.className = 'premium-work-slider wedding-partner-slider';
        const previous = document.createElement('button');
        previous.type = 'button';
        previous.className = 'premium-work-slider__control';
        previous.dataset.sliderPrevious = '';
        previous.setAttribute('aria-label', `Předchozí fotografie – ${gallery.name}`);
        previous.textContent = '←';
        const viewport = document.createElement('div');
        viewport.className = 'premium-work-slider__viewport wedding-partner-slider__viewport';
        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-label', `Fotografie: ${gallery.name}`);
        gallery.images.forEach((item) => {
            const figure = document.createElement('figure');
            figure.className = 'wedding-partner-slide';
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.alt || item.title || '';
            image.loading = 'lazy';
            image.decoding = 'async';
            const caption = document.createElement('figcaption');
            const imageTitle = document.createElement('span');
            imageTitle.textContent = item.title || '';
            const credit = document.createElement('strong');
            credit.textContent = gallery.credit;
            caption.append(imageTitle, credit);
            figure.append(image, caption);
            viewport.append(figure);
        });
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'premium-work-slider__control';
        next.dataset.sliderNext = '';
        next.setAttribute('aria-label', `Další fotografie – ${gallery.name}`);
        next.textContent = '→';
        if (gallery.images.length < 2) previous.hidden = next.hidden = true;
        slider.append(previous, viewport, next);
        article.append(header, slider);
        return { article, slider, viewport, previous, next };
    }

    async function init() {
        try {
            const response = await fetch('/api/wedding-partner-galleries.php', { cache: 'no-store', headers: { Accept: 'application/json' } });
            const data = response.ok ? await response.json() : null;
            const galleries = data?.settings?.galleries || {};
            const enabled = Object.entries(galleries).filter(([, gallery]) => gallery.enabled && Array.isArray(gallery.images) && gallery.images.length);
            if (!enabled.length) return;
            const sliders = enabled.map(([key, gallery]) => createGallery(key, gallery));
            list.replaceChildren(...sliders.map(item => item.article));
            section.hidden = false;
            sliders.forEach(({ slider, viewport, previous, next }) => {
                window.IVRollingSlider?.setup({ root: slider, viewport, itemSelector: '.wedding-partner-slide', previous, next, speed: 24 });
            });
        } catch (_) {
            section.hidden = true;
        }
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
})();
