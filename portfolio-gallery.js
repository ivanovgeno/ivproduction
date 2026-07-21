(() => {
    const projects = Array.isArray(window.IVPortfolioProjects) ? window.IVPortfolioProjects : [];
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
                <div class="portfolio-video-modal__frame"><iframe title="Ukázka z portfolia" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
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
        document.body.style.overflow = '';
        lightbox._lastTrigger?.focus();
    }

    function openProject(project, trigger) {
        if (!project?.video) return;
        const lightbox = ensureLightbox();
        const frame = lightbox.querySelector('iframe');
        lightbox._lastTrigger = trigger || document.activeElement;
        frame.src = `${project.video}${project.video.includes('?') ? '&' : '?'}autoplay=1&rel=0`;
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

        grid.innerHTML = projects
            .slice(0, 6)
            .map((project) => projectCard(project))
            .join('');
        bindProjectCards(grid);
    }

    function setPortfolioFilter(grid, filter, tabs) {
        grid.innerHTML = projects
            .filter((project) => filter === 'all' || project.categories.includes(filter))
            .map((project) => projectCard(project))
            .join('');
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
            const originalSlides = Array.from(viewport.querySelectorAll('.premium-work-slide'));
            if (originalSlides.length < 2) return null;

            const cloneSlide = (slide) => {
                const clone = slide.cloneNode(true);
                clone.dataset.sliderClone = 'true';
                clone.setAttribute('aria-hidden', 'true');
                clone.setAttribute('tabindex', '-1');
                return clone;
            };

            // Keep three identical sets in the track. Two sets are not enough when
            // the viewport shows three cards but the category contains only two:
            // the browser reaches its maximum scroll position before the loop point.
            const firstCloneSet = originalSlides.map(cloneSlide);
            const secondCloneSet = originalSlides.map(cloneSlide);
            [...firstCloneSet, ...secondCloneSet].forEach((slide) => viewport.append(slide));

            const state = { timer: null, normalizeTimer: null, hovering: false, dragging: false };

            const loopWidth = () => {
                const firstClone = firstCloneSet[0];
                const firstOriginal = originalSlides[0];
                return firstClone && firstOriginal ? firstClone.offsetLeft - firstOriginal.offsetLeft : 0;
            };

            const stepWidth = () => {
                const firstSlide = originalSlides[0];
                const gap = Number.parseFloat(window.getComputedStyle(viewport).columnGap || window.getComputedStyle(viewport).gap || '0');
                return firstSlide ? firstSlide.getBoundingClientRect().width + gap : viewport.clientWidth * 0.85;
            };

            const setInstantPosition = (left) => {
                const previousBehavior = viewport.style.scrollBehavior;
                const previousSnap = viewport.style.scrollSnapType;
                viewport.style.scrollBehavior = 'auto';
                viewport.style.scrollSnapType = 'none';
                viewport.scrollLeft = left;
                window.requestAnimationFrame(() => {
                    viewport.style.scrollBehavior = previousBehavior;
                    viewport.style.scrollSnapType = previousSnap;
                });
            };

            const normalizeLoop = () => {
                const width = loopWidth();
                if (width && viewport.scrollLeft >= width - 1) {
                    setInstantPosition(viewport.scrollLeft - width);
                }
            };

            const queueNormalize = () => {
                if (state.normalizeTimer) window.clearTimeout(state.normalizeTimer);
                state.normalizeTimer = window.setTimeout(normalizeLoop, 180);
            };

            const move = (direction) => {
                const width = loopWidth();
                const step = stepWidth();
                if (!width || !step) return;

                if (direction < 0 && viewport.scrollLeft <= 1) {
                    setInstantPosition(width);
                    window.requestAnimationFrame(() => viewport.scrollBy({ left: -step, behavior: 'smooth' }));
                    return;
                }

                viewport.scrollBy({ left: direction * step, behavior: 'smooth' });
            };

            const stop = () => {
                if (state.timer) window.clearTimeout(state.timer);
                state.timer = null;
            };

            const schedule = () => {
                stop();
                if (document.hidden || state.dragging) return;
                const delay = state.hovering ? 4200 : 2000;
                state.timer = window.setTimeout(() => {
                    move(1);
                    schedule();
                }, delay);
            };

            slider.classList.add('is-autoplaying');
            viewport.addEventListener('scroll', queueNormalize, { passive: true });
            slider.addEventListener('mouseenter', () => {
                state.hovering = true;
                slider.classList.add('is-slowed');
                schedule();
            });
            slider.addEventListener('mouseleave', () => {
                state.hovering = false;
                slider.classList.remove('is-slowed');
                schedule();
            });
            viewport.addEventListener('pointerdown', () => {
                state.dragging = true;
                stop();
            });
            const resumeAfterPointer = () => {
                if (!state.dragging) return;
                state.dragging = false;
                queueNormalize();
                schedule();
            };
            window.addEventListener('pointerup', resumeAfterPointer, { passive: true });
            window.addEventListener('pointercancel', resumeAfterPointer, { passive: true });
            viewport.addEventListener('touchend', resumeAfterPointer, { passive: true });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) stop();
                else schedule();
            });
            window.setTimeout(schedule, 650);

            return { move, schedule };
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
                    <a href="portfolio.html?category=${encodeURIComponent(category)}#projekty" class="related-work__link">Zobrazit celé portfolio <i aria-hidden="true">→</i></a>
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
            section.querySelector('[data-slider-previous]')?.addEventListener('click', () => {
                if (loop) {
                    loop.move(-1);
                    loop.schedule();
                } else {
                    viewport.scrollBy({ left: -Math.round(viewport.clientWidth * 0.86), behavior: 'smooth' });
                }
            });
            section.querySelector('[data-slider-next]')?.addEventListener('click', () => {
                if (loop) {
                    loop.move(1);
                    loop.schedule();
                } else {
                    viewport.scrollBy({ left: Math.round(viewport.clientWidth * 0.86), behavior: 'smooth' });
                }
            });
            bindProjectCards(section);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeLightbox();
    });

    document.addEventListener('DOMContentLoaded', () => {
        initHomePortfolio();
        initPortfolioPage();
        initRelatedWorkSliders();
    });
})();
