<?php /** @var array $site */ ?>
</main>
<footer class="site-footer">
    <div class="container footer-grid">
        <div>
            <a class="brand footer-brand" href="/" aria-label="IV Production – domů"><img src="/logo-light.png" alt="IV Production"></a>
            <p>Profesionální video produkce, fotobudky a 360° video zážitky pro okamžiky, které stojí za to uchovat.</p>
        </div>
        <div>
            <h2>Služby</h2>
            <a href="/svatby">Svatby</a>
            <a href="/reality">Reality</a>
            <a href="/plesy">Plesy a eventy</a>
            <a href="/fotobudka">Fotobudka</a>
            <a href="/360budka">360° video koutek</a>
        </div>
        <div>
            <h2>Kontakt</h2>
            <a href="mailto:<?= e($site['email']) ?>"><?= e($site['email']) ?></a>
            <a href="tel:<?= e(str_replace(' ', '', $site['phone'])) ?>"><?= e($site['phone']) ?></a>
            <span><?= e($site['location']) ?></span>
        </div>
        <div>
            <h2>Informace</h2>
            <a href="/portfolio">Portfolio</a>
            <a href="/blog">Blog</a>
            <a href="/obchodni-podminky">Obchodní podmínky</a>
            <a href="/ochrana-osobnich-udaju">Ochrana osobních údajů</a>
        </div>
    </div>
    <div class="container footer-bottom">
        <span>© <?= date('Y') ?> IV Production · Crafted in cinematic 24K</span>
        <div class="socials" aria-label="Sociální sítě">
            <a href="<?= e($site['social']['instagram']) ?>" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="<?= e($site['social']['facebook']) ?>" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="<?= e($site['social']['youtube']) ?>" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
    </div>
</footer>
<script src="/assets/js/runtime-polish.js?v=20260622-polish4c" defer></script>
<script src="/assets/js/app.js?v=20260622-polish4c" defer></script>
<script src="/assets/js/interaction-v3.js?v=20260622-polish4c" defer></script>
<script type="module" src="/assets/js/scene.js?v=20260622-polish4c"></script>
</body>
</html>
