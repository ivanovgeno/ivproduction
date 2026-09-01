(() => {
    'use strict';
    const csrf = document.body.dataset.csrf;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const state = { api: null, page: '', descriptors: [], dirty: new Map(), current: new Map(), saved: new Map(), videos: [], videosDirty: false, draggedVideo: -1 };
    const titles = { dashboard: 'Přehled webu', content: 'Obsah webu', media: 'Média', videos: 'Portfolio', history: 'Historie změn', security: 'Přístup a zabezpečení' };
    const videoCategories = { svatby: 'Svatby', reality: 'Reality', plesy: 'Plesy & eventy', fotobudka: 'Fotobudka', '360budka': '360° budka', promo: 'Promo', konference: 'Konference', podcast: 'Podcast', reels: 'Reels' };

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
        $('#topPreview').style.display = view === 'content' ? 'inline-flex' : 'none';
        $('#topSaveContent').style.display = view === 'content' ? 'inline-flex' : 'none';
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
    function renderEditor(filter = '', selectedGroup = '') {
        const editor = $('#contentEditor'); const nav = $('#sectionNav'); editor.innerHTML = ''; nav.innerHTML = '';
        const needle = filter.trim().toLocaleLowerCase('cs');
        const groups = new Map();
        state.descriptors.forEach(item => {
            const value = state.current.get(item.key) ?? item.original;
            if (selectedGroup && item.group !== selectedGroup) return;
            if (needle && !`${item.group} ${item.label} ${value}`.toLocaleLowerCase('cs').includes(needle)) return;
            if (!groups.has(item.group)) groups.set(item.group, []); groups.get(item.group).push(item);
        });
        const visibleCount = [...groups.values()].reduce((sum, fields) => sum + fields.length, 0);
        $('#contentResultCount').textContent = `${visibleCount} ${visibleCount === 1 ? 'pole' : visibleCount < 5 ? 'pole' : 'polí'}`;
        if (!groups.size) { editor.innerHTML = '<div class="empty-state">Pro zadané hledání nebyl nalezen žádný obsah.</div>'; return; }
        [...groups].forEach(([group, fields], index) => {
            const id = sectionId(group, index);
            const navButton = document.createElement('button'); navButton.textContent = group; navButton.classList.toggle('is-active', index === 0); navButton.addEventListener('click', () => { $$('.section-nav button').forEach(button => button.classList.remove('is-active')); navButton.classList.add('is-active'); document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }); nav.append(navButton);
            const section = document.createElement('section'); section.className = 'editor-section'; section.id = id;
            const heading = document.createElement('h2'); heading.textContent = group; heading.tabIndex = 0; heading.setAttribute('role', 'button'); heading.setAttribute('aria-expanded', 'true'); heading.addEventListener('click', () => { const collapsed = section.classList.toggle('is-collapsed'); heading.setAttribute('aria-expanded', String(!collapsed)); }); heading.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); heading.click(); } }); section.append(heading);
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
        const count = state.dirty.size; $('#saveContent').disabled = count === 0; $('#topSaveContent').disabled = count === 0; $('#discardContent').disabled = count === 0; $('#changeCount').textContent = count ? `${count} neuložených změn` : 'Žádné neuložené změny';
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
        if (!page) return; state.page = page; $('#contentEditor').innerHTML = '<div class="loading">Načítám obsah stránky…</div>'; $('#topPreview').href = '../' + page;
        try {
            const rendered = await renderedDocument(page);
            state.descriptors = extract(rendered.doc); rendered.frame.remove(); state.current.clear(); state.saved.clear();
            const saved = state.api.content.pages?.[page] || [];
            saved.forEach(record => {
                const key = `${record.selector}|${record.property}|${record.node ?? ''}`;
                state.current.set(key, record.value); state.saved.set(key, record.value);
            });
            const filter = $('#sectionFilter'); filter.innerHTML = '<option value="">Všechny sekce</option>';
            [...new Set(state.descriptors.map(item => item.group))].forEach(group => filter.add(new Option(group, group)));
            renderEditor($('#contentSearch').value, filter.value); updateDirty();
        } catch (error) { $('#contentEditor').innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    async function init() {
        try {
            state.api = await api('api/content.php');
            const blocked = Object.entries(state.api.storage || {}).filter(([, writable]) => !writable).map(([name]) => name);
            if (blocked.length) toast(`Server nemůže zapisovat: ${blocked.join(', ')}. Spusťte ve WEDOS opravu práv souborů.`, true);
            const select = $('#pageSelect'); Object.entries(state.api.pages).forEach(([file, label]) => select.add(new Option(label, file)));
            $('#pageCount').textContent = Object.keys(state.api.pages).length;
            $('#lastUpdate').textContent = state.api.content.updatedAt ? new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' }).format(new Date(state.api.content.updatedAt)) : 'Zatím žádná';
            select.addEventListener('change', () => { if (state.dirty.size && !confirm('Zahodit neuložené změny?')) { select.value = state.page; return; } loadPage(select.value); });
            await loadPage(select.value);
        } catch (error) { toast(error.message, true); }
    }
    $('#contentSearch').addEventListener('input', event => renderEditor(event.target.value, $('#sectionFilter').value));
    $('#sectionFilter').addEventListener('change', event => renderEditor($('#contentSearch').value, event.target.value));
    $('#discardContent').addEventListener('click', () => { state.current = new Map(state.saved); renderEditor($('#contentSearch').value, $('#sectionFilter').value); updateDirty(); toast('Neuložené změny byly zahozeny.'); });
    $('#topSaveContent').addEventListener('click', () => $('#saveContent').click());
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
    function youtubeId(value) {
        try {
            const url = new URL(value); const host = url.hostname.replace(/^www\./, '');
            if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
            if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
                if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || '';
                return url.searchParams.get('v') || '';
            }
        } catch (_) {}
        return '';
    }
    function videoThumb(item) {
        if (item.image) return item.image;
        const id = youtubeId(item.video || '');
        return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '../assets/site/promo.webp';
    }
    function videoMatches(item) {
        const needle = $('#portfolioSearch').value.trim().toLocaleLowerCase('cs');
        const category = $('#portfolioFilter').value;
        return (!needle || `${item.title} ${item.label} ${(item.categories || []).join(' ')}`.toLocaleLowerCase('cs').includes(needle))
            && (!category || (item.categories || []).includes(category));
    }
    function renderVideos() {
        const container = $('#videoProjects'); container.innerHTML = '';
        $('#portfolioCount').textContent = `${state.videos.length} ${state.videos.length === 1 ? 'projekt' : state.videos.length < 5 ? 'projekty' : 'projektů'}`;
        const visible = state.videos.map((item, index) => ({ item, index })).filter(({ item }) => videoMatches(item));
        if (!visible.length) { container.innerHTML = '<div class="portfolio-empty">Žádný projekt neodpovídá hledání.</div>'; return; }
        visible.forEach(({ item, index }) => {
            const row = document.createElement('article'); row.className = 'portfolio-row'; row.draggable = true; row.dataset.index = index;
            const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'drag-handle'; handle.title = 'Přetáhnout projekt'; handle.textContent = '⠿';
            const image = document.createElement('img'); image.className = 'portfolio-thumb'; image.src = videoThumb(item); image.alt = '';
            const project = document.createElement('div'); project.className = 'portfolio-project'; const title = document.createElement('strong'); title.textContent = item.title || 'Bez názvu'; const label = document.createElement('small'); label.textContent = item.label || 'Video projekt'; project.append(title, label);
            const category = document.createElement('div'); category.className = 'portfolio-category'; category.textContent = (item.categories || []).map(key => videoCategories[key] || key).join(', ') || 'Bez kategorie';
            const source = document.createElement('div'); source.className = 'portfolio-source'; source.textContent = item.video || 'Bez videa';
            const actions = document.createElement('div'); actions.className = 'portfolio-actions'; const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Upravit'; edit.addEventListener('click', () => openVideoEditor(index)); const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-video'; remove.textContent = 'Smazat'; remove.addEventListener('click', async () => { if (!confirm(`Opravdu odstranit projekt „${item.title}“?`)) return; const previous = [...state.videos]; state.videos.splice(index, 1); renderVideos(); try { await persistVideos('Projekt byl odstraněn.'); } catch (_) { state.videos = previous; renderVideos(); } }); actions.append(edit, remove);
            row.addEventListener('dragstart', () => { state.draggedVideo = index; row.classList.add('is-dragging'); });
            row.addEventListener('dragend', () => row.classList.remove('is-dragging'));
            row.addEventListener('dragover', event => event.preventDefault());
            row.addEventListener('drop', event => { event.preventDefault(); const from = state.draggedVideo; const to = Number(row.dataset.index); if (from < 0 || from === to) return; const [moved] = state.videos.splice(from, 1); state.videos.splice(to, 0, moved); state.videosDirty = true; $('#saveVideos').disabled = false; renderVideos(); });
            row.append(handle, image, project, category, source, actions); container.append(row);
        });
    }
    async function persistVideos(message = 'Portfolio bylo uloženo.') {
        $('#saveVideos').disabled = true;
        try {
            const result = await api('api/videos.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: state.videos }) });
            state.videos = result.items; state.videosDirty = false; renderVideos(); toast(message || result.message);
        } catch (error) { $('#saveVideos').disabled = false; toast(error.message, true); throw error; }
    }
    async function loadVideos() {
        const container = $('#videoProjects'); container.innerHTML = '<div class="loading">Načítám portfolio…</div>';
        try {
            const data = await api('api/videos.php'); state.videos = data.items; state.videosDirty = false; $('#saveVideos').disabled = true;
            const filter = $('#portfolioFilter'); if (filter.options.length === 1) Object.entries(videoCategories).forEach(([key, label]) => filter.add(new Option(label, key)));
            renderVideos();
        } catch (error) { container.innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    function updateVideoPreview() {
        const preview = $('#videoLivePreview'); const video = $('#videoUrl').value.trim(); const image = $('#videoImage').value.trim(); const id = youtubeId(video);
        if (!image && id) $('#videoImage').value = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        const source = $('#videoImage').value.trim(); preview.innerHTML = '';
        if (source) { const img = document.createElement('img'); img.src = source; img.alt = ''; preview.append(img); }
        else if (/\.(mp4|webm)(?:\?|$)/i.test(video)) { const media = document.createElement('video'); media.src = video; media.controls = true; preview.append(media); }
        else preview.innerHTML = '<span>Náhled videa se zobrazí po vložení odkazu.</span>';
    }
    function openVideoEditor(index = -1) {
        const item = index >= 0 ? state.videos[index] : { title: '', label: '', categories: [], image: '', alt: '', video: '' };
        $('#videoEditIndex').value = String(index); $('#videoDrawerTitle').textContent = index >= 0 ? 'Upravit video' : 'Nové video'; $('#submitVideoEditor').textContent = index >= 0 ? 'Uložit změny' : 'Přidat do portfolia';
        $('#videoTitle').value = item.title || ''; $('#videoLabel').value = item.label || ''; $('#videoUrl').value = item.video || ''; $('#videoImage').value = item.image || ''; $('#videoAlt').value = item.alt || '';
        $$('#videoCategories input').forEach(input => { input.checked = (item.categories || []).includes(input.value); }); $('#videoMediaPicker').hidden = true; updateVideoPreview();
        $('#videoDrawerBackdrop').hidden = false; $('#videoDrawer').classList.add('is-open'); $('#videoDrawer').setAttribute('aria-hidden', 'false'); document.body.classList.add('drawer-open'); setTimeout(() => $('#videoTitle').focus(), 180);
    }
    function closeVideoEditor() { $('#videoDrawer').classList.remove('is-open'); $('#videoDrawer').setAttribute('aria-hidden', 'true'); $('#videoDrawerBackdrop').hidden = true; document.body.classList.remove('drawer-open'); }
    Object.entries(videoCategories).forEach(([key, label]) => { const option = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.value = key; option.append(input, document.createTextNode(label)); $('#videoCategories').append(option); });
    $('#portfolioSearch').addEventListener('input', renderVideos); $('#portfolioFilter').addEventListener('change', renderVideos); $('#saveVideos').addEventListener('click', async () => { try { await persistVideos('Nové pořadí bylo uloženo.'); } catch (_) {} });
    $('#addVideo').addEventListener('click', () => openVideoEditor()); $('#closeVideoDrawer').addEventListener('click', closeVideoEditor); $('#cancelVideoEditor').addEventListener('click', closeVideoEditor); $('#videoDrawerBackdrop').addEventListener('click', closeVideoEditor); document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('#videoDrawer').classList.contains('is-open')) closeVideoEditor(); });
    $('#videoUrl').addEventListener('input', updateVideoPreview); $('#videoImage').addEventListener('input', updateVideoPreview);
    $('#chooseVideoImage').addEventListener('click', async () => { const picker = $('#videoMediaPicker'); picker.hidden = false; picker.innerHTML = '<div class="loading">Načítám…</div>'; try { const data = await api('api/media.php'); const images = data.items.filter(item => item.type === 'image'); picker.innerHTML = images.length ? '' : '<span class="muted">Zatím nejsou nahrané žádné obrázky.</span>'; images.forEach(item => { const button = document.createElement('button'); button.type = 'button'; button.title = item.name; const img = document.createElement('img'); img.src = item.url; img.alt = ''; button.append(img); button.addEventListener('click', () => { $('#videoImage').value = item.url; picker.hidden = true; updateVideoPreview(); }); picker.append(button); }); } catch (error) { picker.textContent = error.message; } });
    $('#uploadVideoImage').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; const form = new FormData(); form.append('file', file); try { const result = await api('api/media.php', { method: 'POST', body: form }); $('#videoImage').value = result.item.url; updateVideoPreview(); toast(result.message); } catch (error) { toast(error.message, true); } finally { event.target.value = ''; } });
    $('#videoEditor').addEventListener('submit', async event => {
        event.preventDefault(); const categories = $$('#videoCategories input:checked').map(input => input.value); if (!categories.length) { toast('Vyberte alespoň jednu kategorii.', true); return; }
        const index = Number($('#videoEditIndex').value); const title = $('#videoTitle').value.trim(); const slug = title.toLocaleLowerCase('cs').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 62) || 'video';
        const existing = index >= 0 ? state.videos[index] : null; const item = { id: existing?.id || `${slug}-${Date.now().toString(36)}`, title, label: $('#videoLabel').value.trim() || videoCategories[categories[0]], categories, image: $('#videoImage').value.trim(), alt: $('#videoAlt').value.trim() || title, video: $('#videoUrl').value.trim() };
        if (index >= 0) state.videos[index] = item; else state.videos.unshift(item); $('#submitVideoEditor').disabled = true;
        try { await persistVideos(index >= 0 ? 'Projekt byl upraven.' : 'Video bylo přidáno do portfolia.'); closeVideoEditor(); }
        catch (_) { if (index >= 0) state.videos[index] = existing; else state.videos.shift(); renderVideos(); }
        finally { $('#submitVideoEditor').disabled = false; }
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
    window.addEventListener('beforeunload', event => { if (state.dirty.size || state.videosDirty) { event.preventDefault(); event.returnValue = ''; } });
    init();
})();
