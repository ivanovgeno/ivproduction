// Server-managed content overrides. The site keeps its complete static HTML as
// a reliable fallback; PHP hosting can publish selected edits through the admin.
(function loadManagedContent() {
    const script = document.createElement('script');
    script.src = 'cms-content.js?v=20260809-admin';
    script.defer = true;
    document.head.appendChild(script);
}());

document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');

    if (!mobileToggle || !mobileOverlay) return;

    const mobileQuery = window.matchMedia('(max-width: 900px)');
    const overlayOrigin = document.createComment('mobile menu overlay origin');
    mobileOverlay.parentNode.insertBefore(overlayOrigin, mobileOverlay);
    let overlayIsPortaled = false;
    let focusFrame = null;
    let backgroundInertState = new Map();
    const originalBodyOverflow = document.body.style.overflow;

    function getBackgroundNodes() {
        const backgroundNodes = new Set();
        let activeBranch = mobileToggle;

        // Keep only the hamburger and the portaled dialog interactive. At every
        // ancestor level, everything outside the branch containing the toggle is
        // background content and must therefore be inert while the modal is open.
        while (activeBranch && activeBranch !== document.body) {
            const parent = activeBranch.parentElement;
            if (!parent) break;

            [...parent.children].forEach((sibling) => {
                if (sibling !== activeBranch && sibling !== mobileOverlay) {
                    backgroundNodes.add(sibling);
                }
            });

            activeBranch = parent;
        }

        return [...backgroundNodes];
    }

    function setBackgroundInert(isInert) {
        if (isInert) {
            backgroundInertState = new Map();
            getBackgroundNodes().forEach((node) => {
                backgroundInertState.set(node, node.inert);
                node.inert = true;
            });
            return;
        }

        backgroundInertState.forEach((wasInert, node) => {
            node.inert = wasInert;
        });
        backgroundInertState.clear();
    }

    function focusFirstMenuLink() {
        if (focusFrame) cancelAnimationFrame(focusFrame);

        // Two animation frames let WebKit apply visibility and the active dialog
        // state before focus is moved into it.
        focusFrame = requestAnimationFrame(() => {
            focusFrame = requestAnimationFrame(() => {
                focusFrame = null;
                if (!mobileOverlay.classList.contains('active')) return;

                const firstLink = mobileOverlay.querySelector('a[href]');
                firstLink?.focus({ preventScroll: true });
            });
        });
    }

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
        mobileOverlay.inert = !isOpen;
        setBackgroundInert(isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : originalBodyOverflow;

        if (isOpen) {
            mobileOverlay.scrollTop = 0;
            focusFirstMenuLink();
        } else if (restoreFocus) {
            if (focusFrame) cancelAnimationFrame(focusFrame);
            focusFrame = null;
            mobileToggle.focus({ preventScroll: true });
        }
    }

    function closeMenu(restoreFocus = true) {
        if (mobileOverlay.classList.contains('active')) {
            setMenuState(false, restoreFocus);
        }
    }

    mobileToggle.addEventListener('click', () => {
        const willOpen = !mobileOverlay.classList.contains('active');
        setMenuState(willOpen, !willOpen);
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

// Prevent opened third-party pages from retaining access to the Iv Production tab.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.setAttribute('rel', [...rel].join(' '));
    });
});
