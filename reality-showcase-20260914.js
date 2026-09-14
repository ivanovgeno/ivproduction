(() => {
    'use strict';

    let photos = [];
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
        lightbox.querySelectorAll('[data-photo-close]').forEach(element => element.addEventListener('click', closeLightbox));
        return lightbox;
    }

    function openPhoto(index, trigger) {
        const photo = photos[index];
        if (!photo) return;
        const modal = ensureLightbox();
        const image = modal.querySelector('.reality-photo-lightbox__image');
        image.src = photo.full || photo.image;
        image.alt = photo.alt || photo.title;
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
        const button = document.createElement('button');
        button.className = 'premium-work-slide reality-photo-slide';
        button.type = 'button';
        button.dataset.realityPhoto = String(index);
        button.setAttribute('aria-label', `Zvětšit: ${photo.title}`);
        const image = document.createElement('img');
        image.src = photo.image;
        image.alt = photo.alt || photo.title;
        image.loading = 'lazy';
        const overlay = document.createElement('span');
        overlay.className = 'portfolio-overlay';
        const category = document.createElement('span');
        category.className = 'portfolio-category';
        category.textContent = 'Realitní fotografie';
        const title = document.createElement('span');
        title.className = 'portfolio-title';
        title.textContent = photo.title;
        overlay.append(category, title);
        button.append(image, overlay);
        return button;
    }

    function renderPhotos(settings) {
        const section = document.querySelector('[data-reality-photo-showcase]');
        const slider = section?.querySelector('[data-reality-photo-slider]');
        const viewport = slider?.querySelector('[data-reality-photo-track]');
        photos = settings?.photos?.enabled && Array.isArray(settings.photos.images) ? settings.photos.images : [];
        if (!section || !slider || !viewport) return;
        section.hidden = photos.length === 0;
        if (!photos.length) return;
        viewport.replaceChildren(...photos.map(photoCard));
        slider.querySelector('[data-photo-previous]').hidden = photos.length < 2;
        slider.querySelector('[data-photo-next]').hidden = photos.length < 2;
        if (photos.length > 1) {
            window.IVRollingSlider?.setup({
                root: slider,
                viewport,
                itemSelector: '[data-reality-photo]',
                previous: slider.querySelector('[data-photo-previous]'),
                next: slider.querySelector('[data-photo-next]'),
                speed: 28
            });
        }
        viewport.addEventListener('click', event => {
            const trigger = event.target instanceof Element ? event.target.closest('[data-reality-photo]') : null;
            if (trigger) openPhoto(Number.parseInt(trigger.dataset.realityPhoto, 10), trigger);
        });
    }

    function activateMatterport(frame) {
        const source = frame.dataset.consentSrc;
        if (source && !frame.getAttribute('src')) frame.src = source;
        frame.hidden = false;
        frame.closest('[data-consent-embed]')?.classList.add('is-consented');
    }

    function matterportPlaceholder(frame) {
        const placeholder = document.createElement('div');
        placeholder.className = 'privacy-embed-placeholder';
        const heading = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = 'Externí obsah je vypnutý';
        heading.append(strong);
        const copy = document.createElement('p');
        copy.textContent = 'Načtením služby Matterport může dojít k předání technických údajů jejímu poskytovateli.';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'privacy-button privacy-button--primary';
        button.textContent = 'Povolit a načíst';
        button.addEventListener('click', () => {
            window.IVPPrivacy?.requestExternalConsent(() => activateMatterport(frame));
        });
        placeholder.append(heading, copy, button);
        return placeholder;
    }

    function tourCard(tour) {
        const shell = document.createElement('article');
        shell.className = 'reality-tour-shell';
        const frameWrap = document.createElement('div');
        frameWrap.className = 'reality-tour-frame';
        frameWrap.dataset.consentEmbed = '';
        const frame = document.createElement('iframe');
        frame.dataset.consentSrc = tour.url;
        frame.dataset.consentService = 'Matterport';
        frame.title = `Interaktivní 3D prohlídka: ${tour.title}`;
        frame.loading = 'lazy';
        frame.allow = 'fullscreen; xr-spatial-tracking';
        frame.setAttribute('allowfullscreen', '');
        frame.hidden = true;
        frameWrap.append(frame);
        if (window.IVPPrivacy?.hasExternalConsent()) activateMatterport(frame);
        else frameWrap.prepend(matterportPlaceholder(frame));

        const info = document.createElement('div');
        info.className = 'reality-tour-info';
        const eyebrow = document.createElement('p');
        eyebrow.className = 'related-work__eyebrow';
        eyebrow.textContent = tour.eyebrow || 'MATTERPORT 3D';
        const title = document.createElement('h3');
        title.textContent = tour.title;
        const description = document.createElement('p');
        description.textContent = tour.description;
        const link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.href = tour.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Otevřít celou prohlídku';
        info.append(eyebrow, title, description, link);
        shell.append(frameWrap, info);
        return shell;
    }

    function renderTours(settings) {
        const section = document.querySelector('[data-reality-tour-showcase]');
        const list = section?.querySelector('[data-reality-tour-list]');
        if (!section || !list) return;
        const tours = Array.isArray(settings?.tours) ? settings.tours.filter(tour => tour.enabled) : [];
        section.hidden = tours.length === 0;
        list.replaceChildren(...tours.map(tourCard));
    }

    async function initShowcase() {
        try {
            const response = await fetch('/api/reality-showcase.php', { cache: 'no-store', headers: { Accept: 'application/json' } });
            const data = response.ok ? await response.json() : null;
            if (!data?.ok) throw new Error('Neplatná odpověď galerie.');
            renderPhotos(data.settings);
            renderTours(data.settings);
        } catch (_) {
            document.querySelector('[data-reality-photo-showcase]')?.removeAttribute('hidden');
            document.querySelector('[data-reality-tour-showcase]')?.removeAttribute('hidden');
        }
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeLightbox();
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initShowcase, { once: true });
    else initShowcase();
})();
