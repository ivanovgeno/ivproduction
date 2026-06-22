<?php
$selectedService = trim((string) ($_GET['sluzba'] ?? ''));
$success = flash('success');
$error = flash('error');
$isStaticPreview = ($_ENV['STATIC_EXPORT'] ?? '') === '1';
?>
<section class="page-hero compact contact-hero">
    <div class="container page-hero-content" data-reveal>
        <span class="eyebrow"><i></i> Start your project</span>
        <h1>Pojďme vytvořit<br><span class="serif-line">něco výjimečného.</span></h1>
        <p>Stačí několik základních informací. Ozveme se s konkrétním návrhem dalšího postupu.</p>
    </div>
</section>

<section class="section inquiry-section">
    <div class="container inquiry-layout">
        <aside class="inquiry-aside" data-reveal>
            <span class="section-index">CONTACT / 01</span>
            <h2>IV Production</h2>
            <p>Video produkce, fotobudky a 360° video zážitky pro svatby, firmy a eventy.</p>
            <div class="contact-list">
                <a href="mailto:<?= e($site['email']) ?>"><span>E-mail</span><strong><?= e($site['email']) ?></strong></a>
                <a href="tel:<?= e(str_replace(' ', '', $site['phone'])) ?>"><span>Telefon</span><strong><?= e($site['phone']) ?></strong></a>
                <div><span>Působnost</span><strong><?= e($site['location']) ?></strong></div>
            </div>
            <div class="response-note"><b>24h</b><span>Obvykle odpovídáme během jednoho pracovního dne.</span></div>
        </aside>

        <div class="inquiry-card" data-reveal>
            <?php if ($isStaticPreview): ?>
                <div class="form-alert success" role="status">Toto je testovací náhled na GitHub Pages. PHP odesílání formuláře bude aktivní až na produkčním hostingu.</div>
            <?php elseif ($success): ?>
                <div class="form-alert success" role="status"><?= e($success) ?></div>
            <?php endif; ?>
            <?php if (!$isStaticPreview && $error): ?>
                <div class="form-alert error" role="alert"><?= e($error) ?></div>
            <?php endif; ?>

            <form class="premium-form" action="<?= $isStaticPreview ? '' : '/kontakt' ?>" method="<?= $isStaticPreview ? 'get' : 'post' ?>">
                <?php if (!$isStaticPreview): ?>
                    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                    <label class="honeypot" aria-hidden="true">Web<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
                <?php endif; ?>

                <div class="form-section-head"><span>01</span><div><h2>Co plánujete?</h2><p>Vyberte hlavní službu.</p></div></div>
                <div class="service-choice-grid">
                    <?php foreach ($site['services'] as $slug => $item): ?>
                        <label class="service-choice">
                            <input type="radio" name="service" value="<?= e($item['title']) ?>" <?= $selectedService === $slug ? 'checked' : '' ?>>
                            <span><b><?= e($item['title']) ?></b><small><?= e($item['eyebrow']) ?></small></span>
                        </label>
                    <?php endforeach; ?>
                </div>

                <div class="form-section-head"><span>02</span><div><h2>Základní informace</h2><p>Termín a místo nám pomohou připravit přesnější nabídku.</p></div></div>
                <div class="form-row">
                    <label>Termín<input type="date" name="date"></label>
                    <label>Místo konání<input type="text" name="location" placeholder="Město nebo lokalita"></label>
                </div>
                <label>Orientační rozpočet
                    <select name="budget">
                        <option value="">Vyberte rozpětí</option>
                        <option>Do 15 000 Kč</option>
                        <option>15 000–30 000 Kč</option>
                        <option>30 000–60 000 Kč</option>
                        <option>60 000 Kč a více</option>
                        <option>Potřebuji doporučení</option>
                    </select>
                </label>
                <label>Popište svoji představu<textarea name="message" rows="7" required placeholder="Typ akce, požadované výstupy, počet hostů, délka pronájmu nebo další důležité informace..."></textarea></label>

                <div class="form-section-head"><span>03</span><div><h2>Kam se ozveme?</h2><p>Kontaktní údaje použijeme pouze pro vyřízení poptávky.</p></div></div>
                <div class="form-row">
                    <label>Jméno a příjmení<input type="text" name="name" required autocomplete="name"></label>
                    <label>E-mail<input type="email" name="email" required autocomplete="email"></label>
                </div>
                <label>Telefon<input type="tel" name="phone" autocomplete="tel" placeholder="+420"></label>
                <label class="consent"><input type="checkbox" name="consent" required><span>Souhlasím se zpracováním osobních údajů za účelem vyřízení této poptávky.</span></label>

                <?php if ($isStaticPreview): ?>
                    <a class="button gold-button submit-button" href="mailto:<?= e($site['email']) ?>"><span>Napsat přímo e-mail</span></a>
                <?php else: ?>
                    <button class="button gold-button submit-button" type="submit"><span>Odeslat nezávaznou poptávku</span></button>
                <?php endif; ?>
            </form>
        </div>
    </div>
</section>
