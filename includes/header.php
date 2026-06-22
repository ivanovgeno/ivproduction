<?php
/** @var array $site */
/** @var string $route */
/** @var string $pageTitle */
?>
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#050607">
    <title><?= e($pageTitle) ?> | <?= e($site['name']) ?></title>
    <meta name="description" content="Profesionální video produkce, svatební filmy, firemní video, fotobudky a 360° video koutek. Hradec Králové a celá ČR.">
    <link rel="icon" href="/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/app.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/cinematic.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/forms-services.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/signature-v3.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/polish-v4.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/camera-choreography-v4.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/ux-fixes-v4.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/camera-fix-v5.css?v=20260622-camera6">
    <link rel="stylesheet" href="/assets/css/camera-layer-v6.css?v=20260622-camera6-1">
</head>
<body class="route-<?= e($route === '' ? 'home' : $route) ?>">
<a class="skip-link" href="#main-content">Přeskočit na obsah</a>
<div class="site-grain" aria-hidden="true"></div>
<div class="cursor-glow" aria-hidden="true" data-cursor-glow></div>
<div class="page-loader" data-loader aria-hidden="true">
    <div class="loader-mark"><span></span><span></span><span></span></div>
    <p>IV PRODUCTION</p>
</div>
<header class="site-header" data-header>
    <div class="container header-inner">
        <a class="brand" href="/" aria-label="IV Production – domů" <?= $route === '' ? 'aria-current="page"' : '' ?>>
            <img src="/logo-light.png" alt="IV Production">
        </a>
        <div class="header-tagline" aria-hidden="true">Film · Experience · Emotion</div>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle aria-label="Otevřít menu">
            <span></span><span></span><span></span>
        </button>
        <nav class="main-nav" id="main-nav" data-menu aria-label="Hlavní navigace">
            <a class="<?= is_active('svatby') ? 'active' : '' ?>" href="/svatby" <?= is_active('svatby') ? 'aria-current="page"' : '' ?>>Svatby</a>
            <a class="<?= is_active('reality') ? 'active' : '' ?>" href="/reality" <?= is_active('reality') ? 'aria-current="page"' : '' ?>>Reality</a>
            <a class="<?= is_active('plesy') ? 'active' : '' ?>" href="/plesy" <?= is_active('plesy') ? 'aria-current="page"' : '' ?>>Eventy</a>
            <a class="<?= is_active('fotobudka') ? 'active' : '' ?>" href="/fotobudka" <?= is_active('fotobudka') ? 'aria-current="page"' : '' ?>>Fotobudka</a>
            <a class="<?= is_active('360budka') ? 'active' : '' ?>" href="/360budka" <?= is_active('360budka') ? 'aria-current="page"' : '' ?>>360°</a>
            <a class="<?= is_active('portfolio') ? 'active' : '' ?>" href="/portfolio" <?= is_active('portfolio') ? 'aria-current="page"' : '' ?>>Portfolio</a>
            <a class="button button-small gold-button" href="/kontakt" <?= is_active('kontakt') ? 'aria-current="page"' : '' ?>><span>Poptat projekt</span></a>
        </nav>
    </div>
</header>
<main id="main-content" tabindex="-1">
