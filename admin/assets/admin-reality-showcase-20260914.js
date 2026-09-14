(() => {
    'use strict';

    const csrf = document.body.dataset.csrf;
    const root = document.querySelector('#realityShowcaseAdmin');
    const saveButton = document.querySelector('#saveRealityShowcase');
    const saveState = document.querySelector('#realityShowcaseSaveState');
    const state = { settings: null, loaded: false, dirty: false };

    function toast(message, error = false) {
        const element = document.querySelector('#toast');
        if (!element) return;
        element.textContent = message;
        element.classList.toggle('is-error', error);
        element.classList.add('is-visible');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => element.classList.remove('is-visible'), 3800);
    }

    async function request(url, options = {}) {
        options.headers = { Accept: 'application/json', ...(options.headers || {}), 'X-CSRF-Token': csrf };
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({ ok: false, error: `Server vrátil neplatnou odpověď (HTTP ${response.status}).` }));
        if (response.status === 401) location.href = 'login.php';
        if (!response.ok || !data.ok) throw new Error(data.error || 'Operace se nepodařila.');
        return data;
    }

    function setDirty(value = true) {
        state.dirty = value;
        saveButton.disabled = !value;
        saveState.textContent = value ? 'Neuložené změny' : 'Vše uloženo';
        const global = document.querySelector('#saveState');
        if (global) {
            global.textContent = value ? 'Neuložené změny' : 'Vše uloženo';
            global.classList.toggle('is-dirty', value);
        }
    }

    function nameFromUrl(url) {
        const name = decodeURIComponent(String(url).split('/').pop() || 'Nová fotografie').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        return name.charAt(0).toLocaleUpperCase('cs') + name.slice(1);
    }

    async function upload(file) {
        const form = new FormData();
        form.append('file', file);
        const result = await request('api/media.php', { method: 'POST', body: form });
        return result.item;
    }

    function actionButton(label, title, handler, className = '') {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.className = className;
        button.addEventListener('click', handler);
        return button;
    }

    function toggleControl(checked, labelOn, labelOff, onChange) {
        const toggle = document.createElement('label');
        toggle.className = 'reality-showcase-toggle';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(checked);
        input.setAttribute('role', 'switch');
        const text = document.createElement('span');
        text.textContent = input.checked ? labelOn : labelOff;
        input.addEventListener('change', () => onChange(input.checked));
        toggle.append(input, text);
        return toggle;
    }

    function renderPhotos() {
        const photos = state.settings.photos;
        const manager = document.createElement('section');
        manager.className = 'gallery-manager reality-showcase-manager';
        manager.classList.toggle('is-disabled', !photos.enabled);
        const header = document.createElement('header');
        const identity = document.createElement('div');
        identity.innerHTML = '<h3>Slider realitních fotografií</h3><p>Fotografie lze řadit, popisovat, přidávat i mazat.</p>';
        const controls = document.createElement('div');
        controls.className = 'reality-showcase-header-actions';
        controls.append(toggleControl(photos.enabled, 'Zobrazeno na webu', 'Skryto z webu', checked => {
            photos.enabled = checked;
            setDirty();
            render();
        }));
        const uploadLabel = document.createElement('label');
        uploadLabel.className = 'button primary upload-button';
        uploadLabel.textContent = 'Nahrát fotografie';
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = 'image/jpeg,image/png,image/webp,image/gif';
        uploadInput.multiple = true;
        uploadInput.addEventListener('change', async () => {
            const files = [...uploadInput.files];
            if (!files.length) return;
            uploadLabel.classList.add('is-uploading');
            uploadLabel.firstChild.textContent = 'Nahrávám…';
            try {
                for (const file of files) {
                    const item = await upload(file);
                    const title = nameFromUrl(item.url);
                    photos.images.push({ id: `reality-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, image: item.url, full: item.url, title, alt: `${title} – profesionální realitní fotografie` });
                }
                setDirty();
                render();
                toast(`Nahráno fotografií: ${files.length}.`);
            } catch (error) {
                toast(error.message, true);
                render();
            }
        });
        uploadLabel.append(uploadInput);
        controls.append(uploadLabel);
        header.append(identity, controls);

        const list = document.createElement('div');
        list.className = 'gallery-admin-list';
        if (!photos.images.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'Zatím nejsou nahrané žádné fotografie. Slider zůstane skrytý.';
            list.append(empty);
        }
        photos.images.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'gallery-admin-card';
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = '';
            const fields = document.createElement('div');
            fields.className = 'gallery-admin-fields';
            const titleLabel = document.createElement('label');
            titleLabel.textContent = 'Popisek fotografie';
            const titleInput = document.createElement('input');
            titleInput.value = item.title || '';
            titleInput.maxLength = 180;
            titleInput.addEventListener('input', () => { item.title = titleInput.value; setDirty(); });
            titleLabel.append(titleInput);
            const altLabel = document.createElement('label');
            altLabel.textContent = 'Popis pro Google a čtečky';
            const altInput = document.createElement('input');
            altInput.value = item.alt || '';
            altInput.maxLength = 320;
            altInput.addEventListener('input', () => { item.alt = altInput.value; setDirty(); });
            altLabel.append(altInput);
            fields.append(titleLabel, altLabel);
            const actions = document.createElement('div');
            actions.className = 'gallery-admin-actions';
            const up = actionButton('↑', 'Posunout fotografii výše', () => { [photos.images[index - 1], photos.images[index]] = [photos.images[index], photos.images[index - 1]]; setDirty(); render(); });
            up.disabled = index === 0;
            const down = actionButton('↓', 'Posunout fotografii níže', () => { [photos.images[index], photos.images[index + 1]] = [photos.images[index + 1], photos.images[index]]; setDirty(); render(); });
            down.disabled = index === photos.images.length - 1;
            const remove = actionButton('Odstranit', `Odstranit fotografii ${item.title}`, () => {
                if (!confirm(`Odstranit fotografii „${item.title}“ ze slideru Reality?`)) return;
                photos.images.splice(index, 1);
                if (!photos.images.length) photos.enabled = false;
                setDirty();
                render();
            }, 'gallery-remove');
            actions.append(up, down, remove);
            card.append(image, fields, actions);
            list.append(card);
        });
        manager.append(header, list);
        return manager;
    }

    function field(labelText, value, maxLength, handler, multiline = false) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const input = document.createElement(multiline ? 'textarea' : 'input');
        input.value = value || '';
        input.maxLength = maxLength;
        input.addEventListener('input', () => handler(input.value));
        label.append(input);
        return label;
    }

    function renderTours() {
        const manager = document.createElement('section');
        manager.className = 'gallery-manager reality-showcase-manager';
        const header = document.createElement('header');
        const identity = document.createElement('div');
        identity.innerHTML = '<h3>Matterport 3D prohlídky</h3><p>Vložte odkaz z Matterportu a upravte text u každé prezentace.</p>';
        const add = actionButton('＋ Přidat Matterport', 'Přidat další Matterport prohlídku', () => {
            state.settings.tours.push({
                id: `matterport-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                enabled: false,
                url: '',
                eyebrow: 'MATTERPORT 3D',
                title: 'Nová 3D prohlídka',
                description: 'Doplňte krátký popis této nemovitosti nebo prohlídky.'
            });
            setDirty();
            render();
        }, 'button primary');
        header.append(identity, add);

        const list = document.createElement('div');
        list.className = 'reality-tour-admin-list';
        if (!state.settings.tours.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'Zatím není přidaná žádná Matterport prohlídka.';
            list.append(empty);
        }
        state.settings.tours.forEach((tour, index) => {
            const card = document.createElement('article');
            card.className = 'reality-tour-admin-card';
            const cardHead = document.createElement('div');
            cardHead.className = 'reality-tour-card-head';
            const name = document.createElement('strong');
            name.textContent = tour.title || `Matterport ${index + 1}`;
            cardHead.append(name, toggleControl(tour.enabled, 'Zobrazeno na webu', 'Skryto z webu', checked => { tour.enabled = checked; setDirty(); render(); }));
            const fields = document.createElement('div');
            fields.className = 'reality-tour-fields';
            const urlField = field('Matterport odkaz', tour.url, 700, value => { tour.url = value.trim(); setDirty(); });
            urlField.querySelector('input').placeholder = 'https://my.matterport.com/show/?m=…';
            fields.append(
                urlField,
                field('Malý nadpis', tour.eyebrow, 80, value => { tour.eyebrow = value; setDirty(); }),
                field('Název prohlídky', tour.title, 180, value => { tour.title = value; name.textContent = value || `Matterport ${index + 1}`; setDirty(); }),
                field('Popis', tour.description, 600, value => { tour.description = value; setDirty(); }, true)
            );
            const actions = document.createElement('div');
            actions.className = 'reality-tour-actions';
            const up = actionButton('↑', 'Posunout prohlídku výše', () => { [state.settings.tours[index - 1], state.settings.tours[index]] = [state.settings.tours[index], state.settings.tours[index - 1]]; setDirty(); render(); });
            up.disabled = index === 0;
            const down = actionButton('↓', 'Posunout prohlídku níže', () => { [state.settings.tours[index], state.settings.tours[index + 1]] = [state.settings.tours[index + 1], state.settings.tours[index]]; setDirty(); render(); });
            down.disabled = index === state.settings.tours.length - 1;
            const remove = actionButton('Odstranit', `Odstranit Matterport ${tour.title}`, () => {
                if (!confirm(`Odstranit Matterport prohlídku „${tour.title}“?`)) return;
                state.settings.tours.splice(index, 1);
                setDirty();
                render();
            }, 'gallery-remove');
            actions.append(up, down, remove);
            card.append(cardHead, fields, actions);
            list.append(card);
        });
        manager.append(header, list);
        return manager;
    }

    function render() {
        if (!state.settings) return;
        root.replaceChildren(renderPhotos(), renderTours());
    }

    async function load() {
        if (state.loaded) return;
        try {
            const result = await request('api/reality-showcase.php');
            state.settings = result.settings;
            state.loaded = true;
            setDirty(false);
            render();
        } catch (error) {
            root.innerHTML = '<div class="empty-state"></div>';
            root.firstElementChild.textContent = error.message;
        }
    }

    function validMatterportUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' && url.hostname === 'my.matterport.com' && url.pathname.replace(/\/$/, '') === '/show' && /^[A-Za-z0-9_-]{5,80}$/.test(url.searchParams.get('m') || '');
        } catch (_) { return false; }
    }

    function openView() {
        document.querySelector('#viewTitle').textContent = 'Reality – galerie a Matterport';
        document.querySelector('#viewSubtitle').textContent = 'Fotografie do slideru a interaktivní 3D prohlídky.';
        load();
    }

    document.querySelectorAll('[data-view="reality-showcase"], [data-go="reality-showcase"]').forEach(button => button.addEventListener('click', () => setTimeout(openView)));
    saveButton?.addEventListener('click', async () => {
        if (state.settings.photos.enabled && !state.settings.photos.images.length) return toast('Zapnutý slider musí obsahovat alespoň jednu fotografii.', true);
        if (state.settings.photos.images.some(image => !String(image.title || '').trim())) return toast('Doplňte popisky všech fotografií.', true);
        const invalidTour = state.settings.tours.find(tour => !String(tour.title || '').trim() || !String(tour.description || '').trim() || !validMatterportUrl(tour.url));
        if (invalidTour) return toast('U každého Matterportu doplňte platný odkaz, název a popis.', true);
        try {
            const result = await request('api/reality-showcase.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.settings)
            });
            state.settings = result.settings;
            setDirty(false);
            render();
            toast(result.message);
        } catch (error) { toast(error.message, true); }
    });

    window.addEventListener('beforeunload', event => {
        if (!state.dirty) return;
        event.preventDefault();
        event.returnValue = '';
    });
})();
