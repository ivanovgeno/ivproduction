document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    root.classList.add('experience-ready');

    const progress = document.createElement('div');
    progress.className = 'site-scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.prepend(progress);

    const parallaxLayers = [...document.querySelectorAll('[data-parallax]')];
    let ticking = false;

    function updateViewportEffects() {
        const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progressValue = Math.min(window.scrollY / scrollable, 1);
        root.style.setProperty('--scroll-progress', progressValue.toFixed(4));

        if (!reduceMotion.matches) {
            parallaxLayers.forEach((layer) => {
                const depth = Number(layer.dataset.parallax || 0);
                layer.style.setProperty('--parallax-y', `${Math.round(window.scrollY * depth * -0.16)}px`);
            });
        }

        ticking = false;
    }

    function requestViewportEffects() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateViewportEffects);
    }

    window.addEventListener('scroll', requestViewportEffects, { passive: true });
    window.addEventListener('resize', requestViewportEffects, { passive: true });
    reduceMotion.addEventListener('change', requestViewportEffects);
    requestViewportEffects();

    if (!finePointer.matches || reduceMotion.matches) return;

    const pointerAura = document.createElement('div');
    pointerAura.className = 'site-pointer-aura';
    pointerAura.setAttribute('aria-hidden', 'true');
    document.body.append(pointerAura);

    let auraFrame;
    let pointerX = -200;
    let pointerY = -200;

    function hidePointerAura() {
        root.classList.remove('pointer-aura-active');
    }

    function paintPointerAura() {
        root.style.setProperty('--pointer-x', `${pointerX}px`);
        root.style.setProperty('--pointer-y', `${pointerY}px`);
        root.classList.add('pointer-aura-active');
        auraFrame = undefined;
    }

    document.addEventListener('pointermove', (event) => {
        if (event.pointerType && event.pointerType !== 'mouse') return;

        pointerX = event.clientX;
        pointerY = event.clientY;

        if (auraFrame) return;
        auraFrame = window.requestAnimationFrame(paintPointerAura);
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
        if (!event.relatedTarget) hidePointerAura();
    });
    window.addEventListener('blur', hidePointerAura);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) hidePointerAura();
    });
    reduceMotion.addEventListener('change', (event) => {
        if (event.matches) hidePointerAura();
    });

    const tiltTargets = document.querySelectorAll([
        '.service-card',
        '.process-step',
        '.portfolio-item',
        '.feature-card',
        '.pricing-card',
        '.type-card',
        '.budka-card',
        '.team-member',
        '.tech-category',
        '.stat-item',
        '.blog-card'
    ].join(','));

    tiltTargets.forEach((target) => {
        let frame;

        function resetTilt() {
            target.classList.remove('experience-tilt');
            target.style.removeProperty('--tilt-x');
            target.style.removeProperty('--tilt-y');
            target.style.removeProperty('--glow-x');
            target.style.removeProperty('--glow-y');
        }

        target.addEventListener('pointermove', (event) => {
            const rect = target.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                target.classList.add('experience-tilt');
                target.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
                target.style.setProperty('--tilt-y', `${((x - 0.5) * 6).toFixed(2)}deg`);
                target.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
                target.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
            });
        });

        target.addEventListener('pointerleave', () => {
            window.cancelAnimationFrame(frame);
            resetTilt();
        });
    });
});
