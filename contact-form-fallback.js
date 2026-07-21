document.addEventListener('DOMContentLoaded', async () => {
    const forms = document.querySelectorAll('form[action="kontakt-handler.php"]');
    if (!forms.length) return;

    document.querySelectorAll('[data-inquiry-package]').forEach((link) => {
        link.addEventListener('click', () => {
            const form = document.querySelector('#poptavka form');
            const packageSelect = form?.querySelector('select[name="package"]');
            const requestedPackage = link.dataset.inquiryPackage;
            if (!packageSelect || !requestedPackage) return;
            const matchingOption = Array.from(packageSelect.options).find((option) =>
                option.value.toLocaleLowerCase('cs') === requestedPackage.toLocaleLowerCase('cs')
            );
            if (matchingOption) packageSelect.value = matchingOption.value;
        });
    });

    const queryStatus = new URLSearchParams(window.location.search).get('status');
    const fallbackLabels = {
        name: 'Jméno a příjmení',
        email: 'E-mail',
        phone: 'Telefon',
        service: 'Služba',
        date: 'Termín',
        event_date: 'Termín',
        address: 'Místo konání',
        extras: 'Doplňkové služby',
        services: 'Požadované služby',
        channels: 'Kanály / formáty',
        outputs: 'Požadované výstupy',
        message: 'Doplňující informace'
    };
    const ignoredNames = new Set(['company', 'consent', 'return_to']);

    function getStatus(form) {
        let status = form.querySelector('.form-static-status, [data-form-status]')
            || form.parentElement?.querySelector('#formStatus');
        if (!status) {
            status = document.createElement('p');
            status.className = 'form-static-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            form.append(status);
        }
        return status;
    }

    if (queryStatus) {
        forms.forEach((form) => {
            const status = getStatus(form);
            status.classList.add('is-visible');
            if (queryStatus === 'sent') {
                status.classList.add('is-success');
                status.textContent = 'Děkujeme, poptávka byla odeslána. Ozveme se vám co nejdříve.';
            } else {
                status.classList.add('is-error');
                status.textContent = 'Poptávku se nepodařilo odeslat. Zkuste to prosím znovu nebo zavolejte na +420 773 210 194.';
            }
        });
    }

    let hasPhpHandler = false;
    try {
        const response = await fetch('kontakt-handler.php?health=1', {
            cache: 'no-store',
            headers: { Accept: 'application/json' }
        });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : null;
        hasPhpHandler = response.ok && payload?.ok === true && payload?.service === 'ivp-contact';
    } catch (_error) {
        hasPhpHandler = false;
    }
    if (hasPhpHandler) return;

    function fieldLabel(control) {
        const normalizedName = control.name.replace(/\[\]$/, '');
        if (control.dataset.label) return control.dataset.label;
        if (fallbackLabels[normalizedName]) return fallbackLabels[normalizedName];
        if (control.id) {
            const explicitLabel = control.form.querySelector(`label[for="${control.id}"]`);
            if (explicitLabel) return explicitLabel.textContent.replace(/\s*\*\s*$/, '').trim();
        }
        return control.name;
    }

    forms.forEach((form) => {
        const status = getStatus(form);
        if (!queryStatus) {
            status.classList.add('is-visible');
            status.textContent = 'Po odeslání se otevře váš e-mailový program s připravenou poptávkou.';
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const data = new FormData(form);
            if (String(data.get('company') || '').trim()) return;

            const body = [];
            const usedNames = new Set();
            Array.from(form.elements).forEach((control) => {
                const name = control.name;
                if (!name || usedNames.has(name) || ignoredNames.has(name)) return;
                usedNames.add(name);

                const values = data.getAll(name)
                    .map((value) => String(value).trim())
                    .filter(Boolean);
                if (!values.length) return;
                body.push(`${fieldLabel(control)}: ${values.join(', ')}`);
            });

            body.push('', 'Odesláno z webu IV Production na GitHub Pages.');
            const serviceTitle = form.dataset.serviceTitle || String(data.get('service') || '').trim();
            const subjectText = serviceTitle
                ? `Nezávazná poptávka – ${serviceTitle}`
                : 'Nezávazná poptávka z webu IV Production';
            const subject = encodeURIComponent(subjectText);
            const message = encodeURIComponent(body.join('\n'));

            status.classList.remove('is-error');
            status.classList.add('is-visible', 'is-ready');
            status.textContent = 'Poptávka je připravená. Dokončete její odeslání ve svém e-mailovém programu.';
            window.location.href = `mailto:video@ivproduction.cz?subject=${subject}&body=${message}`;
        });
    });
});
