(() => {
    'use strict';

    const csrf = document.body.dataset.csrf;
    const root = document.querySelector('#integrationsAdmin');
    const saveButton = document.querySelector('#saveIntegrations');
    const saveState = document.querySelector('#integrationsSaveState');
    const descriptions = {
        gtm: 'Centrální správce všech dalších měřicích a marketingových kódů.',
        ga4: 'Návštěvnost, zdroje návštěv a chování uživatelů na webu.',
        googleAds: 'Remarketing návštěvníků a měření poptávek z reklam Google Ads.',
        metaPixel: 'Měření a retargeting reklam na Facebooku a Instagramu.',
        microsoftClarity: 'Anonymizované heatmapy, klikání a průchod návštěvníků webem.',
        tiktokPixel: 'Měření kampaní a retargeting návštěvníků na TikToku.',
        linkedinInsight: 'Měření LinkedIn kampaní a vytvoření remarketingových publik.',
        pinterestTag: 'Měření kampaní a retargeting na Pinterestu.',
        sklikRetargeting: 'Retargeting návštěvníků v reklamní síti Sklik.',
        hotjar: 'Heatmapy a záznamy práce návštěvníků s webem.'
    };
    let settings = null;
    let definitions = null;
    let dirty = false;

    function toast(message, error = false) {
        const element = document.querySelector('#toast');
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
        dirty = value;
        saveButton.disabled = !value;
        saveState.textContent = value ? 'Máte neuložené změny' : 'Vše uloženo';
    }

    function integrationCard(key, provider) {
        const definition = definitions[key];
        const card = document.createElement('article');
        card.className = 'integration-card';
        card.classList.toggle('is-enabled', provider.enabled);

        const header = document.createElement('header');
        const copy = document.createElement('div');
        copy.innerHTML = `<h3>${definition.label}</h3><p>${descriptions[key] || ''}</p>`;
        const toggle = document.createElement('label');
        toggle.className = 'integration-toggle';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = provider.enabled;
        const switcher = document.createElement('span');
        const toggleText = document.createElement('strong');
        toggleText.textContent = provider.enabled ? 'Zapnuto' : 'Vypnuto';
        toggle.append(checkbox, switcher, toggleText);
        header.append(copy, toggle);

        const fields = document.createElement('div');
        fields.className = 'integration-fields';
        const idLabel = document.createElement('label');
        idLabel.textContent = key === 'sklikRetargeting' ? 'Retargeting ID' : 'ID služby';
        const idInput = document.createElement('input');
        idInput.value = provider.id || '';
        idInput.placeholder = definition.placeholder || '';
        idInput.autocomplete = 'off';
        idInput.spellcheck = false;
        idLabel.append(idInput);
        fields.append(idLabel);

        if (key === 'googleAds') {
            const conversionLabel = document.createElement('label');
            conversionLabel.textContent = 'Štítek konverze poptávky (nepovinné)';
            const conversionInput = document.createElement('input');
            conversionInput.value = provider.conversionLabel || '';
            conversionInput.placeholder = 'Např. AbCdEFghijkLMN';
            conversionInput.autocomplete = 'off';
            conversionInput.addEventListener('input', () => { provider.conversionLabel = conversionInput.value.trim(); setDirty(); });
            conversionLabel.append(conversionInput);
            fields.append(conversionLabel);
        }

        checkbox.addEventListener('change', () => {
            provider.enabled = checkbox.checked;
            toggleText.textContent = provider.enabled ? 'Zapnuto' : 'Vypnuto';
            card.classList.toggle('is-enabled', provider.enabled);
            setDirty();
        });
        idInput.addEventListener('input', () => { provider.id = idInput.value.trim(); setDirty(); });
        card.append(header, fields);
        return card;
    }

    function render() {
        if (!settings || !definitions) return;
        const guide = document.createElement('div');
        guide.className = 'integration-guide';
        guide.innerHTML = '<strong>Stačí vložit ID, ne celý kód</strong><p>Pokud budete později potřebovat službu, která zde není, připojte ji přes Google Tag Manager. Službu nastavenou v Tag Manageru už nezapínejte také samostatně, jinak by se návštěva mohla započítat dvakrát. Aktivní měření se návštěvníkům spustí až po jejich souhlasu.</p>';
        const conversion = document.createElement('label');
        conversion.className = 'integration-conversion';
        const conversionToggle = document.createElement('input');
        conversionToggle.type = 'checkbox';
        conversionToggle.checked = settings.leadTracking;
        const conversionCopy = document.createElement('span');
        conversionCopy.innerHTML = '<strong>Měřit odeslané poptávky jako konverze</strong><small>Při návratu na potvrzení o odeslání se aktivním systémům odešle událost Lead.</small>';
        conversion.append(conversionToggle, conversionCopy);
        conversionToggle.addEventListener('change', () => { settings.leadTracking = conversionToggle.checked; setDirty(); });
        const grid = document.createElement('div');
        grid.className = 'integration-grid';
        Object.entries(settings.providers).forEach(([key, provider]) => grid.append(integrationCard(key, provider)));
        root.replaceChildren(guide, conversion, grid);
    }

    async function load() {
        if (settings) return;
        try {
            const data = await request('api/integrations.php');
            settings = data.settings;
            definitions = data.definitions;
            render();
        } catch (error) {
            root.innerHTML = `<div class="empty-state">${error.message}</div>`;
        }
    }

    function openView() {
        document.querySelector('#viewTitle').textContent = 'Integrace a měření';
        document.querySelector('#viewSubtitle').textContent = 'Analytika, reklamní pixely, retargeting a konverze na jednom místě.';
        load();
    }

    document.querySelectorAll('[data-view="integrations"],[data-go="integrations"]').forEach(button => button.addEventListener('click', () => setTimeout(openView)));
    saveButton?.addEventListener('click', async () => {
        try {
            const data = await request('api/integrations.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            settings = data.settings;
            setDirty(false);
            render();
            toast(data.message);
        } catch (error) { toast(error.message, true); }
    });
    window.addEventListener('beforeunload', event => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = '';
    });
})();
