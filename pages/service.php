<section class="page-hero" style="--hero-image: url('/<?= e($service['image']) ?>')">
    <div class="container page-hero-content">
        <span class="eyebrow"><?= e($service['eyebrow']) ?></span>
        <h1><?= e($service['title']) ?></h1>
        <p><?= e($service['description']) ?></p>
        <a class="button" href="/kontakt?sluzba=<?= e($route) ?>">Poptat službu</a>
    </div>
</section>
<section class="section">
    <div class="container split-block">
        <div>
            <span class="eyebrow">Co získáte</span>
            <h2>Kompletní produkci pod jednou střechou</h2>
        </div>
        <div>
            <ul class="feature-list">
                <?php foreach ($service['features'] as $feature): ?>
                    <li><?= e($feature) ?></li>
                <?php endforeach; ?>
            </ul>
            <p>Konkrétní rozsah, harmonogram a cenu připravíme podle vašeho projektu. Ozvěte se a navrhneme vhodné řešení.</p>
        </div>
    </div>
</section>
<section class="cta-section">
    <div class="container cta-inner">
        <div><span class="eyebrow">Další krok</span><h2>Proberme váš termín a představu.</h2></div>
        <a class="button" href="/kontakt?sluzba=<?= e($route) ?>">Nezávazná poptávka</a>
    </div>
</section>
