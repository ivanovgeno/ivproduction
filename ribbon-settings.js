(() => {
    'use strict';

    function apply(data) {
        const services = data?.settings?.services;
        if (!services) return;
        document.querySelectorAll('.package-showcase[data-package-page]').forEach(section => {
            const setting = services[section.dataset.packagePage];
            if (!setting) return;
            section.style.setProperty('--ribbon-text-x', `${Number(setting.x) || 0}px`);
            section.style.setProperty('--ribbon-text-y', `${Number(setting.y) || 0}px`);
            section.style.setProperty('--ribbon-text-scale', String(Number(setting.scale) || 1));
        });
    }

    fetch('/api/package-ribbons.php', { cache: 'no-store', credentials: 'same-origin' })
        .then(response => response.ok ? response.json() : null)
        .then(apply)
        .catch(() => { /* CSS defaults keep every ribbon usable. */ });
})();
