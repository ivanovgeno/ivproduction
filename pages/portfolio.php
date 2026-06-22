<?php
$portfolioItems = [
    ['route' => 'svatby', 'label' => 'Wedding film', 'title' => 'Svatební příběhy', 'text' => 'Filmový záznam emocí, detailů a okamžiků, ke kterým se budete chtít vracet.', 'image' => 'hero-bg.png'],
    ['route' => 'reality', 'label' => 'Real estate', 'title' => 'Reality', 'text' => 'Video prohlídky, exteriéry, dron a atmosféra prostoru v profesionální prezentaci.', 'image' => 'reality-bg.jpg'],
    ['route' => 'plesy', 'label' => 'Event film', 'title' => 'Plesy a eventy', 'text' => 'Energie celé události v dynamickém aftermovie i krátkých výstupech pro sítě.', 'image' => 'plesy-bg.jpg'],
    ['route' => 'promo', 'label' => 'Brand film', 'title' => 'Promo videa', 'text' => 'Koncept, produkce a postprodukce pro značky, služby, produkty a kampaně.', 'image' => 'hero-bg.png'],
    ['route' => 'konference', 'label' => 'Conference production', 'title' => 'Konference', 'text' => 'Vícekamerový záznam, čistý zvuk, rozhovory a obsah pro další komunikaci.', 'image' => 'plesy-bg.jpg'],
    ['route' => 'podcast', 'label' => 'Podcast production', 'title' => 'Podcasty', 'text' => 'Obrazová a zvuková produkce celé epizody i krátkých formátů pro sociální sítě.', 'image' => 'hero-bg.png'],
];
?>
<section class="page-hero compact">
    <div class="container page-hero-content" data-reveal>
        <span class="eyebrow"><i></i> Selected production</span>
        <h1>Portfolio</h1>
        <p>Objevte oblasti, ve kterých spojujeme filmový přístup, profesionální techniku a cit pro atmosféru.</p>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="portfolio-grid">
            <?php foreach ($portfolioItems as $item): ?>
                <a class="portfolio-card" href="/<?= e($item['route']) ?>" data-reveal>
                    <div class="portfolio-card-media" style="--portfolio-image:url('/<?= e($item['image']) ?>')" aria-hidden="true"></div>
                    <div class="portfolio-card-content">
                        <span><?= e($item['label']) ?></span>
                        <h2><?= e($item['title']) ?></h2>
                        <p><?= e($item['text']) ?></p>
                        <span class="portfolio-card-action">Prohlédnout službu</span>
                    </div>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="final-cta compact-cta" data-reveal>
    <div class="final-cta-ring" aria-hidden="true"></div>
    <div class="container final-cta-inner">
        <span class="eyebrow"><i></i> Your project can be next</span>
        <h2>Řekněte nám, co chcete<br><span class="gold-text">vytvořit.</span></h2>
        <p>Popište nám termín, místo a představu. Navrhneme vhodný rozsah produkce.</p>
        <a class="button gold-button" href="/kontakt"><span>Poptat projekt</span></a>
    </div>
</section>
