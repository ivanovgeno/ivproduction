const portfolioAction = document.querySelector('.play-button[href="/portfolio"]');
if (portfolioAction) {
  const icon = portfolioAction.querySelector('b');
  const label = portfolioAction.querySelector('span');
  if (icon) {
    icon.textContent = '↗';
    icon.setAttribute('aria-hidden', 'true');
  }
  if (label) label.textContent = 'Prohlédnout portfolio';
  portfolioAction.setAttribute('aria-label', 'Prohlédnout portfolio IV Production');
}

document.querySelectorAll('.experience-panel,.gold-feature-grid article,.work-card,.portfolio-card,.article-grid article,.benefit-grid article,.package-grid article').forEach((element) => {
  if (!element.hasAttribute('data-reveal')) element.setAttribute('data-reveal', '');
});

const sceneSections = [
  ['.hero-3d,.service-hero,.contact-hero', 'hero'],
  ['.manifesto,.service-intro', 'intro'],
  ['.experience-section,.service-benefits', 'services'],
  ['.gold-stage,.package-section', 'premium'],
  ['.selected-work', 'portfolio'],
  ['.process-section', 'process'],
  ['.final-cta,.inquiry-section', 'contact']
];

const sceneTargets = [];
sceneSections.forEach(([selector, state]) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.dataset.cameraState = state;
    sceneTargets.push(element);
  });
});

document.body.dataset.activeScene = sceneTargets[0]?.dataset.cameraState || 'hero';

if ('IntersectionObserver' in window && sceneTargets.length) {
  const cameraStateObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.dataset?.cameraState) {
      document.body.dataset.activeScene = visible.target.dataset.cameraState;
    }
  }, { threshold: [0.18, 0.36, 0.58], rootMargin: '-12% 0px -24% 0px' });
  sceneTargets.forEach((element) => cameraStateObserver.observe(element));
}

document.querySelectorAll('input,select,textarea').forEach((control) => {
  control.addEventListener('pointerenter', () => document.body.classList.add('cursor-form'));
  control.addEventListener('pointerleave', () => document.body.classList.remove('cursor-form'));
  control.addEventListener('focus', () => document.body.classList.add('cursor-form'));
  control.addEventListener('blur', () => document.body.classList.remove('cursor-form'));
});

const formAlert = document.querySelector('.form-alert');
if (formAlert) {
  formAlert.setAttribute('tabindex', '-1');
  formAlert.setAttribute('aria-live', formAlert.classList.contains('error') ? 'assertive' : 'polite');
  requestAnimationFrame(() => {
    formAlert.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => formAlert.focus({ preventScroll: true }), 500);
  });
}

addEventListener('pageshow', () => {
  document.body.classList.remove('cursor-form');
  document.querySelectorAll('.button.is-loading,[aria-busy="true"]').forEach((element) => {
    element.classList.remove('is-loading');
    element.removeAttribute('aria-busy');
    if ('disabled' in element) element.disabled = false;
  });
});
