<?php
$selectedService = trim((string) ($_GET['sluzba'] ?? ''));
?>
<section class="page-hero compact"><div class="container page-hero-content"><span class="eyebrow">Nezávazná poptávka</span><h1>Kontakt</h1><p>Popište nám termín, místo a představu. Ozveme se s návrhem dalšího postupu.</p></div></section>
<section class="section"><div class="container contact-grid">
<div class="contact-details">
<h2>IV Production</h2>
<p><a href="mailto:<?= e($site['email']) ?>"><?= e($site['email']) ?></a><br><a href="tel:<?= e(str_replace(' ', '', $site['phone'])) ?>"><?= e($site['phone']) ?></a><br><?= e($site['location']) ?></p>
<p>Formulář je připravený pro napojení na SMTP. Do té doby můžete poptávku poslat přímo e-mailem.</p>
</div>
<form class="contact-form" action="mailto:<?= e($site['email']) ?>" method="post" enctype="text/plain">
<div class="form-row"><label>Jméno a příjmení<input type="text" name="jmeno" required autocomplete="name"></label><label>E-mail<input type="email" name="email" required autocomplete="email"></label></div>
<div class="form-row"><label>Telefon<input type="tel" name="telefon" autocomplete="tel"></label><label>Služba<select name="sluzba"><option value="">Vyberte službu</option><?php foreach ($site['services'] as $slug => $item): ?><option value="<?= e($item['title']) ?>" <?= $selectedService === $slug ? 'selected' : '' ?>><?= e($item['title']) ?></option><?php endforeach; ?></select></label></div>
<label>Zpráva<textarea name="zprava" rows="7" required placeholder="Termín, místo, typ akce a vaše představa..."></textarea></label>
<label class="consent"><input type="checkbox" required> Souhlasím se zpracováním údajů za účelem vyřízení poptávky.</label>
<button class="button" type="submit">Odeslat poptávku</button>
</form>
</div></section>
