(() => {
    'use strict';

    const csrf = document.body.dataset.csrf;
    const root = document.querySelector('#weddingPartnerGalleries');
    const saveButton = document.querySelector('#saveWeddingPartnerGalleries');
    const saveState = document.querySelector('#weddingGallerySaveState');
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
        const name = decodeURIComponent(String(url).split('/').pop() || 'Nová fotografie')
            .replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
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

    function renderGallery(key, gallery) {
        const manager = document.createElement('section');
        manager.className = 'gallery-manager wedding-gallery-manager';
        manager.classList.toggle('is-disabled', !gallery.enabled);

        const header = document.createElement('header');
        const identity = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = gallery.name;
        const description = document.createElement('p');
        description.textContent = gallery.kind === 'photographer' ? gallery.credit : 'Samostatný slider partnerské služby Duhohrátky.';
        identity.append(title, description);

        const controls = document.createElement('div');
        controls.className = 'wedding-gallery-header-actions';
        const toggle = document.createElement('label');
        toggle.className = 'wedding-gallery-toggle';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(gallery.enabled);
        checkbox.setAttribute('role', 'switch');
        const toggleText = document.createElement('span');
        toggleText.textContent = gallery.enabled ? 'Zobrazeno na webu' : 'Skryto z webu';
        checkbox.addEventListener('change', () => {
            gallery.enabled = checkbox.checked;
            setDirty();
            render();
        });
        toggle.append(checkbox, toggleText);

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
                    const generatedName = nameFromUrl(item.url);
                    gallery.images.push({ id: `${key}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, image: item.url, title: generatedName, alt: `${generatedName} – ${gallery.name}` });
                    setDirty();
                }
                render();
                toast(files.length === 1 ? 'Fotografie byla nahrána.' : `Nahráno fotografií: ${files.length}.`);
            } catch (error) {
                toast(error.message, true);
                render();
            }
        });
        uploadLabel.append(uploadInput);
        controls.append(toggle, uploadLabel);
        header.append(identity, controls);

        const list = document.createElement('div');
        list.className = 'gallery-admin-list';
        if (!gallery.images.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'Zatím nejsou nahrané žádné fotografie. Slider zůstane na webu skrytý.';
            list.append(empty);
        }
        gallery.images.forEach((item, index) => {
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
            const up = actionButton('↑', 'Posunout fotografii výše', () => { [gallery.images[index - 1], gallery.images[index]] = [gallery.images[index], gallery.images[index - 1]]; setDirty(); render(); });
            up.disabled = index === 0;
            const down = actionButton('↓', 'Posunout fotografii níže', () => { [gallery.images[index], gallery.images[index + 1]] = [gallery.images[index + 1], gallery.images[index]]; setDirty(); render(); });
            down.disabled = index === gallery.images.length - 1;
            const remove = actionButton('Odstranit', `Odstranit fotografii ${item.title}`, () => {
                if (!confirm(`Odstranit fotografii „${item.title}“ ze slideru ${gallery.name}?`)) return;
                gallery.images.splice(index, 1);
                if (!gallery.images.length) gallery.enabled = false;
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

    function render() {
        if (!state.settings) return;
        root.replaceChildren(...Object.entries(state.settings.galleries).map(([key, gallery]) => renderGallery(key, gallery)));
    }

    async function load() {
        if (state.loaded) return;
        try {
            const result = await request('api/wedding-partner-galleries.php');
            state.settings = result.settings;
            state.loaded = true;
            setDirty(false);
            render();
        } catch (error) {
            root.innerHTML = `<div class="empty-state"></div>`;
            root.firstElementChild.textContent = error.message;
        }
    }

    function openView() {
        document.querySelector('#viewTitle').textContent = 'Svatební galerie partnerů';
        document.querySelector('#viewSubtitle').textContent = 'Samostatné slidery fotografů a Duhohrátek.';
        load();
    }

    document.querySelectorAll('[data-view="wedding-galleries"], [data-go="wedding-galleries"]').forEach(button => button.addEventListener('click', () => setTimeout(openView)));

    saveButton?.addEventListener('click', async () => {
        for (const gallery of Object.values(state.settings.galleries)) {
            if (gallery.enabled && !gallery.images.length) return toast(`Slider ${gallery.name} nelze zapnout bez fotografie.`, true);
            if (gallery.images.some(image => !String(image.title || '').trim())) return toast(`Doplňte popisky u slideru ${gallery.name}.`, true);
        }
        try {
            const result = await request('api/wedding-partner-galleries.php', {
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
