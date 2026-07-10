document.addEventListener('DOMContentLoaded', () => {
    const mobileButton = document.querySelector('.mobile-menu');
    const navigation = document.querySelector('.nav');

    if (!mobileButton || !navigation) return;

    const mobileQuery = window.matchMedia('(max-width: 900px)');

    function updateNavigationState() {
        const isOpen = navigation.classList.contains('active');
        const isMobile = mobileQuery.matches;

        mobileButton.setAttribute('aria-expanded', String(isOpen));
        mobileButton.setAttribute('aria-label', isOpen ? 'Zavřít menu' : 'Otevřít menu');
        navigation.setAttribute('aria-hidden', String(isMobile && !isOpen));
    }

    mobileButton.addEventListener('click', () => {
        window.requestAnimationFrame(updateNavigationState);
    });

    navigation.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            window.requestAnimationFrame(updateNavigationState);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navigation.classList.contains('active')) {
            mobileButton.click();
        }
    });

    mobileQuery.addEventListener('change', updateNavigationState);
    updateNavigationState();
});
