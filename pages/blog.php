<?php
$articles = [
    ['label' => 'Průvodce', 'title' => 'Jak vybrat svatebního kameramana', 'text' => 'Na co se ptát, co má obsahovat nabídka a jak poznat styl, který vám bude sedět i za deset let.', 'route' => 'svatby', 'link' => 'Prohlédnout svatební tvorbu'],
    ['label' => 'Reality', 'title' => 'Proč profesionální video pomáhá prodeji', 'text' => 'Jak správně představit prostor, lokalitu a atmosféru nemovitosti v krátkém a účinném formátu.', 'route' => 'reality', 'link' => 'Zjistit více o videu pro reality'],
    ['label' => 'Firemní video', 'title' => 'Co připravit před natáčením', 'text' => 'Praktický checklist od cíle videa přes scénář až po lidi, lokace a distribuci výsledku.', 'route' => 'promo', 'link' => 'Prohlédnout promo produkci'],
];
?>
<section class="page-hero compact">
    <div class="container page-hero-content" data-reveal>
        <span class="eyebrow"><i></i> Tips and backstage</span>
        <h1>Blog</h1>
        <p>Připravujeme praktické články o videoprodukci, plánování svatby, prezentaci nemovitostí a tvorbě firemního obsahu.</p>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="article-grid">
            <?php foreach ($articles as $article): ?>
                <article data-reveal>
                    <span><?= e($article['label']) ?></span>
                    <h2><?= e($article['title']) ?></h2>
                    <p><?= e($article['text']) ?></p>
                    <span class="article-status">Článek připravujeme</span>
                    <p><a class="text-link" href="/<?= e($article['route']) ?>"><?= e($article['link']) ?> →</a></p>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="final-cta compact-cta" data-reveal>
    <div class="final-cta-ring" aria-hidden="true"></div>
    <div class="container final-cta-inner">
        <span class="eyebrow"><i></i> Ask the studio</span>
        <h2>Potřebujete poradit<br><span class="gold-text">s konkrétním projektem?</span></h2>
        <p>Napište nám, co plánujete. Doporučíme vhodný rozsah, postup i formát výsledku.</p>
        <a class="button gold-button" href="/kontakt"><span>Probrat projekt</span></a>
    </div>
</section>
