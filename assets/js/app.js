document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
const loader = document.querySelector('[data-loader]');
const cursorGlow = document.querySelector('[data-cursor-glow]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer:fine)').matches;

const main = document.querySelector('main');
if (main && !main.id) main.id = 'main-content';

if (!document.querySelector('.skip-link')) {
  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#main-content';
  skipLink.textContent = 'Přeskočit na obsah';
  document.body.prepend(skipLink);
}

const pageTransition = document.createElement('div');
pageTransition.className = 'page-transition';
pageTransition.setAttribute('aria-hidden', 'true');
document.body.append(pageTransition);

let headerFrame = 0;
const updateHeader = () => {
  cancelAnimationFrame(headerFrame);
  headerFrame = requestAnimationFrame(() => {
    header?.classList.toggle('scrolled', scrollY > 24);
  });
};
updateHeader();
addEventListener('scroll', updateHeader, { passive: true });

const menuFocusable = () => [...(menu?.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])') || [])];

const setMenuOpen = (open, focusFirst = false) => {
  if (!menu || !toggle) return;
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  document.body.classList.toggle('menu-open', open);
  if (open && focusFirst) requestAnimationFrame(() => menuFocusable()[0]?.focus());
};

toggle?.addEventListener('click', () => {
  setMenuOpen(!(menu?.classList.contains('open')), true);
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.classList.contains('open')) {
    setMenuOpen(false);
    toggle?.focus();
    return;
  }

  if (event.key !== 'Tab' || !menu?.classList.contains('open')) return;
  const focusable = menuFocusable();
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const hideLoader = () => {
  loader?.classList.add('is-hidden');
  loader?.setAttribute('aria-hidden', 'true');
};
addEventListener('load', () => setTimeout(hideLoader, 220), { once: true });
setTimeout(hideLoader, 1800);
addEventListener('pageshow', () => {
  document.body.classList.remove('page-is-leaving');
  hideLoader();
});

if (cursorGlow && finePointer && !reducedMotion) {
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let targetX = x;
  let targetY = y;

  addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  }, { passive: true });

  const moveGlow = () => {
    x += (targetX - x) * 0.065;
    y += (targetY - y) * 0.065;
    cursorGlow.style.transform = `translate3d(${x - 210}px,${y - 210}px,0)`;
    requestAnimationFrame(moveGlow);
  };
  moveGlow();
}

const revealElements = [...document.querySelectorAll('[data-reveal]')];
revealElements.forEach((element, index) => {
  element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 65}ms`);
});

if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const isModifiedClick = (event) => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

const navigateWithTransition = (url) => {
  if (document.body.classList.contains('page-is-leaving')) return;
  document.body.classList.add('page-is-leaving');
  setTimeout(() => { window.location.href = url; }, reducedMotion ? 0 : 360);
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || isModifiedClick(event)) return;
  if (link.hasAttribute('download') || link.target === '_blank') return;

  const rawHref = link.getAttribute('href') || '';
  if (!rawHref || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return;

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;

  if (url.pathname === location.pathname && url.search === location.search && url.hash) {
    const target = document.querySelector(url.hash);
    if (!target) return;
    event.preventDefault();
    setMenuOpen(false);
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    setTimeout(() => target.focus({ preventScroll: true }), reducedMotion ? 0 : 550);
    history.replaceState(null, '', url.hash);
    return;
  }

  event.preventDefault();
  setMenuOpen(false);
  navigateWithTransition(url.href);
});

const forms = [...document.querySelectorAll('form')];
forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      form.querySelector(':invalid')?.focus();
      return;
    }

    const submit = form.querySelector('button[type="submit"],input[type="submit"]');
    if (!submit) return;
    submit.classList.add('is-loading');
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
  });
});

document.querySelectorAll('.service-choice input').forEach((input) => {
  const update = () => {
    input.closest('.service-choice')?.classList.toggle('is-selected', input.checked);
  };
  input.addEventListener('change', () => {
    document.querySelectorAll(`input[name="${CSS.escape(input.name)}"]`).forEach((other) => {
      other.closest('.service-choice')?.classList.toggle('is-selected', other.checked);
    });
  });
  update();
});

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
  rel.add('noopener');
  rel.add('noreferrer');
  link.setAttribute('rel', [...rel].join(' '));
});
