(() => {
    'use strict';

    const csrf = document.body.dataset.csrf;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const state = {
        api: null,
        page: '',
        descriptors: [],
        current: new Map(),
        saved: new Map(),
        groups: new Map(),
        selectedGroup: '',
        previewDocument: null,
        media: [],
        mediaFilter: 'all',
        mediaAssignment: null,
        mediaPickerCallback: null,
        mediaPickerType: 'image',
        videos: [],
        videosDirty: false,
        draggedVideo: -1,
        blogPosts: [],
        blogStatus: '',
        blogEditing: null,
        slugTouched: false
    };

    const views = {
        dashboard: ['Přehled', 'Vyberte, co chcete na webu upravit.'],
        content: ['Vizuální editor', 'Klikněte na sekci a upravujte ji přímo v náhledu.'],
        media: ['Média', 'Nahrávání a přiřazování fotografií a videí.'],
        videos: ['Portfolio', 'Videoprojekty, kategorie a jejich pořadí.'],
        blog: ['Blog', 'Přidávání, úpravy a publikování článků.'],
        history: ['Historie', 'Bezpečné zálohy provedených změn.'],
        security: ['Přístup', 'Změna přístupových údajů.']
    };
    const videoCategories = { svatby: 'Svatby', reality: 'Reality', plesy: 'Plesy & eventy', fotobudka: 'Fotobudka', '360budka': '360° budka', promo: 'Promo', konference: 'Konference', podcast: 'Podcast', reels: 'Reels' };
    const groupPriority = ['Hlavička a menu', 'Hero', 'Služby', 'Jak to funguje', 'O nás', 'Tým', 'Technika', 'Čísla a výsledky', 'Portfolio', 'Studio', 'Reference', 'Partneři', 'FAQ', 'Kontakt', 'Patička', 'SEO a sdílení', 'Ostatní obsah'];
    const publicRoutes = { 'index.html': '/', 'fotobudka.html': '/ivbudka/', '360budka.html': '/ivbudka360/', 'promo.html': '/aftermovie-promo-hudebniklipy/', 'portfolio.html': '/ukazky/', 'blog.html': '/svatebni-blog/' };

    function toast(message, error = false) {
        const element = $('#toast');
        element.textContent = message;
        element.classList.toggle('is-error', error);
        element.classList.add('is-visible');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => element.classList.remove('is-visible'), 3600);
    }

    async function api(url, options = {}) {
        options.headers = { ...(options.headers || {}), 'X-CSRF-Token': csrf };
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({ ok: false, error: 'Server vrátil neplatnou odpověď.' }));
        if (response.status === 401) location.href = 'login.php';
        if (!response.ok || !data.ok) throw new Error(data.error || 'Operace se nepodařila.');
        return data;
    }

    function show(view) {
        $$('.view').forEach(element => element.classList.toggle('is-active', element.dataset.panel === view));
        $$('.nav-item').forEach(element => element.classList.toggle('is-active', element.dataset.view === view));
        $('#viewTitle').textContent = views[view]?.[0] || 'Administrace';
        $('#viewSubtitle').textContent = views[view]?.[1] || '';
        $('#topPreview').style.display = view === 'content' ? 'inline-flex' : 'none';
        $('#topSaveContent').style.display = view === 'content' ? 'inline-flex' : 'none';
        $('#sidebar').classList.remove('is-open');
        if (view === 'media') loadMedia();
        if (view === 'videos') loadVideos();
        if (view === 'blog') loadBlog();
        if (view === 'history') loadHistory();
    }

    $$('[data-view]').forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
    $$('[data-go]').forEach(button => button.addEventListener('click', () => {
        show(button.dataset.go);
        if (button.dataset.page && $('#pageSelect')) {
            $('#pageSelect').value = button.dataset.page;
            loadPage(button.dataset.page);
        }
    }));
    $('#adminMenu').addEventListener('click', () => $('#sidebar').classList.toggle('is-open'));

    function publicUrl(page) {
        if (publicRoutes[page]) return publicRoutes[page];
        if (page.startsWith('l/')) return '/' + page.replace(/index\.html$/, '');
        return '/' + page.replace(/\.html$/, '/') ;
    }

    function sourceUrl(page) {
        const url = new URL('../' + page, location.href);
        url.searchParams.set('admin-source', String(Date.now()));
        return url.href;
    }

    function cssEscape(value) {
        return window.CSS?.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    }

    function selectorFor(element, documentNode) {
        if (element.id) return '#' + cssEscape(element.id);
        const parts = [];
        let current = element;
        while (current && current !== documentNode.body && parts.length < 9) {
            let part = current.tagName.toLowerCase();
            const stable = [...current.classList].find(name => !/^(animate|delay-|active|is-|scrolled|visible|reveal)/.test(name));
            if (stable) part += '.' + cssEscape(stable);
            const siblings = current.parentElement ? [...current.parentElement.children].filter(child => child.tagName === current.tagName) : [];
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            parts.unshift(part);
            const candidate = parts.join(' > ');
            try { if (documentNode.querySelectorAll(candidate).length === 1) return candidate; } catch (_) {}
            current = current.parentElement;
        }
        return 'body > ' + parts.join(' > ');
    }

    function groupFor(element) {
        if (element.closest('.tech-section,.tech-category,.tech-item')) return 'Technika';
        if (element.closest('.team-section,.team-grid,.team-member')) return 'Tým';
        if (element.closest('.premium-page-hero,.hero,.article-hero,.blog-hero')) return 'Hero';
        if (element.closest('header.header,[data-unified-nav]')) return 'Hlavička a menu';
        if (element.closest('footer')) return 'Patička';
        const section = element.closest('section, main > div, article');
        if (!section) return 'Ostatní obsah';
        const known = { sluzby: 'Služby', 'jak-to-funguje': 'Jak to funguje', onas: 'O nás', portfolio: 'Portfolio', studio: 'Studio', recenze: 'Reference', partneri: 'Partneři', faq: 'FAQ', poptavka: 'Kontakt', clanky: 'Články' };
        if (known[section.id]) return known[section.id];
        if (section.classList.contains('stats-section')) return 'Čísla a výsledky';
        const heading = section.querySelector('h1,h2');
        if (heading?.textContent.trim()) return heading.textContent.trim().replace(/\s+/g, ' ').slice(0, 48);
        if (section.id) return section.id.replace(/[-_]/g, ' ');
        return [...section.classList][0]?.replace(/[-_]/g, ' ') || 'Ostatní obsah';
    }

    function contextFor(element) {
        const owner = element.closest('.team-member,.tech-item,.service-card,.process-step,.portfolio-item,.faq-item,article');
        if (!owner) return '';
        const context = owner.querySelector('.member-name,.team-name,.tech-name,h3,h2,strong');
        return context?.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) || '';
    }

    function friendlyLabel(element, property) {
        const tag = element.tagName.toLowerCase();
        const context = contextFor(element);
        if (property === 'css-var') return 'Fotografie na pozadí';
        if (property === 'style-background-image') return context ? `Fotografie – ${context}` : 'Fotografie na pozadí';
        if (property === 'src' && tag === 'img') return context ? `Fotografie – ${context}` : 'Fotografie';
        if (property === 'alt') return context ? `Popis fotografie – ${context}` : 'Popis fotografie';
        if (property === 'poster') return 'Náhledový obrázek videa';
        if (property === 'src' && tag === 'source') return 'Soubor videa';
        if (property === 'src' && tag === 'video') return 'Soubor videa';
        if (property === 'data-video' || (property === 'src' && tag === 'iframe')) return 'Odkaz na video';
        if (property === 'href') return 'Odkaz po kliknutí';
        if (property === 'placeholder') return 'Nápověda uvnitř pole';
        if (property === 'title') return 'Titulek stránky pro Google';
        if (property === 'json-ld') return 'Strukturovaná data';
        if (element.classList.contains('section-badge')) return 'Malý nadpis sekce';
        if (element.classList.contains('service-card-label')) return 'Označení služby';
        if (element.classList.contains('tech-name')) return 'Název techniky';
        if (element.classList.contains('tech-desc')) return 'Popis techniky';
        if (element.classList.contains('about-team-kicker') || element.classList.contains('studio-eyebrow')) return 'Malý nadpis';
        if (tag === 'h1') return 'Hlavní nadpis';
        if (tag === 'h2') return 'Nadpis sekce';
        if (tag === 'h3' || tag === 'h4') return context ? `Název – ${context}` : 'Název položky';
        if (tag === 'a' || tag === 'button') return 'Text tlačítka nebo odkazu';
        if (tag === 'li') return 'Bod seznamu';
        if (tag === 'label') return 'Popisek pole';
        if (tag === 'option') return 'Možnost výběru';
        return context ? `Text – ${context}` : 'Text';
    }

    function descriptorKey(descriptor) {
        return `${descriptor.selector}|${descriptor.property}|${descriptor.node ?? ''}|${descriptor.styleName ?? ''}`;
    }

    function addDescriptor(list, descriptor) {
        descriptor.key = descriptorKey(descriptor);
        descriptor.context = descriptor.context || '';
        if (!list.some(item => item.key === descriptor.key)) list.push(descriptor);
    }

    function extract(documentNode, includeSeo = true) {
        const list = [];
        if (includeSeo) {
            const title = documentNode.querySelector('title');
            if (title) addDescriptor(list, { selector: 'title', property: 'title', original: title.textContent.trim(), label: 'Titulek stránky pro Google', group: 'SEO a sdílení' });
            const fields = [
                ['meta[name="description"]', 'content', 'Popis stránky pro Google'],
                ['link[rel="canonical"]', 'href', 'Canonical URL'],
                ['meta[property="og:title"]', 'content', 'Titulek při sdílení'],
                ['meta[property="og:description"]', 'content', 'Popis při sdílení'],
                ['meta[property="og:image"]', 'content', 'Obrázek při sdílení']
            ];
            fields.forEach(([selector, property, label]) => {
                const element = documentNode.querySelector(selector);
                const value = element?.getAttribute(property) || '';
                if (value) addDescriptor(list, { selector, property, original: value, label, group: 'SEO a sdílení', type: property === 'content' ? 'text' : 'url' });
            });
        }

        documentNode.querySelectorAll('h1,h2,h3,h4,p,li,label,a,button,option,.section-badge,.service-card-label,.about-team-kicker,.studio-eyebrow,.tech-name,.tech-desc').forEach(element => {
            if (element.closest('script,style,svg,noscript,[data-privacy-banner],.privacy-embed-placeholder,#mobileMenuOverlay') || element.closest('.back-to-top,.quick-contact')) return;
            const selector = selectorFor(element, documentNode);
            const group = groupFor(element);
            const context = contextFor(element);
            const textNodes = [...element.childNodes].filter(node => node.nodeType === 3 && node.nodeValue.trim());
            textNodes.forEach((node, index) => addDescriptor(list, { selector, property: 'text-node', node: index, original: node.nodeValue.trim(), label: friendlyLabel(element, 'text-node'), group, context }));
            if (element.tagName === 'A' && element.getAttribute('href')) addDescriptor(list, { selector, property: 'href', original: element.getAttribute('href'), label: friendlyLabel(element, 'href'), group, context, type: 'url' });
        });
        documentNode.querySelectorAll('img').forEach(element => {
            const selector = selectorFor(element, documentNode); const group = groupFor(element); const context = contextFor(element);
            addDescriptor(list, { selector, property: 'src', original: element.getAttribute('src') || '', label: friendlyLabel(element, 'src'), group, context, type: 'image' });
            addDescriptor(list, { selector, property: 'alt', original: element.getAttribute('alt') || '', label: friendlyLabel(element, 'alt'), group, context });
        });
        documentNode.querySelectorAll('video').forEach(element => {
            const selector = selectorFor(element, documentNode); const group = groupFor(element);
            if (element.hasAttribute('src')) addDescriptor(list, { selector, property: 'src', original: element.getAttribute('src') || '', label: 'Soubor videa', group, type: 'video' });
            if (element.hasAttribute('poster')) addDescriptor(list, { selector, property: 'poster', original: element.getAttribute('poster') || '', label: 'Náhledový obrázek videa', group, type: 'image' });
        });
        documentNode.querySelectorAll('video source').forEach(element => addDescriptor(list, { selector: selectorFor(element, documentNode), property: 'src', original: element.getAttribute('src') || '', label: 'Soubor videa', group: groupFor(element), type: 'video' }));
        documentNode.querySelectorAll('iframe[src]').forEach(element => addDescriptor(list, { selector: selectorFor(element, documentNode), property: 'src', original: element.getAttribute('src') || '', label: 'Odkaz na vložené video', group: groupFor(element), type: 'url' }));
        documentNode.querySelectorAll('[data-video]').forEach(element => addDescriptor(list, { selector: selectorFor(element, documentNode), property: 'data-video', original: element.getAttribute('data-video') || '', label: 'Odkaz na video', group: groupFor(element), type: 'url' }));
        documentNode.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(element => addDescriptor(list, { selector: selectorFor(element, documentNode), property: 'placeholder', original: element.getAttribute('placeholder') || '', label: 'Nápověda uvnitř pole', group: groupFor(element) }));
        documentNode.querySelectorAll('[style*="background-image"]').forEach(element => {
            const match = element.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/i);
            if (match?.[1]) addDescriptor(list, { selector: selectorFor(element, documentNode), property: 'style-background-image', original: match[1], label: friendlyLabel(element, 'style-background-image'), group: groupFor(element), context: contextFor(element), type: 'image' });
        });
        documentNode.querySelectorAll('[data-photo-slot],.tech-placeholder').forEach(element => {
            const selector = selectorFor(element, documentNode);
            const inline = element.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/i)?.[1] || '';
            addDescriptor(list, {
                selector,
                property: 'style-background-image',
                original: inline,
                label: friendlyLabel(element, 'style-background-image'),
                group: groupFor(element),
                context: contextFor(element),
                type: 'image'
            });
        });
        const hero = documentNode.querySelector('.premium-page-hero,.hero');
        if (hero) {
            let current = '';
            try {
                const raw = hero.ownerDocument.defaultView?.getComputedStyle(hero).getPropertyValue('--hero-image') || '';
                current = raw.match(/url\(["']?(.*?)["']?\)/i)?.[1] || '';
            } catch (_) {}
            addDescriptor(list, { selector: selectorFor(hero, documentNode), property: 'css-var', styleName: '--hero-image', original: current, label: 'Fotografie na pozadí', group: 'Hero', type: 'image' });
        }
        return list.filter(item => item.original !== '' || ['css-var', 'style-background-image'].includes(item.property));
    }

    function recordKey(record) {
        return descriptorKey({ selector: record.selector, property: record.property, node: record.node, styleName: record.styleName });
    }

    function applyValue(documentNode, descriptor, value) {
        let element;
        try { element = documentNode.querySelector(descriptor.selector); } catch (_) { return; }
        if (!element) return;
        if (descriptor.property === 'text-node') {
            const nodes = [...element.childNodes].filter(node => node.nodeType === 3 && node.nodeValue.trim());
            const node = nodes[Number(descriptor.node || 0)];
            if (!node) return;
            const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
            const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
            node.nodeValue = leading + value + trailing;
        } else if (descriptor.property === 'title' && element.tagName === 'TITLE') {
            element.textContent = value;
        } else if (descriptor.property === 'css-var') {
            element.style.setProperty(descriptor.styleName || '--hero-image', `url("${String(value).replace(/["\\]/g, '')}")`);
        } else if (descriptor.property === 'style-background-image') {
            const cleanValue = String(value).replace(/["\\]/g, '');
            element.style.backgroundImage = cleanValue ? `url("${cleanValue}")` : '';
            if (element.matches('[data-photo-slot],.tech-placeholder')) {
                element.style.backgroundPosition = cleanValue ? 'center' : '';
                element.style.backgroundRepeat = cleanValue ? 'no-repeat' : '';
                element.style.backgroundSize = cleanValue ? (element.classList.contains('tech-placeholder') ? 'contain' : 'cover') : '';
                element.querySelectorAll(':scope > *').forEach(child => { child.style.visibility = cleanValue ? 'hidden' : ''; });
            }
        } else if (descriptor.property === 'json-ld') {
            const scripts = documentNode.querySelectorAll(descriptor.selector);
            if (scripts[Number(descriptor.node || 0)]) scripts[Number(descriptor.node || 0)].textContent = value;
        } else {
            element.setAttribute(descriptor.property, value);
            if (descriptor.property === 'src' && element.tagName === 'IMG') element.removeAttribute('srcset');
        }
    }

    function savedRecords(page) {
        return [...(state.api?.content?.pages?.['*'] || []), ...(state.api?.content?.pages?.[page] || [])];
    }

    function mergeSavedValues(descriptors, page) {
        const records = new Map(savedRecords(page).map(record => [recordKey(record), record]));
        descriptors.forEach(descriptor => {
            const record = records.get(descriptor.key);
            if (record) descriptor.original = String(record.value ?? '');
        });
    }

    function sortGroups(groups) {
        return [...groups].sort((a, b) => {
            const ai = groupPriority.indexOf(a); const bi = groupPriority.indexOf(b);
            if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            return a.localeCompare(b, 'cs');
        });
    }

    function buildGroups() {
        state.groups = new Map();
        state.descriptors.forEach(item => {
            if (!state.groups.has(item.group)) state.groups.set(item.group, []);
            state.groups.get(item.group).push(item);
        });
    }

    function renderSectionNav() {
        const nav = $('#sectionNav');
        const query = $('#sectionSearch').value.trim().toLocaleLowerCase('cs');
        nav.innerHTML = '';
        const groups = sortGroups(state.groups.keys());
        groups.forEach(group => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'section-button';
            button.textContent = group;
            button.hidden = query !== '' && !group.toLocaleLowerCase('cs').includes(query);
            button.classList.toggle('is-active', group === state.selectedGroup);
            button.addEventListener('click', () => selectGroup(group));
            nav.append(button);
        });
        if (!groups.length) nav.innerHTML = '<div class="empty-state">Na této stránce jsme nenašli upravitelné sekce.</div>';
    }

    function fieldControl(descriptor) {
        const value = state.current.get(descriptor.key) ?? '';
        const wrapper = document.createElement('div');
        wrapper.className = 'inspector-field';
        wrapper.classList.toggle('is-changed', value !== state.saved.get(descriptor.key));
        const label = document.createElement('label');
        label.textContent = descriptor.label;
        wrapper.append(label);
        const isLong = descriptor.property === 'json-ld' || String(value).length > 90 || (descriptor.property === 'text-node' && String(value).length > 55);
        const control = document.createElement(isLong ? 'textarea' : 'input');
        control.value = value;
        if (isLong) control.rows = descriptor.property === 'json-ld' ? 9 : 3;
        control.addEventListener('focus', () => highlightField(descriptor));
        control.addEventListener('input', () => {
            state.current.set(descriptor.key, control.value);
            wrapper.classList.toggle('is-changed', control.value !== state.saved.get(descriptor.key));
            if (state.previewDocument) applyValue(state.previewDocument, descriptor, control.value);
            if (descriptor.type === 'image') updateInspectorImage(wrapper, control.value, descriptor);
            updateDirty();
        });
        wrapper.append(control);
        if (descriptor.context && !descriptor.label.includes(descriptor.context)) {
            const hint = document.createElement('small'); hint.textContent = `Umístění: ${descriptor.context}`; wrapper.append(hint);
        }
        if (descriptor.type === 'image') {
            const imageBox = document.createElement('div'); imageBox.className = 'inspector-image'; wrapper.append(imageBox);
            const actions = document.createElement('div'); actions.className = 'inspector-image-actions';
            const choose = document.createElement('button'); choose.type = 'button'; choose.className = 'button ghost'; choose.textContent = 'Vybrat z médií';
            choose.addEventListener('click', () => openMediaPicker(url => { control.value = url; control.dispatchEvent(new Event('input')); }));
            const upload = document.createElement('label'); upload.className = 'button ghost upload-button'; upload.textContent = 'Nahrát nový';
            const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/jpeg,image/png,image/webp,image/gif';
            file.addEventListener('change', async () => { if (!file.files[0]) return; const item = await uploadFile(file.files[0]); if (item) { control.value = item.url; control.dispatchEvent(new Event('input')); } file.value = ''; });
            upload.append(file); actions.append(choose, upload); wrapper.append(actions);
            updateInspectorImage(wrapper, value, descriptor);
        }
        return wrapper;
    }

    function updateInspectorImage(wrapper, value) {
        const box = $('.inspector-image', wrapper);
        if (!box) return;
        box.innerHTML = '';
        if (!value) { box.innerHTML = '<div class="empty-state">Zatím není vybraná fotografie.</div>'; return; }
        const image = document.createElement('img'); image.src = value; image.alt = ''; box.append(image);
    }

    function renderInspector() {
        const inspector = $('#sectionInspector');
        const items = state.groups.get(state.selectedGroup) || [];
        inspector.innerHTML = '';
        inspector.classList.toggle('has-selection', Boolean(state.selectedGroup));
        if (!items.length) { inspector.innerHTML = '<div class="inspector-empty"><strong>Vyberte sekci</strong><p>Vlevo zvolte část stránky, kterou chcete upravit.</p></div>'; return; }
        const header = document.createElement('div'); header.className = 'inspector-header';
        const title = document.createElement('h2'); title.textContent = state.selectedGroup;
        const count = document.createElement('p'); count.textContent = `${items.length} upravitelných položek · změny ihned vidíte v náhledu`;
        header.append(title, count);
        const fields = document.createElement('div'); fields.className = 'inspector-fields';
        const general = items.filter(item => !item.context);
        const contextual = new Map();
        items.filter(item => item.context).forEach(item => {
            if (!contextual.has(item.context)) contextual.set(item.context, []);
            contextual.get(item.context).push(item);
        });
        general.forEach(item => fields.append(fieldControl(item)));
        contextual.forEach((contextItems, context) => {
            const block = document.createElement('details'); block.className = 'inspector-block';
            if (contextual.size === 1 || items.length < 10) block.open = true;
            const summary = document.createElement('summary');
            const title = document.createElement('strong'); title.textContent = context;
            const count = document.createElement('span'); count.textContent = `${contextItems.length} ${contextItems.length === 1 ? 'položka' : contextItems.length < 5 ? 'položky' : 'položek'}`;
            summary.append(title, count); block.append(summary);
            const blockFields = document.createElement('div'); blockFields.className = 'inspector-block-fields';
            contextItems.forEach(item => blockFields.append(fieldControl(item)));
            block.append(blockFields); fields.append(block);
        });
        inspector.append(header, fields);
    }

    function groupRoot(documentNode, group) {
        const selectors = {
            'Hlavička a menu': 'header.header,[data-unified-nav]', Hero: '.premium-page-hero,.hero,.article-hero,.blog-hero', Služby: '#sluzby,.services',
            'Jak to funguje': '#jak-to-funguje,.process', 'O nás': '#onas,.about', Tým: '.team-section,.team-grid', Technika: '.tech-section',
            'Čísla a výsledky': '.stats-section', Portfolio: '#portfolio,.portfolio', Studio: '#studio,.studio', Reference: '#recenze,.testimonials',
            Partneři: '#partneri,.partners', FAQ: '#faq,.faq', Kontakt: '#poptavka,.contact', Patička: 'footer'
        };
        if (selectors[group]) {
            const match = documentNode.querySelector(selectors[group]);
            if (match) return match;
        }
        const first = state.groups.get(group)?.[0];
        if (!first) return null;
        try {
            const element = documentNode.querySelector(first.selector);
            return element?.closest('section,article,header,footer,main > div') || element;
        } catch (_) { return null; }
    }

    function highlightGroup() {
        const documentNode = state.previewDocument;
        if (!documentNode) return;
        documentNode.querySelectorAll('[data-ivp-selected],[data-ivp-field]').forEach(element => {
            element.removeAttribute('data-ivp-selected'); element.removeAttribute('data-ivp-field');
        });
        let style = documentNode.getElementById('ivp-admin-highlight');
        if (!style) {
            style = documentNode.createElement('style'); style.id = 'ivp-admin-highlight';
            style.textContent = '[data-ivp-selected]{outline:3px solid #d5a630!important;outline-offset:-3px!important;position:relative!important}[data-ivp-field]{outline:4px solid #ffbf21!important;outline-offset:3px!important;position:relative!important;z-index:20!important}';
            documentNode.head.append(style);
        }
        const root = groupRoot(documentNode, state.selectedGroup);
        if (!root) return;
        root.setAttribute('data-ivp-selected', '');
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function highlightField(descriptor) {
        const documentNode = state.previewDocument;
        if (!documentNode) return;
        documentNode.querySelectorAll('[data-ivp-field]').forEach(element => element.removeAttribute('data-ivp-field'));
        let element;
        try { element = documentNode.querySelector(descriptor.selector); } catch (_) { return; }
        if (!element || element.tagName === 'META' || element.tagName === 'LINK' || element.tagName === 'TITLE') return;
        element.setAttribute('data-ivp-field', '');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function selectGroup(group) {
        state.selectedGroup = group;
        renderSectionNav();
        renderInspector();
        highlightGroup();
    }

    function updateDirty() {
        const changed = [...state.current].filter(([key, value]) => value !== state.saved.get(key)).length;
        $('#saveContent').disabled = changed === 0;
        $('#discardContent').disabled = changed === 0;
        $('#topSaveContent').disabled = changed === 0;
        $('#changeCount').textContent = changed ? `${changed} ${changed === 1 ? 'neuložená změna' : changed < 5 ? 'neuložené změny' : 'neuložených změn'}` : 'Žádné neuložené změny';
        $('#saveState').textContent = changed ? 'Neuložené změny' : 'Vše uloženo';
        $('#saveState').classList.toggle('is-dirty', changed > 0);
    }

    async function loadPage(page, preferredGroup = '') {
        state.page = page;
        state.selectedGroup = '';
        $('#sectionNav').innerHTML = '<div class="loading">Načítám skutečnou stránku…</div>';
        $('#sectionInspector').innerHTML = '<div class="inspector-empty"><strong>Načítám náhled</strong><p>Za okamžik uvidíte všechny sekce této stránky.</p></div>';
        const frame = $('#visualPreview');
        $('#topPreview').href = new URL(publicUrl(page), location.origin).href;
        $('#previewAddress').textContent = 'www.ivproduction.cz' + publicUrl(page);
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Náhled stránky se nepodařilo načíst.')), 20000);
            frame.onload = () => { clearTimeout(timer); resolve(); };
            frame.src = sourceUrl(page);
        }).catch(error => toast(error.message, true));
        const documentNode = frame.contentDocument;
        if (!documentNode) return;
        state.previewDocument = documentNode;
        state.descriptors = extract(documentNode, true);
        mergeSavedValues(state.descriptors, page);
        state.saved = new Map(state.descriptors.map(item => [item.key, item.original]));
        state.current = new Map(state.saved);
        state.descriptors.forEach(item => applyValue(documentNode, item, item.original));
        buildGroups();
        const groups = sortGroups(state.groups.keys());
        state.selectedGroup = preferredGroup && state.groups.has(preferredGroup) ? preferredGroup : (state.groups.has('Hero') ? 'Hero' : groups[0] || '');
        renderSectionNav();
        renderInspector();
        updateDirty();
        setTimeout(highlightGroup, 250);
    }

    function contentRecords(descriptors = state.descriptors, values = state.current) {
        return descriptors.map(item => {
            const record = { selector: item.selector, property: item.property, value: values.get(item.key) ?? item.original ?? '' };
            if (item.property === 'text-node' || item.property === 'json-ld') record.node = item.node || 0;
            if (item.property === 'css-var') record.styleName = item.styleName || '--hero-image';
            return record;
        });
    }

    async function savePageRecords(page, descriptors, values, message = true) {
        const result = await api('api/content.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page, records: contentRecords(descriptors, values) }) });
        state.api.content.pages[page] = contentRecords(descriptors, values);
        state.api.content.updatedAt = result.updatedAt;
        if (message) toast(result.message);
        return result;
    }

    $('#sectionSearch').addEventListener('input', renderSectionNav);
    $$('.device-switcher button').forEach(button => button.addEventListener('click', () => {
        $$('.device-switcher button').forEach(item => item.classList.toggle('is-active', item === button));
        $('#previewFrameWrap').className = `preview-frame-wrap is-${button.dataset.device}`;
    }));
    $('#discardContent').addEventListener('click', () => {
        state.current = new Map(state.saved);
        state.descriptors.forEach(item => applyValue(state.previewDocument, item, state.saved.get(item.key) ?? ''));
        renderInspector(); updateDirty(); toast('Neuložené změny byly zahozeny.');
    });
    $('#topSaveContent').addEventListener('click', () => $('#saveContent').click());
    $('#saveContent').addEventListener('click', async () => {
        try {
            await savePageRecords(state.page, state.descriptors, state.current);
            state.saved = new Map(state.current);
            renderInspector(); updateDirty();
        } catch (error) { toast(error.message, true); }
    });

    // Media -----------------------------------------------------------------
    async function loadMedia(force = false) {
        const grid = $('#mediaGrid');
        if (!state.media.length || force) grid.innerHTML = '<div class="loading">Načítám média…</div>';
        try {
            const data = await api('api/media.php');
            state.media = data.items;
            renderMedia();
        } catch (error) { grid.innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }

    function renderMedia() {
        const grid = $('#mediaGrid');
        const search = $('#mediaSearch').value.trim().toLocaleLowerCase('cs');
        const sort = $('#mediaSort').value;
        let items = state.media.filter(item => (state.mediaFilter === 'all' || item.type === state.mediaFilter) && (!search || item.name.toLocaleLowerCase('cs').includes(search)));
        items = [...items].sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'cs') : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
        grid.innerHTML = '';
        if (!items.length) { grid.innerHTML = '<div class="empty-state">Žádné médium neodpovídá výběru.</div>'; return; }
        items.forEach(item => {
            const card = document.createElement('article'); card.className = 'media-card';
            const preview = document.createElement(item.type === 'video' ? 'video' : 'img'); preview.src = item.url; preview.alt = item.name;
            if (item.type === 'video') { preview.controls = true; preview.preload = 'metadata'; }
            const details = document.createElement('div'); details.className = 'media-card-details';
            const name = document.createElement('strong'); name.textContent = item.name;
            const actions = document.createElement('div'); actions.className = 'media-card-actions';
            const use = document.createElement('button'); use.type = 'button'; use.className = 'use-media'; use.textContent = 'Použít na webu'; use.addEventListener('click', () => openMediaAssignment(item));
            const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = '•••'; copy.title = 'Kopírovat cestu'; copy.addEventListener('click', () => navigator.clipboard.writeText(item.url).then(() => toast('Cesta média byla zkopírována.')));
            actions.append(use, copy); details.append(name, actions); card.append(preview, details); grid.append(card);
        });
    }

    async function uploadFile(file) {
        const form = new FormData(); form.append('file', file);
        try {
            const result = await api('api/media.php', { method: 'POST', body: form });
            toast(result.message); await loadMedia(true); return result.item;
        } catch (error) { toast(error.message, true); return null; }
    }

    async function uploadFiles(files, assignAfter = true) {
        let last = null;
        for (const file of files) last = await uploadFile(file) || last;
        if (assignAfter && last) openMediaAssignment(last);
    }

    $('#uploadForm').addEventListener('submit', async event => { event.preventDefault(); const file = $('#mediaFile').files[0]; if (file) await uploadFiles([file]); event.currentTarget.reset(); });
    $('#mediaFileTop').addEventListener('change', async event => { await uploadFiles([...event.target.files]); event.target.value = ''; });
    const dropzone = $('#uploadForm');
    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('is-dragging'); }));
    dropzone.addEventListener('drop', event => uploadFiles([...event.dataTransfer.files]));
    $('#mediaSearch').addEventListener('input', renderMedia); $('#mediaSort').addEventListener('change', renderMedia);
    $$('#mediaFilters button').forEach(button => button.addEventListener('click', () => { state.mediaFilter = button.dataset.filter; $$('#mediaFilters button').forEach(item => item.classList.toggle('is-active', item === button)); renderMedia(); }));

    async function pageDescriptors(page) {
        const response = await fetch(sourceUrl(page), { credentials: 'same-origin' });
        if (!response.ok) throw new Error('Stránku se nepodařilo načíst.');
        const documentNode = new DOMParser().parseFromString(await response.text(), 'text/html');
        const descriptors = extract(documentNode, false);
        mergeSavedValues(descriptors, page);
        return descriptors;
    }

    function assignmentTargets() {
        if (!state.mediaAssignment) return [];
        return state.mediaAssignment.descriptors.filter(item => {
            if (item.group !== $('#assignSection').value) return false;
            return state.mediaAssignment.item.type === 'image' ? item.type === 'image' : item.type === 'video';
        });
    }

    function refreshAssignmentSections() {
        const select = $('#assignSection');
        const mediaType = state.mediaAssignment.item.type;
        const groups = sortGroups(new Set(state.mediaAssignment.descriptors.filter(item => item.type === mediaType).map(item => item.group)));
        select.innerHTML = groups.map(group => `<option>${group}</option>`).join('');
        if (groups.includes('Tým')) select.value = 'Tým';
        else if (groups.includes('Hero')) select.value = 'Hero';
        refreshAssignmentTargets();
    }

    function refreshAssignmentTargets() {
        const targets = assignmentTargets();
        $('#assignTarget').innerHTML = targets.map(item => `<option value="${item.key.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${item.label}</option>`).join('');
        const selected = targets.find(item => item.key === $('#assignTarget').value) || targets[0];
        $('#assignmentLocation').innerHTML = selected ? `<strong>${selected.label}</strong><span>${$('#assignSection').value} · ${state.api.pages[state.mediaAssignment.page] || state.mediaAssignment.page}</span>` : '<span>V této sekci není vhodné umístění pro tento typ souboru.</span>';
    }

    async function loadAssignmentPage(page) {
        $('#assignSection').innerHTML = '<option>Načítám…</option>';
        try {
            state.mediaAssignment.page = page;
            state.mediaAssignment.descriptors = await pageDescriptors(page);
            refreshAssignmentSections();
        } catch (error) { toast(error.message, true); }
    }

    async function openMediaAssignment(item) {
        if (!state.api) return;
        state.mediaAssignment = { item, page: $('#pageSelect').value || 'index.html', descriptors: [] };
        const preview = $('#mediaAssignPreview'); preview.innerHTML = '';
        const media = document.createElement(item.type === 'video' ? 'video' : 'img'); media.src = item.url; media.alt = item.name; if (item.type === 'video') media.controls = true; preview.append(media);
        $('#assignPage').innerHTML = Object.entries(state.api.pages).map(([file, label]) => `<option value="${file}">${label}</option>`).join('');
        $('#assignPage').value = state.mediaAssignment.page;
        openDrawer($('#mediaAssignDrawer'));
        await loadAssignmentPage(state.mediaAssignment.page);
    }

    $('#assignPage').addEventListener('change', event => loadAssignmentPage(event.target.value));
    $('#assignSection').addEventListener('change', refreshAssignmentTargets); $('#assignTarget').addEventListener('change', refreshAssignmentTargets);
    $('#mediaAssignForm').addEventListener('submit', async event => {
        event.preventDefault();
        const target = state.mediaAssignment?.descriptors.find(item => item.key === $('#assignTarget').value);
        if (!target) { toast('Vyberte konkrétní umístění.', true); return; }
        const values = new Map(state.mediaAssignment.descriptors.map(item => [item.key, item.original]));
        values.set(target.key, state.mediaAssignment.item.url);
        try {
            await savePageRecords(state.mediaAssignment.page, state.mediaAssignment.descriptors, values, false);
            closeDrawers(); toast(`Médium bylo přiřazeno: ${target.label}.`);
            if (state.page === state.mediaAssignment.page) loadPage(state.page, target.group);
        } catch (error) { toast(error.message, true); }
    });

    async function openMediaPicker(callback, type = 'image') {
        state.mediaPickerCallback = callback;
        state.mediaPickerType = type;
        if (!state.media.length) await loadMedia(true);
        $('#mediaPickerTitle').textContent = type === 'video' ? 'Vybrat nahrané video' : 'Vybrat fotografii';
        $('#mediaPickerModal').hidden = false;
        $('#mediaPickerSearch').value = '';
        renderMediaPicker();
    }

    function renderMediaPicker() {
        const query = $('#mediaPickerSearch').value.trim().toLocaleLowerCase('cs');
        const items = state.media.filter(item => item.type === state.mediaPickerType && (!query || item.name.toLocaleLowerCase('cs').includes(query)));
        const grid = $('#mediaPickerGrid'); grid.innerHTML = '';
        items.forEach(item => {
            const button = document.createElement('button'); button.type = 'button';
            const image = document.createElement(item.type === 'video' ? 'video' : 'img'); image.src = item.url; image.alt = item.name;
            if (item.type === 'video') { image.muted = true; image.preload = 'metadata'; }
            const name = document.createElement('span'); name.textContent = item.name;
            button.append(image, name); button.addEventListener('click', () => { state.mediaPickerCallback?.(item.url); $('#mediaPickerModal').hidden = true; }); grid.append(button);
        });
        if (!items.length) grid.innerHTML = '<div class="empty-state">Nenalezen žádný obrázek.</div>';
    }
    $('#mediaPickerSearch').addEventListener('input', renderMediaPicker); $('#closeMediaPicker').addEventListener('click', () => $('#mediaPickerModal').hidden = true); $('#mediaPickerModal').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.hidden = true; });

    // Portfolio -------------------------------------------------------------
    function youtubeId(value) {
        try {
            const url = new URL(value, location.origin);
            if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || '';
            if (url.hostname.includes('youtube.com')) return url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([A-Za-z0-9_-]+)/)?.[1] || '';
        } catch (_) {}
        return String(value).match(/youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]+)/)?.[1] || '';
    }
    function videoThumb(item) { return item.image || (youtubeId(item.video) ? `https://i.ytimg.com/vi/${youtubeId(item.video)}/hqdefault.jpg` : ''); }
    function videoMatches(item) {
        const search = $('#portfolioSearch').value.trim().toLocaleLowerCase('cs'); const category = $('#portfolioFilter').value;
        return (!search || `${item.title} ${item.label} ${(item.categories || []).join(' ')}`.toLocaleLowerCase('cs').includes(search)) && (!category || (item.categories || []).includes(category));
    }
    function renderVideos() {
        const list = $('#videoProjects'); list.innerHTML = '<div class="portfolio-list-head"><span>Projekt</span><span>Kategorie</span><span>Zdroj videa</span><span>Akce</span></div>';
        let visible = 0;
        state.videos.forEach((item, index) => {
            if (!videoMatches(item)) return; visible++;
            const row = document.createElement('article'); row.className = 'portfolio-row'; row.draggable = true; row.dataset.index = String(index);
            const drag = document.createElement('button'); drag.type = 'button'; drag.className = 'drag-handle'; drag.textContent = '⋮⋮'; drag.title = 'Přetáhnout';
            const thumb = document.createElement('img'); thumb.className = 'portfolio-thumb'; thumb.src = videoThumb(item); thumb.alt = '';
            const project = document.createElement('div'); project.className = 'portfolio-project'; const title = document.createElement('strong'); title.textContent = item.title; const label = document.createElement('small'); label.textContent = item.label || 'Bez popisku'; project.append(title, label);
            const category = document.createElement('div'); category.className = 'portfolio-category'; category.textContent = (item.categories || []).map(key => videoCategories[key] || key).join(', ');
            const source = document.createElement('div'); source.className = 'portfolio-source'; source.textContent = item.video;
            const actions = document.createElement('div'); actions.className = 'portfolio-actions';
            const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Upravit'; edit.addEventListener('click', () => openVideoEditor(index));
            const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-video'; remove.textContent = 'Smazat'; remove.addEventListener('click', async () => { if (!confirm(`Opravdu odstranit projekt „${item.title}“?`)) return; const previous = [...state.videos]; state.videos.splice(index, 1); renderVideos(); try { await persistVideos('Projekt byl odstraněn.'); } catch (_) { state.videos = previous; renderVideos(); } });
            actions.append(edit, remove); row.append(drag, thumb, project, category, source, actions);
            row.addEventListener('dragstart', () => { state.draggedVideo = index; row.classList.add('is-dragging'); }); row.addEventListener('dragend', () => row.classList.remove('is-dragging')); row.addEventListener('dragover', event => event.preventDefault());
            row.addEventListener('drop', event => { event.preventDefault(); const from = state.draggedVideo; const to = Number(row.dataset.index); if (from < 0 || from === to) return; const [moved] = state.videos.splice(from, 1); state.videos.splice(to, 0, moved); state.videosDirty = true; $('#saveVideos').disabled = false; renderVideos(); });
            list.append(row);
        });
        if (!visible) list.innerHTML = '<div class="portfolio-empty">Žádný projekt neodpovídá filtru.</div>';
        $('#portfolioCount').textContent = `${state.videos.length} ${state.videos.length === 1 ? 'projekt' : state.videos.length < 5 ? 'projekty' : 'projektů'}`;
    }
    async function persistVideos(message = 'Portfolio bylo uloženo.') {
        try { const result = await api('api/videos.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: state.videos }) }); state.videos = result.items || state.videos; state.videosDirty = false; $('#saveVideos').disabled = true; renderVideos(); toast(message || result.message); }
        catch (error) { toast(error.message, true); throw error; }
    }
    async function loadVideos() {
        try {
            const data = await api('api/videos.php'); state.videos = data.items || [];
            const used = [...new Set(state.videos.flatMap(item => item.categories || []))]; $('#portfolioFilter').innerHTML = '<option value="">Všechny kategorie</option>' + used.map(key => `<option value="${key}">${videoCategories[key] || key}</option>`).join('');
            renderVideos();
        } catch (error) { $('#videoProjects').innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    function updateVideoPreview() {
        const preview = $('#videoLivePreview'); const video = $('#videoUrl').value.trim(); const imageValue = $('#videoImage').value.trim(); const id = youtubeId(video); const image = imageValue || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '');
        if (id && !imageValue) $('#videoImage').value = image;
        preview.innerHTML = '';
        if (/^\/assets\/uploads\/[^?#]+\.(?:mp4|webm)$/i.test(video)) { const player = document.createElement('video'); player.src = video; player.controls = true; player.muted = true; player.preload = 'metadata'; preview.append(player); return; }
        if (!image) { preview.innerHTML = '<span>Náhled se zobrazí po vložení odkazu.</span>'; return; }
        const img = document.createElement('img'); img.src = image; img.alt = ''; preview.append(img);
    }
    function openVideoEditor(index = -1) {
        const item = index >= 0 ? state.videos[index] : { title: '', label: '', categories: [], video: '', image: '', alt: '' };
        $('#videoEditIndex').value = String(index); $('#videoTitle').value = item.title || ''; $('#videoLabel').value = item.label || ''; $('#videoUrl').value = item.video || ''; $('#videoImage').value = item.image || ''; $('#videoAlt').value = item.alt || '';
        $$('#videoCategories input').forEach(input => { input.checked = (item.categories || []).includes(input.value); });
        $('#videoDrawerTitle').textContent = index >= 0 ? 'Upravit video' : 'Nové video'; $('#submitVideoEditor').textContent = index >= 0 ? 'Uložit změny' : 'Přidat do portfolia'; $('#videoMediaPicker').hidden = true; updateVideoPreview(); openDrawer($('#videoDrawer'));
    }
    $('#videoCategories').innerHTML = Object.entries(videoCategories).map(([key, label]) => `<label><input type="checkbox" value="${key}"> ${label}</label>`).join('');
    $('#portfolioSearch').addEventListener('input', renderVideos); $('#portfolioFilter').addEventListener('change', renderVideos); $('#saveVideos').addEventListener('click', () => persistVideos('Nové pořadí bylo uloženo.')); $('#addVideo').addEventListener('click', () => openVideoEditor());
    $('#videoUrl').addEventListener('input', updateVideoPreview); $('#videoImage').addEventListener('input', updateVideoPreview);
    $('#chooseVideoFile').addEventListener('click', () => openMediaPicker(url => { $('#videoUrl').value = url; updateVideoPreview(); }, 'video'));
    $('#uploadPortfolioVideo').addEventListener('change', async event => { if (!event.target.files[0]) return; const item = await uploadFile(event.target.files[0]); if (item) { $('#videoUrl').value = item.url; updateVideoPreview(); } event.target.value = ''; });
    $('#chooseVideoImage').addEventListener('click', () => openMediaPicker(url => { $('#videoImage').value = url; updateVideoPreview(); }));
    $('#uploadVideoImage').addEventListener('change', async event => { if (!event.target.files[0]) return; const item = await uploadFile(event.target.files[0]); if (item) { $('#videoImage').value = item.url; updateVideoPreview(); } event.target.value = ''; });
    $('#videoEditor').addEventListener('submit', async event => {
        event.preventDefault(); const categories = $$('#videoCategories input:checked').map(input => input.value); if (!categories.length) { toast('Vyberte alespoň jednu kategorii.', true); return; }
        const index = Number($('#videoEditIndex').value); const title = $('#videoTitle').value.trim(); const id = title.toLocaleLowerCase('cs').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
        const item = { id: index >= 0 ? state.videos[index].id : id, title, label: $('#videoLabel').value.trim(), categories, video: $('#videoUrl').value.trim(), image: $('#videoImage').value.trim(), alt: $('#videoAlt').value.trim() || title };
        const previous = [...state.videos]; if (index >= 0) state.videos[index] = item; else state.videos.unshift(item); renderVideos();
        try { await persistVideos(index >= 0 ? 'Projekt byl upraven.' : 'Projekt byl přidán.'); closeDrawers(); } catch (_) { state.videos = previous; renderVideos(); }
    });

    // Blog ------------------------------------------------------------------
    async function loadBlog() {
        try {
            const data = await api('api/blog.php'); state.blogPosts = data.posts || [];
            const categories = [...new Set(state.blogPosts.map(post => post.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
            $('#blogCategoryFilter').innerHTML = '<option value="">Všechny kategorie</option>' + categories.map(category => `<option>${category}</option>`).join(''); renderBlog();
        } catch (error) { $('#blogList').innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    function renderBlog() {
        const list = $('#blogList'); const search = $('#blogSearch').value.trim().toLocaleLowerCase('cs'); const category = $('#blogCategoryFilter').value;
        const posts = state.blogPosts.filter(post => (!search || `${post.title} ${post.excerpt}`.toLocaleLowerCase('cs').includes(search)) && (!category || post.category === category) && (!state.blogStatus || post.status === state.blogStatus));
        list.innerHTML = '';
        if (!posts.length) { list.innerHTML = '<div class="empty-state">Žádný článek neodpovídá výběru.</div>'; return; }
        posts.forEach(post => {
            const row = document.createElement('article'); row.className = 'blog-row';
            const identity = document.createElement('div'); identity.className = 'blog-identity'; const image = document.createElement('img'); image.src = post.image; image.alt = ''; const copy = document.createElement('div'); const title = document.createElement('strong'); title.textContent = post.title; const path = document.createElement('small'); path.textContent = post.path; copy.append(title, path); identity.append(image, copy);
            const category = document.createElement('div'); category.className = 'blog-category'; category.textContent = post.category;
            const date = document.createElement('div'); date.className = 'blog-date'; date.textContent = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' }).format(new Date(post.publishedAt + 'T12:00:00'));
            const status = document.createElement('div'); status.className = `blog-status ${post.status === 'published' ? 'is-published' : ''}`; status.textContent = post.status === 'published' ? 'Publikováno' : 'Koncept';
            const actions = document.createElement('div'); actions.className = 'blog-row-actions'; const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Upravit'; edit.addEventListener('click', () => openBlogEditor(post)); actions.append(edit);
            row.append(identity, category, date, status, actions); list.append(row);
        });
    }
    function slugify(value) { return value.toLocaleLowerCase('cs').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function updateBlogImagePreview() { const box = $('#blogImagePreview'); const value = $('#blogImage').value.trim(); box.innerHTML = ''; if (!value) { box.innerHTML = '<span>Vyberte titulní fotografii.</span>'; return; } const image = document.createElement('img'); image.src = value; image.alt = ''; box.append(image); }
    function openBlogEditor(post = null) {
        state.blogEditing = post; state.slugTouched = Boolean(post);
        $('#blogId').value = post?.id || ''; $('#blogTitle').value = post?.title || ''; $('#blogSlug').value = post?.slug || ''; $('#blogSlug').disabled = Boolean(post?.sourceFile); $('#blogPathHelp').textContent = post?.sourceFile ? `Původní SEO adresa zůstává zachovaná: ${post.path}` : 'Adresa vznikne automaticky z názvu a můžete ji upravit před publikováním.';
        $('#blogCategory').value = post?.category || 'Svatby'; if (![...$('#blogCategory').options].some(option => option.value === post?.category) && post?.category) { const option = new Option(post.category, post.category); $('#blogCategory').add(option); $('#blogCategory').value = post.category; }
        $('#blogPublishedAt').value = post?.publishedAt || new Date().toISOString().slice(0, 10); $('#blogExcerpt').value = post?.excerpt || ''; $('#blogSeoTitle').value = post?.seoTitle || ''; $('#blogMetaDescription').value = post?.metaDescription || ''; $('#blogImage').value = post?.image || ''; $('#blogImageAlt').value = post?.imageAlt || ''; $('#blogBody').innerHTML = post?.bodyHtml || '<p></p>'; $('#blogFeatured').checked = Boolean(post?.featured);
        $('#deleteBlogPost').hidden = !post; $('#blogDrawerTitle').textContent = post ? 'Upravit článek' : 'Nový článek'; updateBlogImagePreview(); openDrawer($('#blogDrawer'));
    }
    function blogPayload(status) { return { id: $('#blogId').value, title: $('#blogTitle').value.trim(), slug: $('#blogSlug').value.trim(), category: $('#blogCategory').value, publishedAt: $('#blogPublishedAt').value, excerpt: $('#blogExcerpt').value.trim(), seoTitle: $('#blogSeoTitle').value.trim(), metaDescription: $('#blogMetaDescription').value.trim(), image: $('#blogImage').value.trim(), imageAlt: $('#blogImageAlt').value.trim(), bodyHtml: $('#blogBody').innerHTML.trim(), featured: $('#blogFeatured').checked, status }; }
    async function saveBlog(status) {
        const post = blogPayload(status);
        if (!post.title || !post.slug || !post.excerpt || !post.image || !$('#blogBody').textContent.trim()) { toast('Vyplňte název, úvod, titulní fotografii a obsah článku.', true); return; }
        try { const result = await api('api/blog.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', post }) }); toast(result.message); closeDrawers(); await loadBlog(); }
        catch (error) { toast(error.message, true); }
    }
    $('#addBlogPost').addEventListener('click', () => openBlogEditor()); $('#blogSearch').addEventListener('input', renderBlog); $('#blogCategoryFilter').addEventListener('change', renderBlog);
    $$('#blogStatusTabs button').forEach(button => button.addEventListener('click', () => { state.blogStatus = button.dataset.status; $$('#blogStatusTabs button').forEach(item => item.classList.toggle('is-active', item === button)); renderBlog(); }));
    $('#blogTitle').addEventListener('input', event => { if (!state.slugTouched) $('#blogSlug').value = slugify(event.target.value); }); $('#blogSlug').addEventListener('input', () => { state.slugTouched = true; }); $('#blogImage').addEventListener('input', updateBlogImagePreview);
    $('#chooseBlogImage').addEventListener('click', () => openMediaPicker(url => { $('#blogImage').value = url; updateBlogImagePreview(); })); $('#uploadBlogImage').addEventListener('change', async event => { if (!event.target.files[0]) return; const item = await uploadFile(event.target.files[0]); if (item) { $('#blogImage').value = item.url; updateBlogImagePreview(); } event.target.value = ''; });
    $$('.rich-toolbar button').forEach(button => button.addEventListener('click', () => { $('#blogBody').focus(); if (button.dataset.block) document.execCommand('formatBlock', false, button.dataset.block); else if (button.dataset.format === 'createLink') { const url = prompt('Vložte adresu odkazu:'); if (url) document.execCommand('createLink', false, url); } else document.execCommand(button.dataset.format, false); }));
    $('#saveBlogDraft').addEventListener('click', () => saveBlog('draft')); $('#blogEditor').addEventListener('submit', event => { event.preventDefault(); saveBlog('published'); });
    $('#deleteBlogPost').addEventListener('click', async () => { const post = state.blogEditing; if (!post || !confirm(`Opravdu smazat článek „${post.title}“? Tuto akci lze vrátit pouze ze zálohy.`)) return; try { const result = await api('api/blog.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: post.id }) }); toast(result.message); closeDrawers(); await loadBlog(); } catch (error) { toast(error.message, true); } });

    // Drawers, history, password -------------------------------------------
    function openDrawer(drawer) { closeDrawers(false); $('#drawerBackdrop').hidden = false; drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('drawer-open'); }
    function closeDrawers(hideBackdrop = true) { $$('.side-drawer').forEach(drawer => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); }); if (hideBackdrop) $('#drawerBackdrop').hidden = true; document.body.classList.remove('drawer-open'); }
    $$('[data-close-drawer]').forEach(button => button.addEventListener('click', () => closeDrawers())); $('#drawerBackdrop').addEventListener('click', () => closeDrawers()); document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeDrawers(); $('#mediaPickerModal').hidden = true; } });
    async function loadHistory() {
        const list = $('#historyList'); list.innerHTML = '<div class="loading">Načítám zálohy…</div>';
        try { const data = await api('api/history.php'); list.innerHTML = data.items.length ? '' : '<div class="empty-state">Historie vznikne po prvním uložení.</div>'; data.items.forEach(item => { const row = document.createElement('div'); row.className = 'history-item'; row.innerHTML = `<div><strong>${new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(item.date))}</strong><small>Verze ${item.version ?? '—'} · ${item.updatedBy || 'systém'}</small></div><button>Obnovit</button>`; $('button', row).addEventListener('click', async () => { if (!confirm('Obnovit tuto verzi celého obsahu? Současný stav se předtím zazálohuje.')) return; try { const result = await api('api/history.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: item.file }) }); toast(result.message); state.api = await api('api/content.php'); loadHistory(); } catch (error) { toast(error.message, true); } }); list.append(row); }); }
        catch (error) { list.innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    $('#refreshHistory').addEventListener('click', loadHistory);
    $('#passwordForm').addEventListener('submit', async event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); try { const result = await api('api/password.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); toast(result.message); event.currentTarget.reset(); $('.notice.warning')?.remove(); } catch (error) { toast(error.message, true); } });

    async function init() {
        try {
            state.api = await api('api/content.php');
            const select = $('#pageSelect'); select.innerHTML = Object.entries(state.api.pages).map(([file, label]) => `<option value="${file}">${label}</option>`).join('');
            $('#assignPage').innerHTML = select.innerHTML;
            $('#pageCount').textContent = Object.keys(state.api.pages).length;
            $('#lastUpdate').textContent = state.api.content.updatedAt ? new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' }).format(new Date(state.api.content.updatedAt)) : 'Zatím bez změn';
            select.addEventListener('change', () => { if ([...state.current].some(([key, value]) => value !== state.saved.get(key)) && !confirm('Zahodit neuložené změny?')) { select.value = state.page; return; } loadPage(select.value); });
            await loadPage(select.value || 'index.html');
        } catch (error) { toast(error.message, true); $('#sectionNav').innerHTML = `<div class="empty-state">${error.message}</div>`; }
    }
    window.addEventListener('beforeunload', event => { const contentDirty = [...state.current].some(([key, value]) => value !== state.saved.get(key)); if (contentDirty || state.videosDirty) { event.preventDefault(); event.returnValue = ''; } });
    init();
})();
