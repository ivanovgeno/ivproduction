(function () {
    'use strict';
    if (new URLSearchParams(location.search).has('admin-source')) return;
    const pathParts = location.pathname.split('/').filter(Boolean);
    const route = (pathParts.at(-1) || '').toLowerCase();
    const routeFiles = {
        '': 'index.html',
        'ivbudka': 'fotobudka.html',
        'ivbudka360': '360budka.html',
        'aftermovie-promo-hudebniklipy': 'promo.html',
        'ukazky': 'portfolio.html',
        'svatebni-blog': 'blog.html'
    };
    const page = pathParts[0] === 'l'
        ? `${pathParts.slice(0, 2).join('/')}/index.html`
        : (route.endsWith('.html') ? route : (routeFiles[route] || `${route}.html`));
    const source = new URL('/content/site-content.json', location.origin);
    let records = [];

    function apply(record) {
        // Individual equipment cards are owned by equipment.json and its dedicated admin manager.
        if (/tech-(?:category|grid|item|img|placeholder|name|desc)/.test(String(record.selector || ''))) return;
        let element;
        try { element = document.querySelector(record.selector); } catch (_) { return; }
        if (!element) return;
        // Portfolio cards are rendered from the dedicated portfolio manager.
        // Historical page-editor records must not overwrite their image or copy.
        if (element.closest('[data-home-portfolio-grid], [data-portfolio-grid], [data-portfolio-slider]')) return;
        if (record.property === 'text-node') {
            const nodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
            const node = nodes[Number(record.node || 0)];
            if (!node) return;
            const leading = (node.nodeValue.match(/^\s*/) || [''])[0];
            const trailing = (node.nodeValue.match(/\s*$/) || [''])[0];
            node.nodeValue = leading + record.value + trailing;
            return;
        }
        if (record.property === 'title' && element.tagName === 'TITLE') {
            element.textContent = record.value;
            return;
        }
        if (record.property === 'json-ld') {
            const scripts = document.querySelectorAll(record.selector);
            const script = scripts[Number(record.node || 0)];
            if (script) script.textContent = record.value;
            return;
        }
        if (record.property === 'css-var') {
            const styleName = record.styleName === '--hero-image' ? record.styleName : '--hero-image';
            const cleanValue = String(record.value || '').replace(/["\\]/g, '');
            element.style.setProperty(styleName, `url("${cleanValue}")`);
            return;
        }
        if (record.property === 'style-background-image') {
            const cleanValue = String(record.value || '').replace(/["\\]/g, '');
            if (cleanValue) element.style.setProperty('background-image', `url("${cleanValue}")`, 'important');
            else element.style.removeProperty('background-image');
            if (element.matches('[data-photo-slot],.tech-placeholder,.service-card')) {
                element.style.backgroundPosition = cleanValue ? 'center' : '';
                element.style.backgroundRepeat = cleanValue ? 'no-repeat' : '';
                element.style.backgroundSize = cleanValue ? (element.classList.contains('tech-placeholder') ? 'contain' : 'cover') : '';
                if (element.matches('[data-photo-slot],.tech-placeholder')) {
                    element.querySelectorAll(':scope > *').forEach(child => { child.style.visibility = cleanValue ? 'hidden' : ''; });
                }
                if (element.hasAttribute('data-photo-slot')) {
                    element.classList.toggle('team-photo--placeholder', !cleanValue);
                    element.dataset.photoAssigned = cleanValue ? 'true' : 'false';
                }
            }
            return;
        }
        if (['href', 'src', 'alt', 'poster', 'data-video', 'content', 'title', 'placeholder'].includes(record.property)) {
            const isLocalUrl = ['href', 'src', 'poster', 'data-video'].includes(record.property)
                && /^(?:assets\/|images\/|partners\/)/.test(record.value);
            element.setAttribute(record.property, isLocalUrl ? `/${record.value}` : record.value);
            if (record.property === 'src' && element.tagName === 'IMG') element.removeAttribute('srcset');
        }
    }

    function applyAll() { records.forEach(apply); }

    fetch(source, { cache: 'no-store', credentials: 'same-origin' })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
            if (!data || !data.pages) return;
            records = [...(data.pages['*'] || []), ...(data.pages[page] || [])];
            applyAll();
            let frame = 0;
            const observer = new MutationObserver(() => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(applyAll);
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 10000);
            document.dispatchEvent(new CustomEvent('ivp:content-applied'));
        })
        .catch(() => { /* The static site remains fully usable without CMS data. */ });
}());
