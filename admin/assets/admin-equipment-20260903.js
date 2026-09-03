(() => {
    'use strict';

    const csrf = document.body.dataset.csrf;
    const categoryLabels = {
        cameras: 'Kamery',
        lenses: 'Objektivy',
        stabilization: 'Drony & stabilizace',
        audioLights: 'Zvuk & světla'
    };
    const state = { categories: null, loaded: false, dirty: false, media: [], pickerTarget: null };
    const $ = (selector, root = document) => root.querySelector(selector);

    function toast(message, error = false) {
        const element = $('#toast');
        if (!element) return;
        element.textContent = message;
        element.classList.toggle('is-error', error);
        element.classList.add('is-visible');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => element.classList.remove('is-visible'), 3600);
    }

    async function request(url, options = {}) {
        options.headers = { Accept: 'application/json', ...(options.headers || {}), 'X-CSRF-Token': csrf };
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({ ok: false, error: `Server vrátil chybnou odpověď (HTTP ${response.status}).` }));
        if (response.status === 401) location.href = 'login.php';
        if (!response.ok || !data.ok) throw new Error(data.error || 'Operace se nepodařila.');
        return data;
    }

    function makeId(name = 'nova-technika') {
        const slug = name.toLocaleLowerCase('cs').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'nova-technika';
        return `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    }

    function setDirty(value = true) {
        state.dirty = value;
        const button = $('#saveEquipment');
        const label = $('#equipmentSaveState');
        if (button) button.disabled = !value;
        if (label) label.textContent = value ? 'Máte neuložené změny' : 'Vše uloženo';
    }

    function updateItem(category, index, property, value) {
        state.categories[category][index][property] = value;
        if (property === 'name' && !state.categories[category][index].alt) state.categories[category][index].alt = value;
        setDirty();
    }

    function renderPreview(container, item) {
        container.replaceChildren();
        if (item.image) {
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.alt || item.name || '';
            container.append(image);
        } else {
            const empty = document.createElement('span');
            empty.textContent = 'Bez fotografie';
            container.append(empty);
        }
    }

    function inputField(labelText, value, type, onInput) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const control = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        control.value = value || '';
        if (type === 'textarea') control.rows = 3;
        control.addEventListener('input', () => onInput(control.value));
        label.append(control);
        return label;
    }

    function renderItem(category, item, index) {
        const card = document.createElement('article');
        card.className = 'equipment-admin-item';

        const preview = document.createElement('div');
        preview.className = 'equipment-admin-preview';
        renderPreview(preview, item);

        const fields = document.createElement('div');
        fields.className = 'equipment-admin-fields';
        fields.append(
            inputField('Název techniky', item.name, 'input', value => updateItem(category, index, 'name', value)),
            inputField('Popis', item.description, 'textarea', value => updateItem(category, index, 'description', value))
        );

        const imageLabel = inputField('Fotografie', item.image, 'input', value => {
            updateItem(category, index, 'image', value.trim());
            renderPreview(preview, item);
        });
        imageLabel.classList.add('equipment-image-url');
        fields.append(imageLabel);

        const actions = document.createElement('div');
        actions.className = 'equipment-admin-actions';
        const choose = document.createElement('button');
        choose.type = 'button';
        choose.className = 'button ghost';
        choose.textContent = 'Vybrat z médií';
        choose.addEventListener('click', () => openPicker(category, index));

        const uploadLabel = document.createElement('label');
        uploadLabel.className = 'button ghost upload-button';
        uploadLabel.textContent = 'Nahrát novou';
        const upload = document.createElement('input');
        upload.type = 'file';
        upload.accept = 'image/jpeg,image/png,image/webp,image/gif';
        upload.addEventListener('change', async () => {
            const file = upload.files?.[0];
            if (!file) return;
            uploadLabel.classList.add('is-loading');
            try {
                const form = new FormData();
                form.append('file', file);
                const result = await request('api/media.php', { method: 'POST', body: form });
                item.image = result.item.url;
                item.alt = item.alt || item.name;
                setDirty();
                render();
                toast(result.message);
            } catch (error) { toast(error.message, true); }
            finally { uploadLabel.classList.remove('is-loading'); upload.value = ''; }
        });
        uploadLabel.append(upload);

        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'button ghost';
        clear.textContent = 'Odebrat fotku';
        clear.disabled = !item.image;
        clear.addEventListener('click', () => { item.image = ''; setDirty(); render(); });

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'button equipment-remove';
        remove.textContent = 'Smazat techniku';
        remove.addEventListener('click', () => {
            if (!confirm(`Opravdu chcete odstranit „${item.name || 'novou techniku'}“? Změna se projeví až po uložení.`)) return;
            state.categories[category].splice(index, 1);
            setDirty();
            render();
        });
        actions.append(choose, uploadLabel, clear, remove);
        card.append(preview, fields, actions);
        return card;
    }

    function render() {
        const root = $('#equipmentAdmin');
        if (!root || !state.categories) return;
        root.replaceChildren();
        Object.entries(categoryLabels).forEach(([category, label]) => {
            const section = document.createElement('section');
            section.className = 'equipment-category-admin';
            const header = document.createElement('header');
            const heading = document.createElement('div');
            const title = document.createElement('h3');
            title.textContent = label;
            const count = document.createElement('span');
            const items = state.categories[category] || [];
            count.textContent = `${items.length} ${items.length === 1 ? 'položka' : items.length < 5 ? 'položky' : 'položek'}`;
            heading.append(title, count);
            const add = document.createElement('button');
            add.type = 'button';
            add.className = 'button ghost';
            add.textContent = '＋ Přidat techniku';
            add.addEventListener('click', () => {
                items.push({ id: makeId(), name: '', description: '', image: '', alt: '' });
                setDirty();
                render();
                const renderedCategory = [...document.querySelectorAll('.equipment-category-admin')][Object.keys(categoryLabels).indexOf(category)];
                renderedCategory?.querySelector('.equipment-admin-item:last-child input')?.focus();
            });
            header.append(heading, add);
            const list = document.createElement('div');
            list.className = 'equipment-admin-list';
            if (items.length) items.forEach((item, index) => list.append(renderItem(category, item, index)));
            else list.innerHTML = '<div class="equipment-empty">V této kategorii zatím není žádná technika.</div>';
            section.append(header, list);
            root.append(section);
        });
    }

    async function load() {
        if (state.loaded) return;
        const root = $('#equipmentAdmin');
        try {
            const result = await request('api/equipment.php');
            state.categories = result.equipment.categories;
            state.loaded = true;
            render();
        } catch (error) {
            if (root) root.innerHTML = `<div class="empty-state">${error.message}</div>`;
        }
    }

    function showEquipmentHeading() {
        $('#viewTitle').textContent = 'Technika';
        $('#viewSubtitle').textContent = 'Přidávání, úpravy a mazání techniky na homepage.';
        load();
    }

    document.querySelectorAll('[data-view="equipment"],[data-go="equipment"]').forEach(button => {
        button.addEventListener('click', () => setTimeout(showEquipmentHeading));
    });

    $('#saveEquipment')?.addEventListener('click', async () => {
        const missingName = Object.values(state.categories || {}).flat().some(item => !item.name.trim());
        if (missingName) { toast('Doplňte název u všech položek techniky.', true); return; }
        try {
            const result = await request('api/equipment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: state.categories })
            });
            state.categories = result.equipment.categories;
            setDirty(false);
            render();
            toast(result.message);
        } catch (error) { toast(error.message, true); }
    });

    async function openPicker(category, index) {
        state.pickerTarget = { category, index };
        try {
            const result = await request('api/media.php');
            state.media = result.items.filter(item => item.type === 'image');
            renderPicker();
        } catch (error) { toast(error.message, true); }
    }

    function renderPicker(query = '') {
        let modal = $('#equipmentMediaPicker');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'equipmentMediaPicker';
            modal.className = 'equipment-picker-backdrop';
            modal.innerHTML = '<div class="equipment-picker" role="dialog" aria-modal="true" aria-labelledby="equipmentPickerTitle"><header><div><h2 id="equipmentPickerTitle">Vybrat fotografii techniky</h2><p>Klikněte na obrázek, který chcete použít.</p></div><button type="button" aria-label="Zavřít">×</button></header><label class="equipment-picker-search">Hledat obrázek<input type="search" placeholder="Název souboru…"></label><div class="equipment-picker-grid"></div></div>';
            modal.querySelector('header button').addEventListener('click', closePicker);
            modal.addEventListener('click', event => { if (event.target === modal) closePicker(); });
            modal.querySelector('input').addEventListener('input', event => renderPicker(event.target.value));
            document.body.append(modal);
        }
        modal.hidden = false;
        const normalized = query.trim().toLocaleLowerCase('cs');
        const items = state.media.filter(item => !normalized || item.name.toLocaleLowerCase('cs').includes(normalized));
        const grid = modal.querySelector('.equipment-picker-grid');
        grid.replaceChildren();
        items.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            const image = document.createElement('img');
            image.src = item.url;
            image.alt = item.name;
            const name = document.createElement('span');
            name.textContent = item.name;
            button.append(image, name);
            button.addEventListener('click', () => {
                const target = state.pickerTarget;
                if (!target) return;
                const equipment = state.categories[target.category][target.index];
                equipment.image = item.url;
                equipment.alt = equipment.alt || equipment.name;
                setDirty();
                closePicker();
                render();
            });
            grid.append(button);
        });
        if (!items.length) grid.innerHTML = '<div class="equipment-empty">Žádný obrázek neodpovídá hledání.</div>';
    }

    function closePicker() {
        const modal = $('#equipmentMediaPicker');
        if (modal) modal.hidden = true;
        state.pickerTarget = null;
    }

    document.addEventListener('keydown', event => { if (event.key === 'Escape') closePicker(); });
    window.addEventListener('beforeunload', event => {
        if (!state.dirty) return;
        event.preventDefault();
        event.returnValue = '';
    });
})();
