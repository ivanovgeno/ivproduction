(() => {
    'use strict';

    const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    const googleMark = 'https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function safeHttpsUrl(value) {
        if (!value || typeof value !== 'string') return '';

        try {
            const url = new URL(value, window.location.href);
            return url.protocol === 'https:' ? url.href : '';
        } catch {
            return '';
        }
    }

    function rating(value) {
        if (typeof value === 'number') return Math.max(0, Math.min(5, value));
        if (typeof value === 'string') return ratingMap[value.toUpperCase()] || Number(value) || 0;
        return 0;
    }

    function stars(value) {
        const score = Math.max(0, Math.min(5, Math.round(value)));
        return '★'.repeat(score) + '☆'.repeat(5 - score);
    }

    function initials(name) {
        return String(name || 'G')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'G';
    }

    function formatDate(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        return new Intl.DateTimeFormat('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    function createReviewCard(review) {
        const reviewer = review && typeof review.reviewer === 'object' ? review.reviewer : {};
        const reply = review && typeof review.reviewReply === 'object' ? review.reviewReply : {};
        const name = reviewer.displayName || 'Google uživatel';
        const profilePhotoUrl = safeHttpsUrl(reviewer.profilePhotoUrl);
        const reviewRating = rating(review && review.rating);
        const reviewText = String((review && review.comment) || '').trim();
        const replyText = String(reply.comment || '').trim();

        const card = element('article', 'gw-card');
        const user = element('div', 'gw-user');
        const avatar = element('div', 'gw-avatar orange', initials(name));

        if (profilePhotoUrl) {
            const photo = document.createElement('img');
            photo.src = profilePhotoUrl;
            photo.alt = '';
            photo.loading = 'lazy';
            photo.referrerPolicy = 'no-referrer';
            avatar.textContent = '';
            avatar.classList.add('gw-avatar-photo');
            avatar.append(photo);
        }

        const userInfo = element('div', 'gw-user-info');
        userInfo.append(element('div', 'gw-name', name));
        const date = formatDate(review.updateTime || review.createTime);
        if (date) userInfo.append(element('div', 'gw-date', date));

        const logo = document.createElement('img');
        logo.src = googleMark;
        logo.className = 'gw-google-logo';
        logo.alt = 'Google';
        logo.width = 18;
        logo.height = 18;
        logo.loading = 'lazy';

        user.append(avatar, userInfo, logo);
        card.append(user);

        const cardStars = element('div', 'gw-card-stars', stars(reviewRating));
        cardStars.setAttribute('role', 'img');
        cardStars.setAttribute('aria-label', `${reviewRating} z 5 hvězdiček`);
        card.append(cardStars);
        card.append(element(
            'p',
            'gw-text',
            reviewText || 'Klient ohodnotil spolupráci na Google.'
        ));

        if (replyText) {
            const ownerReply = element('div', 'gw-owner-reply');
            ownerReply.append(element('strong', 'gw-owner-reply-title', 'Odpověď IV Production'));
            ownerReply.append(element('p', 'gw-owner-reply-text', replyText));
            card.append(ownerReply);
        }

        return card;
    }

    function updateSummary(section, data) {
        const score = rating(data.rating);
        const count = Number(data.reviewCount);
        const scoreNode = section.querySelector('[data-google-review-score]');
        const starsNode = section.querySelector('[data-google-review-stars]');
        const countNode = section.querySelector('[data-google-review-count]');
        const writeReviewLink = section.querySelector('[data-google-review-link]');
        const mapsLink = section.querySelector('[data-google-maps-link]');

        if (scoreNode && score > 0) {
            scoreNode.textContent = score.toLocaleString('cs-CZ', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });
        }
        if (starsNode && score > 0) {
            starsNode.textContent = stars(score);
            starsNode.setAttribute('aria-label', `${score.toLocaleString('cs-CZ')} z 5 hvězdiček`);
        }
        if (countNode && Number.isFinite(count)) {
            countNode.textContent = `Na základě ${count.toLocaleString('cs-CZ')} ${count === 1 ? 'recenze' : count >= 2 && count <= 4 ? 'recenzí' : 'recenzí'}`;
        }

        const writeUrl = safeHttpsUrl(data.writeReviewUrl);
        if (writeReviewLink && writeUrl) writeReviewLink.href = writeUrl;

        const mapsUrl = safeHttpsUrl(data.googleMapsUrl);
        if (mapsLink && mapsUrl) mapsLink.href = mapsUrl;
    }

    function initialiseSlider(container) {
        const viewport = container.querySelector('.gw-slider-viewport');
        const track = container.querySelector('.gw-slider-track');
        const previous = container.querySelector('.gw-prev');
        const next = container.querySelector('.gw-next');

        if (!viewport || !track || !previous || !next) return () => {};

        track.querySelectorAll('[data-gw-clone]').forEach((clone) => clone.remove());
        const originalCards = Array.from(track.children).filter((card) => card.classList.contains('gw-card'));
        if (originalCards.length < 2) return () => {};

        const controller = new AbortController();
        const signal = controller.signal;
        let paused = false;
        let animationFrame = 0;
        let resumeTimer = 0;

        const createClones = () => {
            track.querySelectorAll('[data-gw-clone]').forEach((clone) => clone.remove());
            const computed = getComputedStyle(track);
            const gap = Number.parseFloat(computed.columnGap || computed.gap) || 0;
            const sampleWidth = originalCards[0].getBoundingClientRect().width || 320;
            const required = Math.max(2, Math.ceil(viewport.clientWidth / (sampleWidth + gap)) + 2);

            for (let index = 0; index < required; index += 1) {
                const clone = originalCards[index % originalCards.length].cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                clone.dataset.gwClone = 'true';
                track.append(clone);
            }
        };

        createClones();

        const getStep = () => {
            const computed = getComputedStyle(track);
            const gap = Number.parseFloat(computed.columnGap || computed.gap) || 0;
            return (originalCards[0].getBoundingClientRect().width || 320) + gap;
        };

        const originalWidth = () => originalCards.reduce((sum, card) => sum + card.getBoundingClientRect().width, 0)
            + (Math.max(0, originalCards.length - 1) * (Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0));

        const tick = () => {
            if (!paused && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                viewport.scrollLeft += 0.35;
                const width = originalWidth();
                if (width > 0 && viewport.scrollLeft >= width) viewport.scrollLeft -= width;
            }
            animationFrame = window.requestAnimationFrame(tick);
        };

        const move = (direction) => {
            viewport.scrollBy({ left: direction * getStep(), behavior: 'smooth' });
        };

        previous.addEventListener('click', () => move(-1), { signal });
        next.addEventListener('click', () => move(1), { signal });
        container.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse') paused = true;
        }, { signal });
        container.addEventListener('pointerleave', (event) => {
            if (event.pointerType === 'mouse') paused = false;
        }, { signal });
        container.addEventListener('pointerdown', () => {
            paused = true;
            window.clearTimeout(resumeTimer);
        }, { signal });
        container.addEventListener('pointerup', () => {
            window.clearTimeout(resumeTimer);
            resumeTimer = window.setTimeout(() => { paused = false; }, 1200);
        }, { signal });
        window.addEventListener('resize', createClones, { signal });

        animationFrame = window.requestAnimationFrame(tick);
        return () => {
            controller.abort();
            window.cancelAnimationFrame(animationFrame);
            window.clearTimeout(resumeTimer);
            track.querySelectorAll('[data-gw-clone]').forEach((clone) => clone.remove());
        };
    }

    ready(() => {
        const section = document.querySelector('[data-google-reviews]');
        if (!section) return;

        const track = section.querySelector('.gw-slider-track');
        const sliderContainer = section.querySelector('.gw-slider-container');
        if (!track || !sliderContainer) return;

        let destroySlider = initialiseSlider(sliderContainer);
        const sources = [
            section.dataset.googleReviewsEndpoint || 'api/google-reviews.php',
            section.dataset.googleReviewsStaticSource || 'google-reviews.json'
        ].filter((source, index, list) => source && list.indexOf(source) === index);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8000);

        const loadReviews = async () => {
            for (const source of sources) {
                try {
                    const response = await fetch(source, {
                        cache: 'no-store',
                        headers: { Accept: 'application/json' },
                        signal: controller.signal
                    });
                    if (!response.ok) continue;

                    const data = await response.json();
                    if (!data || data.status !== 'ok' || !Array.isArray(data.reviews)) continue;

                    destroySlider();
                    track.replaceChildren(...data.reviews.map(createReviewCard));
                    updateSummary(section, data);
                    section.dataset.googleReviewsSource = data.cached ? 'cached' : source === sources[0] ? 'live' : 'github-cache';
                    destroySlider = initialiseSlider(sliderContainer);
                    return;
                } catch {
                    // Try the next safe source. GitHub Pages has no PHP runtime,
                    // while a PHP host can use the static GitHub export if its
                    // server endpoint is not configured yet.
                }
            }

            // With neither source available the existing static cards remain.
        };

        loadReviews().finally(() => window.clearTimeout(timeout));
    });
})();
