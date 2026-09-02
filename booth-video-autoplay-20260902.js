(() => {
    'use strict';

    const videos = [...document.querySelectorAll('.booth-video-card video')];
    if (!videos.length) return;

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
        let fallback = card?.querySelector('.booth-video-play-fallback');
        if (card && !fallback) {
            fallback = document.createElement('button');
            fallback.type = 'button';
            fallback.className = 'booth-video-play-fallback';
            fallback.textContent = 'Přehrát ukázku';
            fallback.setAttribute('aria-label', `Přehrát: ${video.getAttribute('aria-label') || 'ukázka z IV Budky 360'}`);
            card.append(fallback);
            fallback.addEventListener('click', () => {
                video.muted = true;
                video.play().then(() => card.classList.remove('is-autoplay-blocked')).catch(() => {});
            });
        }

        return { card, fallback };
    };

    const tryPlay = (video, showFallback = false) => {
        const card = video.closest('.booth-video-card');
        const attempt = video.play();
        if (!attempt || typeof attempt.then !== 'function') return;
        attempt.then(() => card?.classList.remove('is-autoplay-blocked')).catch(() => {
            if (showFallback) card?.classList.add('is-autoplay-blocked');
        });
    };

    videos.forEach((video) => {
        prepare(video);
        video.addEventListener('playing', () => video.closest('.booth-video-card')?.classList.remove('is-autoplay-blocked'));
        video.addEventListener('canplay', () => tryPlay(video, true), { once: true });
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
        if (video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) tryPlay(video, true);
    }));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) videos.forEach((video) => {
            if (video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) tryPlay(video, true);
        });
    });
})();
