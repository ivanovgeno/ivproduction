<?php
$serviceLabels = [
    'svatby' => ['WEDDING FILM', 'Emoce, které nezestárnou', 'Od ranních příprav po večerní oslavu zachytíme váš den jako autentický filmový příběh.'],
    'reality' => ['REAL ESTATE FILM', 'Prostor, který divák skutečně ucítí', 'Spojujeme pohyb kamery, světlo, detail a dronové záběry do prezentace, která zvyšuje hodnotu nabídky.'],
    'plesy' => ['EVENT FILM', 'Energie celé události v jednom filmu', 'Atmosféra, hosté, program i emoce. Dynamické aftermovie a obsah připravený pro další propagaci.'],
    'fotobudka' => ['PHOTOBOOTH EXPERIENCE', 'Prémiová zábava s okamžitým výsledkem', 'Designová fotobudka, neomezené focení, tisk fotografií, vlastní grafika a online galerie.'],
    '360budka' => ['360° EXPERIENCE', 'Obsah, který se sdílí sám', 'Rotační platforma, slow motion, efekty, hudba a branding připravený přímo pro sociální sítě.'],
    'konference' => ['CONFERENCE PRODUCTION', 'Profesionální záznam bez kompromisů', 'Vícekamerová produkce, čistý zvuk, rozhovory a výstupy použitelné dlouho po skončení akce.'],
    'podcast' => ['PODCAST PRODUCTION', 'Obsah, který je vidět i slyšet', 'Kompletní video a audio produkce od světel a záznamu po finální epizodu a krátké výstupy.'],
    'promo' => ['BRAND FILM', 'Video, které má jasný cíl', 'Koncept, scénář, produkce a postprodukce pro značky, produkty, služby a kampaně.'],
];
$label = $serviceLabels[$route] ?? [strtoupper($service['title']), $service['eyebrow'], $service['description']];
?>
<section class="page-hero service-hero" style="--hero-image:url('/<?= e($service['image']) ?>')">
    <div class="service-hero-orbit" aria-hidden="true"></div>
    <div class="container page-hero-content" data-reveal>
        <span class="eyebrow"><i></i><?= e($label[0]) ?></span>
        <h1><?= e($service['title']) ?></h1>
        <p class="service-hero-lead"><?= e($label[1]) ?></p>
        <p><?= e($label[2]) ?></p>
        <div class="hero-actions">
            <a class="button gold-button" href="/kontakt?sluzba=<?= e($route) ?>"><span>Poptat službu</span></a>
            <a class="button button-ghost" href="/portfolio">Ukázky realizací</a>
        </div>
    </div>
</section>

<section class="section service-intro">
    <div class="container manifesto-grid" data-reveal>
        <span class="section-index">01 / PŘÍSTUP</span>
        <div><p class="manifesto-lead">IV Production standard</p><h2>Kompletní řešení.<br><span class="gold-text">Jeden silný výsledek.</span></h2></div>
        <p class="manifesto-copy">Každou realizaci připravujeme podle cíle, prostoru a publika. Neprodáváme univerzální šablonu — navrhujeme produkci, která funguje právě pro váš projekt.</p>
    </div>
</section>

<section class="section service-benefits">
    <div class="container">
        <div class="experience-heading" data-reveal>
            <span class="section-index">02 / CO ZÍSKÁTE</span>
            <div><span class="eyebrow"><i></i> Crafted for your event</span><h2>Každý detail<br><span class="serif-line">pod kontrolou.</span></h2></div>
        </div>
        <div class="benefit-grid">
            <?php foreach ($service['features'] as $index => $feature): ?>
                <article data-reveal><span>0<?= $index + 1 ?></span><h3><?= e($feature) ?></h3><p>Součást řešení navrženého s důrazem na kvalitu, spolehlivost a profesionální prezentaci.</p></article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section package-section">
    <div class="container">
        <div class="package-heading" data-reveal>
            <div><span class="section-index">03 / VARIANTY</span><h2>Rozsah podle<br><span class="gold-text">vašeho projektu.</span></h2></div>
            <p>Finální nabídku připravujeme individuálně podle termínu, lokality, délky realizace a požadovaných výstupů.</p>
        </div>
        <div class="package-grid">
            <article data-reveal><span>ESSENTIAL</span><h3>Základní produkce</h3><p>Efektivní řešení pro menší realizaci a jasně definovaný výstup.</p><ul><li>Konzultace a plán</li><li>Profesionální realizace</li><li>Finální předání</li></ul><a href="/kontakt?sluzba=<?= e($route) ?>">Poptat variantu →</a></article>
            <article class="package-featured" data-reveal><span>SIGNATURE</span><h3>Kompletní zážitek</h3><p>Rozšířená produkce s větším rozsahem, prémiovou prezentací a více výstupy.</p><ul><li>Kompletní příprava</li><li>Rozšířený produkční tým</li><li>Více finálních formátů</li></ul><a href="/kontakt?sluzba=<?= e($route) ?>">Poptat variantu →</a></article>
            <article data-reveal><span>24K BESPOKE</span><h3>Řešení na míru</h3><p>Individuální produkce pro náročné projekty, značky a velké eventy.</p><ul><li>Individuální koncept</li><li>Produkce bez kompromisů</li><li>Prioritní workflow</li></ul><a href="/kontakt?sluzba=<?= e($route) ?>">Poptat variantu →</a></article>
        </div>
    </div>
</section>

<section class="process-section section">
    <div class="container process-grid">
        <div class="process-intro" data-reveal><span class="section-index">04 / PROCESS</span><span class="eyebrow"><i></i> Simple and transparent</span><h2>Od poptávky<br><span class="gold-text">k výsledku.</span></h2><p>Budete vždy vědět, co následuje, co od vás potřebujeme a kdy obdržíte finální výstup.</p></div>
        <ol class="process-list">
            <li data-reveal><span>01</span><div><h3>Konzultace</h3><p>Probereme termín, cíl, prostor a očekávání.</p></div></li>
            <li data-reveal><span>02</span><div><h3>Návrh řešení</h3><p>Připravíme konkrétní rozsah, harmonogram a cenovou nabídku.</p></div></li>
            <li data-reveal><span>03</span><div><h3>Realizace</h3><p>Postaráme se o techniku, produkci a hladký průběh.</p></div></li>
            <li data-reveal><span>04</span><div><h3>Předání</h3><p>Dodáme finální výstupy v dohodnutých formátech.</p></div></li>
        </ol>
    </div>
</section>

<section class="final-cta compact-cta" data-reveal>
    <div class="final-cta-ring" aria-hidden="true"></div>
    <div class="container final-cta-inner">
        <span class="eyebrow"><i></i> Check your date</span>
        <h2>Proberme váš<br><span class="gold-text">termín a představu.</span></h2>
        <p>Nezávazně nám napište základní informace a připravíme vhodné řešení.</p>
        <a class="button gold-button" href="/kontakt?sluzba=<?= e($route) ?>"><span>Odeslat poptávku</span></a>
    </div>
</section>
