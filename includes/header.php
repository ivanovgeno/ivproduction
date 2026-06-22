<?php
/** @var array $site */
/** @var string $route */
/** @var string $pageTitle */
?>
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($pageTitle) ?> | <?= e($site['name']) ?></title>
    <meta name="description" content="Profesionální video produkce, svatební filmy, reality, eventy a fotobudky. Hradec Králové a celá ČR.">
    <link rel="icon" href="/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
<header class="site-header" data-header>
    <div class="container header-inner">
        <a class="brand" href="/" aria-label="IV Production – domů">
            <img src="/logo-light.png" alt="IV Production">
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle>
            <span></span><span></span><span></span>
        </button>
        <nav class="main-nav" id="main-nav" data-menu>
            <a class="<?= is_active('svatby') ? 'active' : '' ?>" href="/svatby">Svatby</a>
            <a class="<?= is_active('reality') ? 'active' : '' ?>" href="/reality">Reality</a>
            <a class="<?= is_active('plesy') ? 'active' : '' ?>" href="/plesy">Plesy</a>
            <a class="<?= is_active('fotobudka') ? 'active' : '' ?>" href="/fotobudka">Fotobudka</a>
            <a class="<?= is_active('360budka') ? 'active' : '' ?>" href="/360budka">360° budka</a>
            <a class="<?= is_active('portfolio') ? 'active' : '' ?>" href="/portfolio">Portfolio</a>
            <a class="<?= is_active('blog') ? 'active' : '' ?>" href="/blog">Blog</a>
            <a class="button button-small" href="/kontakt">Nezávazná poptávka</a>
        </nav>
    </div>
</header>
<main>
