(() => {
    'use strict';

    const csrf = document.body.dataset.csrf;
    const state = { services: null, defaults: null, loaded: false, dirty: false };
    const $ = selector => document.querySelector(selector);

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

    function setDirty(value = true) {
        state.dirty = value;
        $('#saveRibbons').disabled = !value;
        $('#ribbonSaveState').textContent = value ? 'Máte neuložené změny' : 'Vše uloženo';
    }

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function change(service, property, amount) {
        const item = state.services[service];
        if (property === 'scale') item.scale = Math.round(clamp(Number(item.scale) + amount, 0.5, 2) * 100) / 100;
        else item[property] = clamp(Math.round(Number(item[property]) + amount), -60, 60);
        setDirty();
        render();
    }

    function setValue(service, property, value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return render();
        if (property === 'scale') state.services[service].scale = Math.round(clamp(number / 100, 0.5, 2) * 100) / 100;
        else state.services[service][property] = clamp(Math.round(number), -60, 60);
        setDirty();
        render();
    }

    function controlButton(label, title, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.addEventListener('click', onClick);
        return button;
    }

    function numberField(labelText, value, suffix, onChange) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const wrap = document.createElement('span');
        wrap.className = 'ribbon-number-field';
        const input = document.createElement('input');
        input.type = 'number';
        input.value = String(value);
        input.addEventListener('change', () => onChange(input.value));
        const unit = document.createElement('span');
        unit.textContent = suffix;
        wrap.append(input, unit);
        label.append(wrap);
        return label;
    }

    function renderCard(service, item) {
        const card = document.createElement('article');
        card.className = 'ribbon-admin-card';
        const header = document.createElement('header');
        const heading = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = item.label;
        const subtitle = document.createElement('p');
        subtitle.textContent = `Text šerpy: ${item.ribbonLabel}`;
        heading.append(title, subtitle);
        const reset = controlButton('Vrátit výchozí', `Vrátit výchozí nastavení pro ${item.label}`, () => {
            state.services[service] = { ...state.defaults[service] };
            setDirty();
            render();
        });
        reset.className = 'button ghost';
        header.append(heading, reset);

        const body = document.createElement('div');
        body.className = 'ribbon-admin-body';
        const preview = document.createElement('div');
        preview.className = `ribbon-demo ${service === 'plesy' ? 'is-horizontal' : 'is-diagonal'}`;
        const band = document.createElement('div');
        band.className = 'ribbon-demo-band';
        const text = document.createElement('span');
        text.textContent = item.ribbonLabel;
        text.style.transform = `translate(${item.x}px, ${item.y}px) scale(${item.scale})`;
        band.append(text);
        preview.append(band);

        const controls = document.createElement('div');
        controls.className = 'ribbon-controls';
        const move = document.createElement('div');
        move.className = 'ribbon-direction-pad';
        move.append(
            controlButton('↑', `Posunout text ${item.label} o 1 px nahoru`, () => change(service, 'y', -1)),
            controlButton('←', `Posunout text ${item.label} o 1 px doleva`, () => change(service, 'x', -1)),
            controlButton('•', `Vycentrovat text ${item.label}`, () => { item.x = 0; item.y = 0; setDirty(); render(); }),
            controlButton('→', `Posunout text ${item.label} o 1 px doprava`, () => change(service, 'x', 1)),
            controlButton('↓', `Posunout text ${item.label} o 1 px dolů`, () => change(service, 'y', 1))
        );
        const size = document.createElement('div');
        size.className = 'ribbon-size-controls';
        const sizeLabel = document.createElement('strong');
        sizeLabel.textContent = 'Velikost textu';
        const sizeButtons = document.createElement('div');
        sizeButtons.append(
            controlButton('−', `Zmenšit text ${item.label}`, () => change(service, 'scale', -0.05)),
            Object.assign(document.createElement('output'), { textContent: `${Math.round(item.scale * 100)} %` }),
            controlButton('+', `Zvětšit text ${item.label}`, () => change(service, 'scale', 0.05))
        );
        size.append(sizeLabel, sizeButtons);
        const precise = document.createElement('div');
        precise.className = 'ribbon-precise-fields';
        precise.append(
            numberField('Vodorovně', item.x, 'px', value => setValue(service, 'x', value)),
            numberField('Svisle', item.y, 'px', value => setValue(service, 'y', value)),
            numberField('Velikost', Math.round(item.scale * 100), '%', value => setValue(service, 'scale', value))
        );
        controls.append(move, size, precise);
        body.append(preview, controls);
        card.append(header, body);
        return card;
    }

    function render() {
        const root = $('#ribbonAdmin');
        if (!root || !state.services) return;
        root.replaceChildren(...Object.entries(state.services).map(([service, item]) => renderCard(service, item)));
    }

    async function load() {
        if (state.loaded) return;
        try {
            const result = await request('api/package-ribbons.php');
            state.services = result.settings.services;
            state.defaults = result.defaults.services;
            state.loaded = true;
            render();
        } catch (error) {
            $('#ribbonAdmin').innerHTML = `<div class="empty-state">${error.message}</div>`;
        }
    }

    function openView() {
        $('#viewTitle').textContent = 'Šerpy balíčků';
        $('#viewSubtitle').textContent = 'Poloha a velikost textu každé šerpy.';
        load();
    }
    document.querySelectorAll('[data-view="ribbons"],[data-go="ribbons"]').forEach(button => button.addEventListener('click', () => setTimeout(openView)));

    $('#saveRibbons')?.addEventListener('click', async () => {
        try {
            const result = await request('api/package-ribbons.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ services: state.services })
            });
            state.services = result.settings.services;
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
