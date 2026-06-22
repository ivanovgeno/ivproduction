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
