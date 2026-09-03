(() => {
    'use strict';

    const videos = [...document.querySelectorAll('.booth-video-card video')];
    if (!videos.length) return;

    const activateMotionFallback = (video) => {
        const card = video.closest('.booth-video-card');
        const fallback = card?.querySelector('.booth-video-motion-fallback');
        if (!card || !fallback || !video.dataset.motionFallback) return;
        if (!fallback.src) fallback.src = video.dataset.motionFallback;
        card.classList.add('is-autoplay-blocked');
    };

    const prepare = (video) => {
        video.muted = true;
        video.defaultMuted = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        const card = video.closest('.booth-video-card');
        if (!card) return;

        let motionFallback = card.querySelector('.booth-video-motion-fallback');
        if (!motionFallback) {
            motionFallback = document.createElement('img');
            motionFallback.className = 'booth-video-motion-fallback';
            motionFallback.alt = '';
            motionFallback.decoding = 'async';
            motionFallback.setAttribute('aria-hidden', 'true');
            video.insertAdjacentElement('afterend', motionFallback);
        }

        let playButton = card.querySelector('.booth-video-play-fallback');
        if (!playButton) {
            playButton = document.createElement('button');
            playButton.type = 'button';
            playButton.className = 'booth-video-play-fallback';
            playButton.textContent = 'Přehrát video';
            playButton.setAttribute('aria-label', `Přehrát: ${video.getAttribute('aria-label') || 'ukázka z IV Budky 360'}`);
            card.append(playButton);
            playButton.addEventListener('click', () => {
                video.muted = true;
                video.play().then(() => card.classList.remove('is-autoplay-blocked')).catch(() => activateMotionFallback(video));
            });
        }
    };

    const tryPlay = (video, showFallback = false) => {
        const card = video.closest('.booth-video-card');
        const attempt = video.play();
        if (!attempt || typeof attempt.then !== 'function') return;
        attempt.then(() => card?.classList.remove('is-autoplay-blocked')).catch(() => {
            if (showFallback) activateMotionFallback(video);
        });
    };

    videos.forEach((video) => {
        prepare(video);
        video.addEventListener('playing', () => video.closest('.booth-video-card')?.classList.remove('is-autoplay-blocked'));
        video.addEventListener('canplay', () => tryPlay(video, true), { once: true });
        video.addEventListener('error', () => activateMotionFallback(video));
        window.setTimeout(() => {
            if (video.paused || video.currentTime < 0.05) activateMotionFallback(video);
        }, 2400);
    });

    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio >= .15) tryPlay(video, true);
                else video.pause();
            });
        }, { threshold: [0, .15] })
        : null;

    videos.forEach((video) => observer ? observer.observe(video) : tryPlay(video, true));
    window.addEventListener('pageshow', () => videos.forEach((video) => {
        const bounds = video.getBoundingClientRect();
        if (bounds.top < innerHeight && bounds.bottom > 0) tryPlay(video, true);
    }));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) videos.forEach((video) => {
            const bounds = video.getBoundingClientRect();
            if (bounds.top < innerHeight && bounds.bottom > 0) tryPlay(video, true);
        });
    });
})();
