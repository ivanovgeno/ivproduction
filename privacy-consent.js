(() => {
    'use strict';

    // Nová verze vyžádá nový souhlas i od návštěvníků, kteří dříve povolili jen externí vložený obsah.
    const STORAGE_KEY = 'ivp_privacy_choice_v2';
    const CHOICE_ALL = 'external-content';
    const CHOICE_NECESSARY = 'necessary-only';
    let pendingAction = null;
    let memoryChoice = '';
    let integrationSettings = null;
    const loadedIntegrations = new Set();

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

    function loadScript(id, source) {
        if (loadedIntegrations.has(id)) return;
        loadedIntegrations.add(id);
        const script = document.createElement('script');
        script.id = `ivp-integration-${id}`;
        script.async = true;
        script.src = source;
        document.head.append(script);
    }

    function fireLeadConversions() {
        if (!integrationSettings?.leadTracking || new URLSearchParams(location.search).get('status') !== 'sent') return;
        const marker = `ivp_lead_${location.pathname}_${location.search}`;
        try { if (sessionStorage.getItem(marker)) return; sessionStorage.setItem(marker, '1'); } catch (_) {}
        const providers = integrationSettings.providers || {};
        if (providers.ga4?.enabled && typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
        if (providers.googleAds?.enabled && providers.googleAds.conversionLabel && typeof window.gtag === 'function') {
            window.gtag('event', 'conversion', { send_to: `${providers.googleAds.id}/${providers.googleAds.conversionLabel}` });
        }
        if (providers.metaPixel?.enabled && typeof window.fbq === 'function') window.fbq('track', 'Lead');
        if (providers.tiktokPixel?.enabled && window.ttq?.track) window.ttq.track('SubmitForm');
        if (providers.pinterestTag?.enabled && typeof window.pintrk === 'function') window.pintrk('track', 'lead');
    }

    function activateIntegrations() {
        if (!hasExternalConsent() || !integrationSettings) return;
        const providers = integrationSettings.providers || {};

        if (providers.gtm?.enabled && providers.gtm.id && !loadedIntegrations.has('gtm')) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
            loadScript('gtm', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(providers.gtm.id)}`);
        }

        const googleIds = [providers.ga4, providers.googleAds].filter(item => item?.enabled && item.id).map(item => item.id);
        if (googleIds.length && !loadedIntegrations.has('google')) {
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
            googleIds.forEach(id => window.gtag('config', id));
            loadScript('google', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleIds[0])}`);
        }

        if (providers.metaPixel?.enabled && providers.metaPixel.id && !loadedIntegrations.has('meta')) {
            const fbq = window.fbq = window.fbq || function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
            if (!fbq.queue) { fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = []; }
            window.fbq('consent', 'grant');
            window.fbq('init', providers.metaPixel.id);
            window.fbq('track', 'PageView');
            loadScript('meta', 'https://connect.facebook.net/en_US/fbevents.js');
        }

        if (providers.microsoftClarity?.enabled && providers.microsoftClarity.id && !loadedIntegrations.has('clarity')) {
            window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
            loadScript('clarity', `https://www.clarity.ms/tag/${encodeURIComponent(providers.microsoftClarity.id)}`);
        }

        if (providers.tiktokPixel?.enabled && providers.tiktokPixel.id && !loadedIntegrations.has('tiktok')) {
            const ttq = window.ttq = window.ttq || [];
            ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
            ttq.setAndDefer = (target, method) => { target[method] = function () { target.push([method].concat([].slice.call(arguments))); }; };
            ttq.methods.forEach(method => ttq.setAndDefer(ttq, method));
            ttq.load = function (id) { ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js'; loadScript('tiktok', `${ttq._i[id]._u}?sdkid=${encodeURIComponent(id)}&lib=ttq`); };
            ttq.load(providers.tiktokPixel.id);
            ttq.page();
        }

        if (providers.linkedinInsight?.enabled && providers.linkedinInsight.id && !loadedIntegrations.has('linkedin')) {
            window._linkedin_partner_id = providers.linkedinInsight.id;
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(providers.linkedinInsight.id);
            loadScript('linkedin', 'https://snap.licdn.com/li.lms-analytics/insight.min.js');
        }

        if (providers.pinterestTag?.enabled && providers.pinterestTag.id && !loadedIntegrations.has('pinterest')) {
            const pintrk = window.pintrk = window.pintrk || function () { pintrk.queue.push(Array.prototype.slice.call(arguments)); };
            pintrk.queue = pintrk.queue || []; pintrk.version = '3.0';
            window.pintrk('load', providers.pinterestTag.id);
            window.pintrk('page');
            loadScript('pinterest', 'https://s.pinimg.com/ct/core.js');
        }

        if (providers.sklikRetargeting?.enabled && providers.sklikRetargeting.id && !loadedIntegrations.has('sklik')) {
            window.seznam_retargeting_id = Number(providers.sklikRetargeting.id);
            loadScript('sklik', 'https://c.seznam.cz/js/rc.js');
        }

        if (providers.hotjar?.enabled && providers.hotjar.id && !loadedIntegrations.has('hotjar')) {
            window.hj = window.hj || function () { (window.hj.q = window.hj.q || []).push(arguments); };
            window._hjSettings = { hjid: Number(providers.hotjar.id), hjsv: 6 };
            loadScript('hotjar', `https://static.hotjar.com/c/hotjar-${encodeURIComponent(providers.hotjar.id)}.js?sv=6`);
        }
        setTimeout(fireLeadConversions, 900);
    }

    function deactivateIntegrations() {
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        }
        if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
        if (typeof window.ttq?.disableCookie === 'function') window.ttq.disableCookie();
        if (loadedIntegrations.size) window.setTimeout(() => window.location.reload(), 80);
    }

    async function loadIntegrationSettings() {
        try {
            const response = await fetch('/api/integrations.php', { cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } });
            const data = response.ok ? await response.json() : null;
            if (!data?.ok) return;
            integrationSettings = data;
            activateIntegrations();
        } catch (_) { /* Web zůstane plně funkční i bez měření. */ }
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

    function ensurePrivacySettingsLinks() {
        document.querySelectorAll('.footer-legal').forEach((container) => {
            if (container.querySelector('[data-privacy-open]')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'privacy-settings-link';
            button.dataset.privacyOpen = '';
            button.textContent = 'Nastavení soukromí';
            container.append(button);
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
                <p>Web používá nezbytné úložiště pro vaši volbu. Analytika, reklamní měření, Google Maps, YouTube a Matterport se načtou jen s vaším souhlasem.</p>
                <a href="/ochrana-osobnich-udaju/">Podrobnosti o zpracování údajů</a>
            </div>
            <div class="privacy-banner__actions">
                <button type="button" class="privacy-button" data-privacy-necessary>Pouze nezbytné</button>
                <button type="button" class="privacy-button privacy-button--primary" data-privacy-allow>Povolit vše</button>
            </div>`;

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
            deactivateIntegrations();
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
            activateIntegrations();
            if (typeof action === 'function') action();
        });

        document.body.append(banner);

        window.IVPPrivacy = {
            hasExternalConsent,
            requestExternalConsent,
            showSettings: () => showBanner(true)
        };

        if (hasExternalConsent()) activateEmbeds();
        else deactivateEmbeds();

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
        ensurePrivacySettingsLinks();
        createControls();
        loadIntegrationSettings();
        document.querySelectorAll('[data-privacy-open]').forEach((control) => {
            control.addEventListener('click', () => window.IVPPrivacy?.showSettings());
        });
    });
})();
