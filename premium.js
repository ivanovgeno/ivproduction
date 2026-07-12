document.addEventListener('DOMContentLoaded', () => {
    const mobileButton = document.querySelector('.mobile-menu');
    const navigation = document.querySelector('.nav');

    if (!mobileButton || !navigation) return;

    const mobileQuery = window.matchMedia('(max-width: 900px)');
    const managesNavigation = mobileButton.hasAttribute('data-nav-controller');

    function updateMenuIcon(isOpen) {
        const icon = mobileButton.querySelector('svg');
        if (!icon) return;

        icon.innerHTML = isOpen
            ? '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
            : '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
    }

    function updateNavigationState() {
        const isOpen = navigation.classList.contains('active');
        const isMobile = mobileQuery.matches;

        mobileButton.setAttribute('aria-expanded', String(isOpen));
        mobileButton.setAttribute('aria-label', isOpen ? 'Zavřít menu' : 'Otevřít menu');
        navigation.setAttribute('aria-hidden', String(isMobile && !isOpen));
        navigation.inert = isMobile && !isOpen;
        updateMenuIcon(isOpen);
    }

    if (managesNavigation) {
        mobileButton.addEventListener('click', () => {
            const willOpen = !navigation.classList.contains('active');
            navigation.classList.toggle('active', willOpen);
            mobileButton.classList.toggle('active', willOpen);
            document.body.style.overflow = willOpen ? 'hidden' : '';
            updateNavigationState();
        });
    } else {
        mobileButton.addEventListener('click', () => {
            window.requestAnimationFrame(updateNavigationState);
        });
    }

    navigation.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (managesNavigation && mobileQuery.matches) {
                navigation.classList.remove('active');
                mobileButton.classList.remove('active');
                document.body.style.overflow = '';
            }

            window.requestAnimationFrame(updateNavigationState);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navigation.classList.contains('active')) {
            if (managesNavigation) {
                navigation.classList.remove('active');
                mobileButton.classList.remove('active');
                document.body.style.overflow = '';
                updateNavigationState();
            } else {
                mobileButton.click();
            }
        }
    });

    mobileQuery.addEventListener('change', () => {
        if (!mobileQuery.matches) {
            navigation.classList.remove('active');
            mobileButton.classList.remove('active');
            document.body.style.overflow = '';
        }

        window.requestAnimationFrame(updateNavigationState);
    });
    updateNavigationState();
});
