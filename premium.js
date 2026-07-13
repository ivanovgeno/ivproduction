document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');

    if (!mobileToggle || !mobileOverlay) return;

    const mobileQuery = window.matchMedia('(max-width: 900px)');
    const overlayOrigin = document.createComment('mobile menu overlay origin');
    mobileOverlay.parentNode.insertBefore(overlayOrigin, mobileOverlay);
    let overlayIsPortaled = false;
    let lastFocusedElement = null;

    function positionOverlay() {
        if (mobileQuery.matches && !overlayIsPortaled) {
            document.body.append(mobileOverlay);
            overlayIsPortaled = true;
            return;
        }

        if (!mobileQuery.matches && overlayIsPortaled) {
            mobileOverlay.classList.remove('active');
            overlayOrigin.after(mobileOverlay);
            overlayIsPortaled = false;
        }
    }

    function setMenuState(isOpen, restoreFocus = false) {
        mobileOverlay.classList.toggle('active', isOpen);
        mobileToggle.classList.toggle('active', isOpen);
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
        mobileToggle.setAttribute('aria-label', isOpen ? 'Zavřít menu' : 'Otevřít menu');
        mobileOverlay.setAttribute('aria-hidden', String(!isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';

        if (isOpen) {
            mobileOverlay.scrollTop = 0;
            mobileOverlay.querySelector('a')?.focus();
        } else if (restoreFocus) {
            lastFocusedElement?.focus();
        }
    }

    function closeMenu(restoreFocus = true) {
        if (mobileOverlay.classList.contains('active')) {
            setMenuState(false, restoreFocus);
        }
    }

    mobileToggle.addEventListener('click', () => {
        const willOpen = !mobileOverlay.classList.contains('active');

        if (willOpen) {
            lastFocusedElement = document.activeElement;
        }

        setMenuState(willOpen);
    });

    mobileOverlay.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeMenu(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
            return;
        }

        if (event.key !== 'Tab' || !mobileOverlay.classList.contains('active')) return;

        const focusableItems = [...mobileOverlay.querySelectorAll('a[href], button:not([disabled])')]
            .filter((item) => item.offsetParent !== null);
        const firstItem = focusableItems[0];
        const lastItem = focusableItems[focusableItems.length - 1];

        if (!firstItem || !lastItem) {
            event.preventDefault();
            return;
        }

        if (event.shiftKey && document.activeElement === firstItem) {
            event.preventDefault();
            lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
            event.preventDefault();
            firstItem.focus();
        }
    });

    mobileQuery.addEventListener('change', () => {
        closeMenu(false);
        positionOverlay();
    });

    positionOverlay();
    setMenuState(false);
});
