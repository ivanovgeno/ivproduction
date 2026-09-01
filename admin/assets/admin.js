(() => {
    'use strict';
    const csrf = document.body.dataset.csrf;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const state = { api: null, page: '', descriptors: [], dirty: new Map(), current: new Map(), saved: new Map(), videos: [] };
    const titles = { dashboard: 'Přehled webu', content: 'Obsah webu', media: 'Média', videos: 'Video projekty', history: 'Historie změn', security: 'Přístup a zabezpečení' };

    function toast(message, error = false) {
        const el = $('#toast'); el.textContent = message; el.classList.toggle('is-error', error); el.classList.add('is-visible');
        clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('is-visible'), 3200);
    }
    async function api(url, options = {}) {
        options.headers = { ...(options.headers || {}), 'X-CSRF-Token': csrf };
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({ ok: false, error: 'Neplatná odpověď serveru.' }));
        if (response.status === 401) location.href = 'login.php';
        if (!response.ok || !data.ok) throw new Error(data.error || 'Operace se nepodařila.');
        return data;
    }
    function show(view) {
        $$('.view').forEach(el => el.classList.toggle('is-active', el.dataset.panel === view));
        $$('.nav-item').forEach(el => el.classList.toggle('is-active', el.dataset.view === view));
        $('#viewTitle').textContent = titles[view] || 'Administrace';
        $('#sidebar').classList.remove('is-open');
        if (view === 'media') loadMedia();
        if (view === 'videos') loadVideos();
        if (view === 'history') loadHistory();
    }
    $$('[data-view]').forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
    $$('[data-go]').forEach(button => button.addEventListener('click', () => {
        show(button.dataset.go);
        if (button.dataset.page) { $('#pageSelect').value = button.dataset.page; loadPage(button.dataset.page); }
    }));
    $('#adminMenu').addEventListener('click', () => $('#sidebar').classList.toggle('is-open'));

    function cssEscape(value) { return window.CSS?.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
    function selectorFor(el, doc) {
        if (el.id) return '#' + cssEscape(el.id);
        const parts = [];
        let current = el;
        while (current && current !== doc.body && parts.length < 8) {
            let part = current.tagName.toLowerCase();
            const stable = [...current.classList].find(c => !/^(animate|delay-|active|is-|scrolled|visible)/.test(c));
            if (stable) part += '.' + cssEscape(stable);
            const siblings = current.parentElement ? [...current.parentElement.children].filter(child => child.tagName === current.tagName) : [];
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            parts.unshift(part);
            const candidate = parts.join(' > ');
            try { if (doc.querySelectorAll(candidate).length === 1) return candidate; } catch (_) {}
            current = current.parentElement;
        }
        return 'body > ' + parts.join(' > ');
    }
    function groupFor(el) {
        if (el.closest('header')) return 'Hlavička a menu';
        if (el.closest('footer')) return 'Patička';
        const section = el.closest('section, main > div, article');
        if (!section) return 'Ostatní obsah';
        const heading = section.querySelector('h1,h2');
        if (heading?.textContent.trim()) return heading.textContent.trim().slice(0, 60);
        if (section.id) return section.id.replace(/[-_]/g, ' ');
        const cls = [...section.classList][0];
        return cls ? cls.replace(/[-_]/g, ' ') : 'Ostatní obsah';
    }
    function addDescriptor(list, descriptor) {
        descriptor.key = `${descriptor.selector}|${descriptor.property}|${descriptor.node ?? ''}`;
        if (!list.some(item => item.key === descriptor.key)) list.push(descriptor);
    }
    function extract(doc) {
        const list = [];
        const title = doc.querySelector('title');
        if (title) addDescriptor(list, { selector: 'title', property: 'title', original: title.textContent.trim(), label: 'Titulek stránky', group: 'SEO a sdílení' });
        const description = doc.querySelector('meta[name="description"]');
        if (description) addDescriptor(list, { selector: 'meta[name="description"]', property: 'content', original: description.content, label: 'Meta popis', group: 'SEO a sdílení' });
        const seoFields = [
            ['link[rel="canonical"]', 'href', 'Canonical URL'],
            ['meta[property="og:title"]', 'content', 'Open Graph titulek'],
            ['meta[property="og:description"]', 'content', 'Open Graph popis'],
            ['meta[property="og:url"]', 'content', 'Open Graph URL'],
            ['meta[property="og:image"]', 'content', 'Open Graph obrázek'],
            ['meta[property="og:image:secure_url"]', 'content', 'Open Graph secure obrázek'],
            ['meta[name="twitter:title"]', 'content', 'Twitter titulek'],
            ['meta[name="twitter:description"]', 'content', 'Twitter popis'],
            ['meta[name="twitter:image"]', 'content', 'Twitter obrázek']
        ];
        seoFields.forEach(([selector, property, label]) => {
            const element = doc.querySelector(selector);
            const value = element?.getAttribute(property) || '';
            if (value) addDescriptor(list, { selector, property, original: value, label, group: 'SEO a sdílení', type: 'url' });
        });
        doc.querySelectorAll('script[type="application/ld+json"]').forEach((script, node) => {
            addDescriptor(list, { selector: 'script[type="application/ld+json"]', property: 'json-ld', node, original: script.textContent.trim(), label: `Strukturovaná data JSON-LD ${node + 1}`, group: 'SEO a sdílení' });
        });
        doc.querySelectorAll('h1,h2,h3,h4,p,li,label,a,button,option').forEach(el => {
            if (el.closest('script,style,svg,noscript') || el.closest('#mobileMenuOverlay') && el.classList.contains('mobile-menu-cta')) return;
            const selector = selectorFor(el, doc);
            const textNodes = [...el.childNodes].filter(node => node.nodeType === 3 && node.nodeValue.trim());
            textNodes.forEach((node, index) => addDescriptor(list, { selector, property: 'text-node', node: index, original: node.nodeValue.trim(), label: el.tagName.toLowerCase() === 'a' ? 'Text odkazu' : `Text ${el.tagName.toLowerCase()}`, group: groupFor(el) }));
            if (el.tagName === 'A' && el.getAttribute('href')) addDescriptor(list, { selector, property: 'href', original: el.getAttribute('href'), label: 'Cíl odkazu', group: groupFor(el), type: 'url' });
        });
        doc.querySelectorAll('img').forEach(el => {
            const selector = selectorFor(el, doc); const group = groupFor(el);
            addDescriptor(list, { selector, property: 'src', original: el.getAttribute('src') || '', label: 'Soubor obrázku', group, type: 'url' });
            addDescriptor(list, { selector, property: 'alt', original: el.getAttribute('alt') || '', label: 'Popis obrázku', group });
        });
        doc.querySelectorAll('video').forEach(el => {
            const selector = selectorFor(el, doc); const group = groupFor(el);
            if (el.hasAttribute('src')) addDescriptor(list, { selector, property: 'src', original: el.getAttribute('src') || '', label: 'Soubor videa', group, type: 'url' });
            addDescriptor(list, { selector, property: 'poster', original: el.getAttribute('poster') || '', label: 'Náhledový obrázek videa', group, type: 'url' });
        });
        doc.querySelectorAll('video source').forEach(el => addDescriptor(list, { selector: selectorFor(el, doc), property: 'src', original: el.getAttribute('src') || '', label: 'Zdroj videa', group: groupFor(el), type: 'url' }));
        doc.querySelectorAll('iframe[src]').forEach(el => addDescriptor(list, { selector: selectorFor(el, doc), property: 'src', original: el.getAttribute('src') || '', label: 'Odkaz vloženého obsahu / videa', group: groupFor(el), type: 'url' }));
        doc.querySelectorAll('[data-video]').forEach(el => addDescriptor(list, { selector: selectorFor(el, doc), property: 'data-video', original: el.getAttribute('data-video') || '', label: 'Odkaz videa', group: groupFor(el), type: 'url' }));
        doc.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el => addDescriptor(list, { selector: selectorFor(el, doc), property: 'placeholder', original: el.getAttribute('placeholder') || '', label: 'Nápověda pole', group: groupFor(el) }));
        return list.filter(item => item.original !== '');
    }
    function sectionId(group, index) { return `editor-section-${index}-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; }
    function renderEditor(filter = '') {
        const editor = $('#contentEditor'); const nav = $('#sectionNav'); editor.innerHTML = ''; nav.innerHTML = '';
        const needle = filter.trim().toLocaleLowerCase('cs');
        const groups = new Map();
        state.descriptors.forEach(item => {
            const value = state.current.get(item.key) ?? item.original;
            if (needle && !`${item.group} ${item.label} ${value}`.toLocaleLowerCase('cs').includes(needle)) return;
            if (!groups.has(item.group)) groups.set(item.group, []); groups.get(item.group).push(item);
        });
        if (!groups.size) { editor.innerHTML = '<div class="empty-state">Pro zadané hledání nebyl nalezen žádný obsah.</div>'; return; }
        [...groups].forEach(([group, fields], index) => {
            const id = sectionId(group, index);
            const navButton = document.createElement('button'); navButton.textContent = group; navButton.addEventListener('click', () => document.getElementById(id).scrollIntoView({ behavior: 'smooth' })); nav.append(navButton);
            const section = document.createElement('section'); section.className = 'editor-section'; section.id = id;
            const heading = document.createElement('h2'); heading.textContent = group; section.append(heading);
            const wrap = document.createElement('div'); wrap.className = 'editor-fields';
            fields.forEach(item => {
                const row = document.createElement('div'); row.className = 'editor-field';
                const meta = document.createElement('div'); meta.className = 'field-meta'; meta.innerHTML = `<strong>${item.label}</strong><small>${item.property === 'text-node' ? 'Text na stránce' : item.property}</small>`;
                const current = state.current.get(item.key) ?? item.original;
                const control = (current.length > 100 || /\n/.test(current)) ? document.createElement('textarea') : document.createElement('input');
                control.className = 'field-control'; control.value = current; if (control.tagName === 'TEXTAREA') control.rows = Math.min(8, Math.max(3, Math.ceil(current.length / 80)));
                control.classList.toggle('is-changed', current !== item.original);
                control.addEventListener('input', () => { state.current.set(item.key, control.value); control.classList.toggle('is-changed', control.value !== item.original); updateDirty(); });
                row.append(meta, control); wrap.append(row);
            });
            section.append(wrap); editor.append(section);
        });
    }
    function updateDirty() {
        state.dirty.clear();
        state.descriptors.forEach(item => {
            const value = state.current.get(item.key) ?? item.original;
            const saved = state.saved.get(item.key) ?? item.original;
            if (value !== saved) state.dirty.set(item.key, value);
        });
        const count = state.dirty.size; $('#saveContent').disabled = count === 0; $('#changeCount').textContent = count ? `${count} neuložených změn` : 'Žádné neuložené změny';
        $('#saveState').textContent = count ? 'Neuložené změny' : 'Vše uloženo'; $('#saveState').classList.toggle('is-dirty', count > 0);
    }
    function renderedDocument(page) {
        return new Promise((resolve, reject) => {
            const frame = document.createElement('iframe');
            frame.className = 'admin-source-frame'; frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true');
            const timer = setTimeout(() => { frame.remove(); reject(new Error('Náhled stránky se načítal příliš dlouho.')); }, 12000);
            frame.addEventListener('load', () => setTimeout(() => {
                clearTimeout(timer);
                try {
                    const doc = frame.contentDocument;
                    if (!doc) throw new Error();
                    resolve({ doc, frame });
                } catch (_) {
                    frame.remove(); reject(new Error('Obsah stránky nelze načíst.'));
                }
            }, 900), { once: true });
            frame.src = '../' + page + '?admin-source=1&t=' + Date.now();
            document.body.append(frame);
        });
    }
    async function loadPage(page) {
        if (!page) return; state.page = page; $('#contentEditor').innerHTML = '<div class="loading">Načítám obsah stránky…</div>'; $('#previewPage').href = '../' + page;
        try {
            const rendered = await renderedDocument(page);
            state.descriptors = extract(rendered.doc); rendered.frame.remove(); state.current.clear(); state.saved.clear();
            const saved = state.api.content.pages?.[page] || [];
            saved.forEach(record => {
                const key = `${record.selector}|${record.property}|${record.node ?? ''}`;
                state.current.set(key, record.value); state.saved.set(key, record.value);
            });
            renderEditor($('#contentSearch').value); updateDirty();
        } catch (error) { $('#contentEditor').innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    async function init() {
        try {
            state.api = await api('api/content.php');
            const select = $('#pageSelect'); Object.entries(state.api.pages).forEach(([file, label]) => select.add(new Option(label, file)));
            $('#pageCount').textContent = Object.keys(state.api.pages).length;
            $('#lastUpdate').textContent = state.api.content.updatedAt ? new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' }).format(new Date(state.api.content.updatedAt)) : 'Zatím žádná';
            select.addEventListener('change', () => { if (state.dirty.size && !confirm('Zahodit neuložené změny?')) { select.value = state.page; return; } loadPage(select.value); });
            await loadPage(select.value);
        } catch (error) { toast(error.message, true); }
    }
    $('#contentSearch').addEventListener('input', event => renderEditor(event.target.value));
    $('#saveContent').addEventListener('click', async () => {
        const records = state.descriptors.map(item => ({ selector: item.selector, property: item.property, ...(item.node !== undefined ? { node: item.node } : {}), value: state.current.get(item.key) ?? item.original })).filter((record, index) => record.value !== state.descriptors[index].original);
        $('#saveContent').disabled = true; $('#saveContent').textContent = 'Ukládám…';
        try {
            const result = await api('api/content.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: state.page, records }) });
            state.api.content.pages[state.page] = records; state.saved.clear();
            state.descriptors.forEach(item => state.saved.set(item.key, state.current.get(item.key) ?? item.original));
            updateDirty(); toast(result.message);
        }
        catch (error) { toast(error.message, true); $('#saveContent').disabled = false; }
        finally { $('#saveContent').textContent = 'Uložit změny'; }
    });
    async function loadMedia() {
        const grid = $('#mediaGrid'); grid.innerHTML = '<div class="loading">Načítám média…</div>';
        try { const data = await api('api/media.php'); grid.innerHTML = data.items.length ? '' : '<div class="empty-state">Zatím jste nenahráli žádné médium.</div>'; data.items.forEach(item => { const card = document.createElement('article'); card.className = 'media-card'; const preview = document.createElement(item.type === 'video' ? 'video' : 'img'); preview.src = new URL(item.url, location.origin + '/').href; if (item.type === 'video') { preview.controls = true; preview.preload = 'metadata'; } else preview.alt = ''; const details = document.createElement('div'); const name = document.createElement('strong'); name.textContent = item.name; const button = document.createElement('button'); button.textContent = 'Kopírovat cestu'; button.addEventListener('click', () => navigator.clipboard.writeText(item.url).then(() => toast('Cesta média zkopírována.'))); details.append(name, button); card.append(preview, details); grid.append(card); }); }
        catch (error) { grid.innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    $('#uploadForm').addEventListener('submit', async event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        try { const result = await api('api/media.php', { method: 'POST', body: form }); toast(result.message); event.currentTarget.reset(); loadMedia(); }
        catch (error) { toast(error.message, true); }
    });
    async function loadVideos() {
        const container = $('#videoProjects');
        container.innerHTML = '<div class="loading">Načítám video projekty…</div>';
        try {
            const data = await api('api/videos.php'); state.videos = data.items;
            container.innerHTML = '';
            data.items.forEach((item, index) => {
                const row = document.createElement('article'); row.className = 'video-project';
                const heading = document.createElement('h3'); heading.textContent = item.title || item.id;
                row.append(heading);
                [['title', 'Název'], ['label', 'Typ projektu'], ['image', 'Náhledový obrázek'], ['alt', 'Popis obrázku'], ['video', 'YouTube odkaz nebo cesta k videu']].forEach(([key, label]) => {
                    const field = document.createElement('label'); field.textContent = label;
                    const input = document.createElement('input'); input.value = item[key] || ''; input.type = key === 'video' || key === 'image' ? 'url' : 'text';
                    if (key === 'video') input.placeholder = 'https://youtu.be/…';
                    input.addEventListener('input', () => { state.videos[index][key] = input.value; if (key === 'title') heading.textContent = input.value || item.id; });
                    field.append(input); row.append(field);
                });
                container.append(row);
            });
        } catch (error) { container.innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    $('#saveVideos').addEventListener('click', async event => {
        event.currentTarget.disabled = true;
        try { const result = await api('api/videos.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: state.videos }) }); state.videos = result.items; toast(result.message); await loadVideos(); }
        catch (error) { toast(error.message, true); }
        finally { event.currentTarget.disabled = false; }
    });
    async function loadHistory() {
        const list = $('#historyList'); list.innerHTML = '<div class="loading">Načítám historii…</div>';
        try { const data = await api('api/history.php'); list.innerHTML = data.items.length ? '' : '<div class="empty-state">Historie vznikne po prvním uložení.</div>'; data.items.forEach(item => { const row = document.createElement('div'); row.className = 'history-item'; row.innerHTML = `<div><strong>${new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(item.date))}</strong><small>Verze ${item.version ?? '—'} · ${item.updatedBy || 'systém'}</small></div><button>Obnovit</button>`; $('button', row).addEventListener('click', async () => { if (!confirm('Obnovit tuto verzi celého obsahu? Současný stav se předtím zazálohuje.')) return; try { const result = await api('api/history.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: item.file }) }); toast(result.message); state.api = await api('api/content.php'); loadHistory(); } catch (error) { toast(error.message, true); } }); list.append(row); }); }
        catch (error) { list.innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    $('#refreshHistory').addEventListener('click', loadHistory);
    $('#passwordForm').addEventListener('submit', async event => {
        event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
        try { const result = await api('api/password.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); toast(result.message); event.currentTarget.reset(); $('.notice.warning')?.remove(); }
        catch (error) { toast(error.message, true); }
    });
    window.addEventListener('beforeunload', event => { if (state.dirty.size) { event.preventDefault(); event.returnValue = ''; } });
    init();
})();
