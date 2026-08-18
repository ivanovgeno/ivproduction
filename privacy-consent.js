(() => {
    'use strict';

    const STORAGE_KEY = 'ivp_privacy_choice_v1';
    const CHOICE_ALL = 'external-content';
    const CHOICE_NECESSARY = 'necessary-only';
    let pendingAction = null;
    let memoryChoice = '';

    function readChoice() {
        try {
            const value = window.localStorage.getItem(STORAGE_KEY);
            return value === CHOICE_ALL || value === CHOICE_NECESSARY ? value : memoryChoice;
        } catch (_) {
            return memoryChoice;
        }
    }

    function saveChoice(value) {
        memoryChoice = value;
        try { window.localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* Storage can be unavailable. */ }
    }

    function hasExternalConsent() {
        return readChoice() === CHOICE_ALL;
    }

    function activateEmbeds() {
        document.querySelectorAll('iframe[data-consent-src]').forEach((frame) => {
            const source = frame.dataset.consentSrc;
            if (source && !frame.getAttribute('src')) frame.src = source;
            frame.hidden = false;
            frame.closest('[data-consent-embed]')?.classList.add('is-consented');
        });
    }

    function deactivateEmbeds() {
        document.querySelectorAll('iframe[data-consent-src]').forEach((frame) => {
            frame.removeAttribute('src');
            frame.hidden = true;
            frame.closest('[data-consent-embed]')?.classList.remove('is-consented');
        });
    }

    function ensureEmbedPlaceholders() {
        document.querySelectorAll('iframe[data-consent-src]').forEach((frame) => {
            const container = frame.parentElement;
            if (!container) return;
            container.dataset.consentEmbed = '';
            if (container.querySelector(':scope > .privacy-embed-placeholder')) return;

            const service = frame.dataset.consentService || 'externí službu';
            const placeholder = document.createElement('div');
            placeholder.className = 'privacy-embed-placeholder';
            placeholder.innerHTML = `
                <p><strong>Externí obsah je vypnutý</strong></p>
                <p>Načtením služby ${service} může dojít k předání technických údajů jejímu poskytovateli.</p>
                <button type="button" class="privacy-button privacy-button--primary">Povolit a načíst</button>`;
            placeholder.querySelector('button').addEventListener('click', () => {
                requestExternalConsent(() => frame.focus());
            });
            container.prepend(placeholder);
        });
    }

    function createControls() {
        if (document.querySelector('[data-privacy-banner]')) return;

        const banner = document.createElement('section');
        banner.className = 'privacy-banner';
        banner.dataset.privacyBanner = '';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'true');
        banner.setAttribute('aria-labelledby', 'privacy-banner-title');
        banner.innerHTML = `
            <div class="privacy-banner__copy">
                <h2 id="privacy-banner-title">Nastavení soukromí</h2>
                <p>Web používá pouze nezbytné úložiště pro vaši volbu. Google Maps, YouTube a Matterport se načtou jen s vaším souhlasem.</p>
                <a href="ochrana-osobnich-udaju.html">Podrobnosti o zpracování údajů</a>
            </div>
            <div class="privacy-banner__actions">
                <button type="button" class="privacy-button" data-privacy-necessary>Pouze nezbytné</button>
                <button type="button" class="privacy-button privacy-button--primary" data-privacy-allow>Povolit externí obsah</button>
            </div>`;

        const settings = document.createElement('button');
        settings.type = 'button';
        settings.className = 'privacy-settings';
        settings.dataset.privacySettings = '';
        settings.textContent = 'Soukromí';
        settings.setAttribute('aria-label', 'Změnit nastavení soukromí');

        function hideBanner() {
            banner.classList.remove('is-visible');
            banner.setAttribute('aria-hidden', 'true');
        }

        function showBanner(focus = false) {
            banner.classList.add('is-visible');
            banner.setAttribute('aria-hidden', 'false');
            if (focus) banner.querySelector('[data-privacy-allow]')?.focus();
        }

        banner.querySelector('[data-privacy-necessary]').addEventListener('click', () => {
            pendingAction = null;
            saveChoice(CHOICE_NECESSARY);
            deactivateEmbeds();
            hideBanner();
            window.dispatchEvent(new CustomEvent('ivp:privacy-change', { detail: { external: false } }));
        });

        banner.querySelector('[data-privacy-allow]').addEventListener('click', () => {
            saveChoice(CHOICE_ALL);
            activateEmbeds();
            hideBanner();
            const action = pendingAction;
            pendingAction = null;
            window.dispatchEvent(new CustomEvent('ivp:privacy-change', { detail: { external: true } }));
            if (typeof action === 'function') action();
        });

        settings.addEventListener('click', () => showBanner(true));
        document.body.append(banner, settings);

        window.IVPPrivacy = {
            hasExternalConsent,
            requestExternalConsent,
            showSettings: () => showBanner(true)
        };

        if (hasExternalConsent()) activateEmbeds();
        else {
            deactivateEmbeds();
            if (!readChoice()) showBanner();
        }

        function requestExternalConsent(action) {
            if (hasExternalConsent()) {
                if (typeof action === 'function') action();
                return true;
            }
            pendingAction = typeof action === 'function' ? action : null;
            showBanner(true);
            return false;
        }
    }

    function requestExternalConsent(action) {
        if (hasExternalConsent()) {
            if (typeof action === 'function') action();
            return true;
        }
        pendingAction = typeof action === 'function' ? action : null;
        document.querySelector('[data-privacy-banner]')?.classList.add('is-visible');
        document.querySelector('[data-privacy-banner]')?.setAttribute('aria-hidden', 'false');
        document.querySelector('[data-privacy-allow]')?.focus();
        return false;
    }

    document.addEventListener('DOMContentLoaded', () => {
        ensureEmbedPlaceholders();
        createControls();
    });
})();
