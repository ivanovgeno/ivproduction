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
document.body.append(scrollLine);

const updateScrollProgress = () => {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, Math.max(0, scrollY / max));
  document.documentElement.style.setProperty('--scroll-progress', String(progress));
};
updateScrollProgress();
addEventListener('scroll', updateScrollProgress, { passive: true });
addEventListener('resize', updateScrollProgress, { passive: true });

if (sections.length > 1) {
  const progressNav = document.createElement('nav');
  progressNav.className = 'iv-progress';
  progressNav.setAttribute('aria-label', 'Navigace mezi sekcemi');

  const buttons = sections.map((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Přejít na sekci ${index + 1}`);
    button.addEventListener('click', () => section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
    progressNav.append(button);
    return button;
  });

  document.body.append(progressNav);

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = sections.indexOf(visible.target);
    buttons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === index));
  }, { threshold: [0.25, 0.45, 0.65], rootMargin: '-12% 0px -24% 0px' });

  sections.forEach((section) => sectionObserver.observe(section));
  buttons[0]?.classList.add('active');
}

if (finePointer && !reduceMotion) {
  const cursorDot = document.createElement('div');
  const cursorRing = document.createElement('div');
  cursorDot.className = 'iv-cursor-dot';
  cursorRing.className = 'iv-cursor-ring';
  document.body.append(cursorRing, cursorDot);

  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    cursorDot.style.translate = `${mouseX - 2.5}px ${mouseY - 2.5}px`;
    cursorRing.style.translate = `${ringX - 18}px ${ringY - 18}px`;
    requestAnimationFrame(renderCursor);
  };

  addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    document.body.classList.add('has-custom-cursor');
  }, { passive: true });

  document.querySelectorAll('a,button,.experience-panel,.work-card,.service-card,.portfolio-card').forEach((element) => {
    element.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });

  renderCursor();

  const spotlightTargets = document.querySelectorAll(
    '.experience-panel,.work-card,.gold-feature-grid article,.benefit-grid article,.package-grid article,.service-card,.portfolio-card'
  );

  spotlightTargets.forEach((target) => {
    target.addEventListener('pointermove', (event) => {
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty('--mx', `${x}%`);
      target.style.setProperty('--my', `${y}%`);
    });
  });

  document.querySelectorAll('.button,.main-nav>a,.text-link').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.translate = `${x * 0.09}px ${y * 0.12}px`;
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
    parallaxX += (targetParallaxX - parallaxX) * 0.045;
    parallaxY += (targetParallaxY - parallaxY) * 0.045;
    heroLines.forEach((line, index) => {
      const depth = (index + 1) * 2.2;
      line.style.transform = `translate3d(${parallaxX * depth}px,${parallaxY * depth * -0.55}px,0)`;
    });
    requestAnimationFrame(renderParallax);
  };
  renderParallax();
}
