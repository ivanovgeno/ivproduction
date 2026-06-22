<?php /** @var array $site */ ?>
</main>
<footer class="site-footer">
    <div class="container footer-grid">
        <div>
            <a class="brand footer-brand" href="/"><img src="/logo-light.png" alt="IV Production"></a>
            <p>Profesionální video produkce a fotobudky pro okamžiky, které stojí za to uchovat.</p>
        </div>
        <div>
            <h2>Služby</h2>
            <a href="/svatby">Svatby</a>
            <a href="/reality">Reality</a>
            <a href="/plesy">Plesy a eventy</a>
            <a href="/fotobudka">Fotobudka</a>
            <a href="/360budka">360° budka</a>
        </div>
        <div>
            <h2>Kontakt</h2>
            <a href="mailto:<?= e($site['email']) ?>"><?= e($site['email']) ?></a>
            <a href="tel:<?= e(str_replace(' ', '', $site['phone'])) ?>"><?= e($site['phone']) ?></a>
            <span><?= e($site['location']) ?></span>
        </div>
        <div>
            <h2>Informace</h2>
            <a href="/obchodni-podminky">Obchodní podmínky</a>
            <a href="/ochrana-osobnich-udaju">Ochrana osobních údajů</a>
            <a href="/marketingovy-souhlas">Marketingový souhlas</a>
        </div>
    </div>
    <div class="container footer-bottom">
        <span>© <?= date('Y') ?> IV Production</span>
        <div class="socials">
            <a href="<?= e($site['social']['instagram']) ?>" target="_blank" rel="noopener">Instagram</a>
            <a href="<?= e($site['social']['facebook']) ?>" target="_blank" rel="noopener">Facebook</a>
            <a href="<?= e($site['social']['youtube']) ?>" target="_blank" rel="noopener">YouTube</a>
        </div>
    </div>
</footer>
<script src="/assets/js/app.js" defer></script>
</body>
</html>
