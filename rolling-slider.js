(() => {
    'use strict';

    function setup(options) {
        const root = options.root;
        const viewport = options.viewport;
        if (!root || !viewport) return null;

        viewport.querySelectorAll('[data-loop-clone]').forEach((clone) => clone.remove());
        const originals = Array.from(viewport.querySelectorAll(options.itemSelector || ':scope > *'));
        if (originals.length < 2) return null;

        const cloneSet = () => originals.map((item) => {
            const clone = item.cloneNode(true);
            clone.dataset.loopClone = 'true';
            clone.setAttribute('aria-hidden', 'true');
            if (clone.matches('a,button,input,select,textarea,[tabindex]')) clone.setAttribute('tabindex', '-1');
            clone.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach((control) => control.setAttribute('tabindex', '-1'));
            viewport.append(clone);
            return clone;
        });
        const firstClones = cloneSet();
        cloneSet();

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const state = { frame: 0, previousTime: 0, hovering: false, dragging: false, manualUntil: 0, destroyed: false };
        const speed = Number(options.speed) || 30;

        const loopWidth = () => firstClones[0]?.offsetLeft - originals[0]?.offsetLeft || 0;
        const stepWidth = () => {
            const styles = getComputedStyle(viewport);
            const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
            return originals[0].getBoundingClientRect().width + gap;
        };
        const normalize = () => {
            const width = loopWidth();
            if (!width) return;
            if (viewport.scrollLeft >= width) viewport.scrollLeft -= width;
            else if (viewport.scrollLeft < 0) viewport.scrollLeft += width;
        };
        const tick = (time) => {
            if (state.destroyed) return;
            if (state.previousTime && !document.hidden && !state.hovering && !state.dragging && !reducedMotion.matches && time >= state.manualUntil) {
                viewport.scrollLeft += Math.min(48, time - state.previousTime) * speed / 1000;
                normalize();
            }
            state.previousTime = time;
            state.frame = requestAnimationFrame(tick);
        };
        const move = (direction) => {
            const width = loopWidth();
            const step = stepWidth();
            if (!width || !step) return;
            state.manualUntil = performance.now() + 1700;
            if (direction < 0 && viewport.scrollLeft <= 1) viewport.scrollLeft = width;
            viewport.scrollBy({ left: direction * step, behavior: 'smooth' });
        };

        const enter = () => { state.hovering = true; root.classList.add('is-paused'); };
        const leave = () => { state.hovering = false; root.classList.remove('is-paused'); };
        const down = () => { state.dragging = true; };
        const up = () => { state.dragging = false; state.manualUntil = performance.now() + 1000; normalize(); };
        root.addEventListener('mouseenter', enter);
        root.addEventListener('mouseleave', leave);
        viewport.addEventListener('pointerdown', down);
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', up, { passive: true });
        options.previous?.addEventListener('click', () => move(-1));
        options.next?.addEventListener('click', () => move(1));

        root.classList.add('is-autoplaying');
        state.frame = requestAnimationFrame(tick);
        return { move, normalize };
    }

    window.IVRollingSlider = { setup };
})();
