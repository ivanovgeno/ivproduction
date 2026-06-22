const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer:fine)').matches;

const sectionSelectors = [
  '.hero-3d',
  '.manifesto',
  '.experience-section',
  '.gold-stage',
  '.selected-work',
  '.process-section',
  '.final-cta'
];

const sections = sectionSelectors
  .map((selector) => document.querySelector(selector))
  .filter(Boolean);

const scrollLine = document.createElement('div');
scrollLine.className = 'iv-scroll-line';
scrollLine.setAttribute('aria-hidden', 'true');
document.body.append(scrollLine);

let scrollFrame = 0;
const updateScrollProgress = () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / max));
    document.documentElement.style.setProperty('--scroll-progress', String(progress));
  });
};
updateScrollProgress();
addEventListener('scroll', updateScrollProgress, { passive: true });
addEventListener('resize', updateScrollProgress, { passive: true });

if (sections.length > 1 && innerWidth > 1100) {
  const progressNav = document.createElement('nav');
  progressNav.className = 'iv-progress';
  progressNav.setAttribute('aria-label', 'Navigace mezi sekcemi');

  const buttons = sections.map((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    const heading = section.querySelector('h1,h2,h3')?.textContent?.trim();
    button.setAttribute('aria-label', heading ? `Přejít na sekci: ${heading}` : `Přejít na sekci ${index + 1}`);
    button.addEventListener('click', () => {
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    progressNav.append(button);
    return button;
  });

  document.body.append(progressNav);

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = sections.indexOf(visible.target);
      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle('active', active);
        button.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }, { threshold: [0.22, 0.4, 0.62], rootMargin: '-12% 0px -24% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }
  buttons[0]?.classList.add('active');
  buttons[0]?.setAttribute('aria-current', 'true');
}

if (finePointer && !reduceMotion) {
  const cursorDot = document.createElement('div');
  const cursorRing = document.createElement('div');
  cursorDot.className = 'iv-cursor-dot';
  cursorRing.className = 'iv-cursor-ring';
  cursorDot.setAttribute('aria-hidden', 'true');
  cursorRing.setAttribute('aria-hidden', 'true');
  document.body.append(cursorRing, cursorDot);

  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorDot.style.translate = `${mouseX - 2.5}px ${mouseY - 2.5}px`;
    cursorRing.style.translate = `${ringX - 18}px ${ringY - 18}px`;
    requestAnimationFrame(renderCursor);
  };

  addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    document.body.classList.add('has-custom-cursor');
  }, { passive: true });

  addEventListener('pointerleave', () => document.body.classList.remove('has-custom-cursor'));
  addEventListener('pointerenter', () => document.body.classList.add('has-custom-cursor'));

  const interactiveSelector = 'a,button,input,select,textarea,.experience-panel,.work-card,.portfolio-card,.service-card';
  document.querySelectorAll(interactiveSelector).forEach((element) => {
    element.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });

  renderCursor();

  const motionCards = document.querySelectorAll(
    '.experience-panel,.work-card,.portfolio-card,.service-card,.gold-feature-grid article,.benefit-grid article,.package-grid article'
  );

  motionCards.forEach((card) => {
    let cardFrame = 0;
    card.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(cardFrame);
      cardFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const normalizedX = (event.clientX - rect.left) / rect.width;
        const normalizedY = (event.clientY - rect.top) / rect.height;
        const x = normalizedX * 100;
        const y = normalizedY * 100;
        const rotateY = (normalizedX - 0.5) * 3.4;
        const rotateX = (normalizedY - 0.5) * -2.7;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
        card.style.setProperty('--rx', `${rotateX}deg`);
        card.style.setProperty('--ry', `${rotateY}deg`);
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    });
  });

  document.querySelectorAll('.button,.main-nav>a,.text-link,.panel-links a').forEach((element) => {
    let magnetFrame = 0;
    element.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(magnetFrame);
      magnetFrame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        const strength = element.classList.contains('button') ? 0.1 : 0.07;
        element.style.translate = `${x * strength}px ${y * strength}px`;
      });
    });
    element.addEventListener('pointerleave', () => {
      element.style.translate = '';
    });
  });

  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  addEventListener('pointermove', (event) => {
    targetParallaxX = (event.clientX / innerWidth - 0.5) * 2;
    targetParallaxY = (event.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  const heroLines = [...document.querySelectorAll('.hero-line')];
  const renderParallax = () => {
    parallaxX += (targetParallaxX - parallaxX) * 0.04;
    parallaxY += (targetParallaxY - parallaxY) * 0.04;
    heroLines.forEach((line, index) => {
      const depth = (index + 1) * 2.1;
      line.style.translate = `${parallaxX * depth}px ${parallaxY * depth * -0.5}px`;
    });
    requestAnimationFrame(renderParallax);
  };
  renderParallax();
}

document.querySelectorAll('.button').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    if (reduceMotion) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'button-ripple';
    const size = Math.max(rect.width, rect.height) * 0.5;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });
});
