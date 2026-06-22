const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
const loader = document.querySelector('[data-loader]');
const cursorGlow = document.querySelector('[data-cursor-glow]');

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open') ?? false;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
}));

window.addEventListener('load', () => {
    window.setTimeout(() => loader?.classList.add('is-hidden'), 240);
});
window.setTimeout(() => loader?.classList.add('is-hidden'), 2200);

if (cursorGlow && matchMedia('(pointer:fine)').matches) {
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let targetX = x;
    let targetY = y;
    window.addEventListener('pointermove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
    }, { passive: true });
    const moveGlow = () => {
        x += (targetX - x) * 0.08;
        y += (targetY - y) * 0.08;
        cursorGlow.style.transform = `translate(${x - 210}px, ${y - 210}px)`;
        requestAnimationFrame(moveGlow);
    };
    moveGlow();
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('[data-reveal]').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(element);
});

if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.experience-panel,.work-card').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(1400px) rotateX(${y * -1.3}deg) rotateY(${x * 1.8}deg)`;
        });
        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
        });
    });
}
