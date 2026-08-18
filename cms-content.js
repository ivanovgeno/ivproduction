(function () {
    'use strict';
    if (new URLSearchParams(location.search).has('admin-source')) return;
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const source = new URL('content/site-content.json', document.baseURI);
    let records = [];

    function apply(record) {
        let element;
        try { element = document.querySelector(record.selector); } catch (_) { return; }
        if (!element) return;
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
        if (['href', 'src', 'alt', 'poster', 'data-video', 'content', 'title', 'placeholder'].includes(record.property)) {
            element.setAttribute(record.property, record.value);
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
