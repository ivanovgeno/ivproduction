<section class="hero">
    <div class="hero-media" aria-hidden="true"></div>
    <div class="container hero-content">
        <span class="eyebrow">IV Production · Hradec Králové</span>
        <h1>Tvoříme videa, která <span>zůstávají v paměti.</span></h1>
        <p>Profesionální video produkce, svatební filmy, reality, eventy a fotobudky po celé České republice.</p>
        <div class="hero-actions">
            <a class="button" href="/kontakt">Nezávazná poptávka</a>
            <a class="button button-ghost" href="/portfolio">Prohlédnout portfolio</a>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-heading">
            <span class="eyebrow">Naše služby</span>
            <h2>Od prvního nápadu po finální výstup</h2>
            <p>Každý projekt stavíme na příběhu, kvalitním obrazu a výsledku, který má pro klienta skutečnou hodnotu.</p>
        </div>
        <div class="card-grid">
            <?php foreach ($site['services'] as $slug => $item): ?>
                <article class="service-card" style="--card-image: url('/<?= e($item['image']) ?>')">
                    <div class="service-card-content">
                        <span><?= e($item['eyebrow']) ?></span>
                        <h3><?= e($item['title']) ?></h3>
                        <p><?= e($item['description']) ?></p>
                        <a href="/<?= e($slug) ?>">Zjistit více <span aria-hidden="true">→</span></a>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section section-muted">
    <div class="container stats-grid">
        <div><strong>500+</strong><span>realizovaných akcí</span></div>
        <div><strong>4K</strong><span>profesionální obraz</span></div>
        <div><strong>2</strong><span>zkušení kameramani</span></div>
        <div><strong>Celá ČR</strong><span>působnost bez omezení</span></div>
    </div>
</section>

<section class="section">
    <div class="container split-block">
        <div>
            <span class="eyebrow">Proč IV Production</span>
            <h2>Technika je základ. Rozhodující je cit pro příběh.</h2>
        </div>
        <div>
            <p>Nejsme jen obsluha kamery. Pomáháme s konceptem, plánem natáčení, produkcí i distribucí výsledného obsahu.</p>
            <ul class="check-list">
                <li>Osobní přístup a jasná komunikace</li>
                <li>Profesionální technika, zvuk a dron</li>
                <li>Moderní střih, color grading a formáty pro sociální sítě</li>
                <li>Spolehlivé dodání a dlouhodobá spolupráce</li>
            </ul>
            <a class="text-link" href="/kontakt">Probrat váš projekt →</a>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container cta-inner">
        <div>
            <span class="eyebrow">Máte projekt?</span>
            <h2>Pojďme mu dát obraz, zvuk a emoci.</h2>
        </div>
        <a class="button" href="/kontakt">Napsat nám</a>
    </div>
</section>
