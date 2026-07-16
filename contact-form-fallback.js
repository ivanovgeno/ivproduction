document.addEventListener('DOMContentLoaded', async () => {
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

    const forms = document.querySelectorAll('form[action="kontakt-handler.php"]');
    if (!forms.length) return;

    const labels = {
        name: 'Jméno',
        email: 'E-mail',
        phone: 'Telefon',
        service: 'Služba',
        date: 'Termín',
        event_date: 'Termín',
        address: 'Místo konání',
        message: 'Zpráva'
    };

    forms.forEach((form) => {
        let status = form.querySelector('.form-static-status');
        if (!status) {
            status = document.createElement('p');
            status.className = 'form-static-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            form.append(status);
        }

        status.textContent = 'Na testovací verzi GitHub Pages se po odeslání otevře váš e-mailový program.';

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const data = new FormData(form);
            if (String(data.get('company') || '').trim()) return;

            const body = [];
            const used = new Set();
            Object.keys(labels).forEach((key) => {
                const value = String(data.get(key) || '').trim();
                if (!value || (key === 'event_date' && used.has('Termín'))) return;
                body.push(`${labels[key]}: ${value}`);
                used.add(labels[key]);
            });

            body.push('', 'Odesláno z testovací verze webu IV Production na GitHub Pages.');
            const subject = encodeURIComponent('Nezávazná poptávka z webu IV Production');
            const message = encodeURIComponent(body.join('\n'));

            status.classList.add('is-ready');
            status.textContent = 'Poptávka je připravená. Dokončete její odeslání ve svém e-mailovém programu.';
            window.location.href = `mailto:video@ivproduction.cz?subject=${subject}&body=${message}`;
        });
    });
});
