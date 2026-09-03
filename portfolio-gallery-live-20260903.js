(() => {
    let projects = Array.isArray(window.IVPortfolioProjects) ? window.IVPortfolioProjects : [];
    const categoryNames = {
        svatby: 'Svatby',
        reality: 'Reality',
        plesy: 'Plesy a akce',
        fotobudka: 'Fotobudka',
        '360budka': '360° Budka',
        promo: 'Promo',
        konference: 'Konference',
        podcast: 'Podcast',
        reels: 'Reels'
    };

    const escapeHtml = (value = '') => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const findProject = (id) => projects.find((project) => project.id === id);

    async function loadCurrentProjects() {
        try {
            const response = await fetch(`/api/portfolio.php?ts=${Date.now()}`, {
                cache: 'no-store',
                headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!data.ok || !Array.isArray(data.items)) throw new Error('Neplatná data portfolia.');
            projects = data.items;
            window.IVPortfolioProjects = projects;
            document.documentElement.dataset.portfolioSource = 'live';
        } catch (_) {
            document.documentElement.dataset.portfolioSource = 'static-fallback';
        }
    }

    function ensureLightbox() {
        let lightbox = document.querySelector('[data-portfolio-lightbox]');
        if (lightbox) return lightbox;

        lightbox = document.createElement('div');
        lightbox.className = 'portfolio-video-modal';
        lightbox.dataset.portfolioLightbox = '';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.innerHTML = `
            <div class="portfolio-video-modal__backdrop" data-portfolio-close></div>
            <section class="portfolio-video-modal__dialog" role="dialog" aria-modal="true" aria-label="Přehrávač ukázky">
                <button class="portfolio-video-modal__close" type="button" data-portfolio-close aria-label="Zavřít video">×</button>
                <div class="portfolio-video-modal__frame"><iframe title="Ukázka z portfolia" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe><video controls playsinline hidden></video></div>
            </section>`;
        document.body.append(lightbox);

        lightbox.querySelectorAll('[data-portfolio-close]').forEach((button) => {
            button.addEventListener('click', () => closeLightbox(lightbox));
        });
        return lightbox;
    }

    function closeLightbox(lightbox = document.querySelector('[data-portfolio-lightbox]')) {
        if (!lightbox) return;
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        const frame = lightbox.querySelector('iframe');
        if (frame) frame.src = '';
        const video = lightbox.querySelector('video');
        if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
        document.body.style.overflow = '';
        lightbox._lastTrigger?.focus();
    }

    function openProject(project, trigger) {
        if (!project?.video) return;
        const isLocalVideo = /\.(mp4|webm)(?:$|[?#])/i.test(project.video);
        if (!isLocalVideo && window.IVPPrivacy && !window.IVPPrivacy.hasExternalConsent()) {
            window.IVPPrivacy.requestExternalConsent(() => openProject(project, trigger));
            return;
        }
        const lightbox = ensureLightbox();
        const frame = lightbox.querySelector('iframe');
        const video = lightbox.querySelector('video');
        lightbox._lastTrigger = trigger || document.activeElement;
        frame.hidden = isLocalVideo;
        video.hidden = !isLocalVideo;
        if (isLocalVideo) {
            frame.src = '';
            video.src = project.video;
            video.play().catch(() => {});
        } else {
            video.removeAttribute('src');
            frame.src = `${project.video}${project.video.includes('?') ? '&' : '?'}autoplay=1&rel=0`;
        }
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lightbox.querySelector('.portfolio-video-modal__close')?.focus();
    }

    function projectCard(project, className = 'portfolio-item') {
        return `
            <button class="${className}" type="button" data-portfolio-project="${escapeHtml(project.id)}" aria-label="Přehrát ukázku: ${escapeHtml(project.title)}">
                <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.alt)}" loading="lazy">
                <span class="portfolio-card__play" aria-hidden="true"><i></i></span>
                <span class="portfolio-overlay">
                    <span class="portfolio-category">${escapeHtml(project.label)}</span>
                    <span class="portfolio-title">${escapeHtml(project.title)}</span>
                </span>
            </button>`;
    }

    function bindProjectCards(scope = document) {
        scope.querySelectorAll('[data-portfolio-project]').forEach((card) => {
            if (card.dataset.portfolioBound) return;
            card.dataset.portfolioBound = 'true';
            card.addEventListener('click', () => openProject(findProject(card.dataset.portfolioProject), card));
        });
    }

    function initHomePortfolio() {
        const grid = document.querySelector('[data-home-portfolio-grid]');
        if (!grid) return;

        const hasHomepageSelection = projects.some((project) => typeof project.homepage === 'boolean');
        const selectedProjects = hasHomepageSelection
            ? projects.filter((project) => project.homepage === true).slice(0, 6)
            : projects.slice(0, 6);
        grid.innerHTML = selectedProjects
            .map((project) => projectCard(project))
            .join('') || '<p class="portfolio-grid__empty">Vyberte realizace pro homepage v administraci Portfolia.</p>';
        bindProjectCards(grid);
    }

    function setPortfolioFilter(grid, filter, tabs) {
        const matchingProjects = projects.filter((project) => filter === 'all' || project.categories.includes(filter));
        grid.innerHTML = matchingProjects.length
            ? matchingProjects.map((project) => projectCard(project)).join('')
            : `<p class="portfolio-grid__empty">V kategorii ${escapeHtml(categoryNames[filter] || 'portfolio')} zatím není zveřejněná žádná ukázka.</p>`;
        bindProjectCards(grid);
        tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.filter === filter));
    }

    function initPortfolioPage() {
        const grid = document.querySelector('[data-portfolio-grid]');
        if (!grid) return;

        const tabs = [...document.querySelectorAll('[data-portfolio-filter]')];
        const requested = new URLSearchParams(window.location.search).get('category');
        const initialFilter = requested && categoryNames[requested] ? requested : 'all';
        setPortfolioFilter(grid, initialFilter, tabs);

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter || 'all';
                setPortfolioFilter(grid, filter, tabs);
                const url = new URL(window.location.href);
                if (filter === 'all') url.searchParams.delete('category');
                else url.searchParams.set('category', filter);
                window.history.replaceState({}, '', `${url.pathname}${url.search}#projekty`);
            });
        });

        const target = document.getElementById('projekty');
        const scrollToProjects = (behavior = 'smooth') => {
            if (!target) return;
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
            window.scrollTo({ top: Math.max(0, top), behavior });
        };

        document.querySelectorAll('a[href="#projekty"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                window.history.replaceState({}, '', '#projekty');
                scrollToProjects();
            });
        });

        if (window.location.hash === '#projekty') {
            window.setTimeout(() => scrollToProjects('auto'), 80);
        }
    }

    function initRelatedWorkSliders() {
        function setupLoopingAutoplay(slider, viewport) {
            return window.IVRollingSlider?.setup({
                root: slider,
                viewport,
                itemSelector: '.premium-work-slide',
                previous: slider.querySelector('[data-slider-previous]'),
                next: slider.querySelector('[data-slider-next]'),
                speed: 30
            }) || null;
        }

        document.querySelectorAll('[data-portfolio-slider]').forEach((section) => {
            const categories = (section.dataset.portfolioCategories || '')
                .split(',')
                .map((category) => category.trim())
                .filter(Boolean);
            const matchingProjects = projects.filter((project) => project.categories.some((category) => categories.includes(category)));
            if (!matchingProjects.length) {
                section.remove();
                return;
            }

            const title = section.dataset.portfolioTitle || 'Vybrané ukázky';
            const accent = section.dataset.portfolioAccent || 'z portfolia';
            const category = categories[0] || 'all';
            const showHeader = section.dataset.portfolioHeader !== 'false';
            section.classList.toggle('related-work--slider-only', !showHeader);
            section.innerHTML = `
                ${showHeader ? `<div class="related-work__header">
                    <div>
                        <p class="related-work__eyebrow">UKÁZKY Z PORTFOLIA</p>
                        <h2>${escapeHtml(title)} <span>${escapeHtml(accent)}</span></h2>
                    </div>
                    <a href="/ukazky/?category=${encodeURIComponent(category)}#projekty" class="related-work__link">Zobrazit celé portfolio <i aria-hidden="true">→</i></a>
                </div>` : ''}
                <div class="premium-work-slider" data-portfolio-autoplay>
                    <button class="premium-work-slider__control" type="button" data-slider-previous aria-label="Předchozí ukázky">←</button>
                    <div class="premium-work-slider__viewport" tabindex="0" aria-label="Automaticky posouvané ukázky z portfolia">
                        ${matchingProjects.map((project) => projectCard(project, 'premium-work-slide')).join('')}
                    </div>
                    <button class="premium-work-slider__control" type="button" data-slider-next aria-label="Další ukázky">→</button>
                </div>`;

            const slider = section.querySelector('.premium-work-slider');
            const viewport = section.querySelector('.premium-work-slider__viewport');
            const loop = setupLoopingAutoplay(slider, viewport);
            if (!loop) {
                section.querySelector('[data-slider-previous]')?.addEventListener('click', () => {
                    viewport.scrollBy({ left: -Math.round(viewport.clientWidth * 0.86), behavior: 'smooth' });
                });
                section.querySelector('[data-slider-next]')?.addEventListener('click', () => {
                    viewport.scrollBy({ left: Math.round(viewport.clientWidth * 0.86), behavior: 'smooth' });
                });
            }
            bindProjectCards(section);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeLightbox();
    });

    document.addEventListener('DOMContentLoaded', async () => {
        await loadCurrentProjects();
        initHomePortfolio();
        initPortfolioPage();
        initRelatedWorkSliders();
        bindProjectCards(document);
    });
})();
