<?php
require __DIR__ . '/inc/bootstrap.php';
ivp_require_auth();
$config = ivp_config();
?>
<!doctype html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>Administrace | Iv Production</title>
    <link rel="stylesheet" href="assets/admin.css?v=20260902-team-photo-fix-1">
</head>
<body class="admin-app" data-csrf="<?= htmlspecialchars(ivp_csrf(), ENT_QUOTES) ?>">
<div class="admin-shell">
    <aside class="sidebar" id="sidebar">
        <a class="brand" href="index.php"><img src="../logo-light.png" alt="Iv Production"><span>Správa webu</span></a>
        <nav aria-label="Administrace">
            <button class="nav-item is-active" data-view="dashboard"><span aria-hidden="true">⌂</span>Přehled</button>
            <button class="nav-item" data-view="content"><span aria-hidden="true">✎</span>Vizuální editor</button>
            <button class="nav-item" data-view="media"><span aria-hidden="true">▧</span>Média</button>
            <button class="nav-item" data-view="videos"><span aria-hidden="true">▶</span>Portfolio</button>
            <button class="nav-item" data-view="blog"><span aria-hidden="true">▤</span>Blog</button>
            <button class="nav-item" data-view="history"><span aria-hidden="true">↶</span>Historie</button>
            <button class="nav-item" data-view="security"><span aria-hidden="true">⚿</span>Přístup</button>
        </nav>
        <div class="sidebar-bottom">
            <a href="../" target="_blank" rel="noopener">Otevřít web ↗</a>
            <a href="logout.php">Odhlásit se</a>
        </div>
    </aside>

    <main class="workspace">
        <header class="topbar">
            <button class="menu-button" id="adminMenu" aria-label="Otevřít navigaci">☰</button>
            <div><h1 id="viewTitle">Přehled</h1><p id="viewSubtitle">Vyberte, co chcete na webu upravit.</p></div>
            <div class="topbar-actions">
                <span class="save-state" id="saveState">Vše uloženo</span>
                <a id="topPreview" class="button ghost top-preview" target="_blank" rel="noopener">Otevřít web ↗</a>
                <button class="button primary top-save" id="topSaveContent" disabled>Uložit změny</button>
            </div>
        </header>

        <section class="view is-active" data-panel="dashboard">
            <?php if (!empty($config['force_password_change'])): ?>
            <div class="notice warning"><strong>Změňte úvodní heslo.</strong><span>Než začnete upravovat web, nastavte si vlastní heslo v části Přístup.</span><button data-go="security">Změnit heslo</button></div>
            <?php endif; ?>
            <div class="welcome-card">
                <div><h2>Co chcete dnes upravit?</h2><p>Obsah měníte přímo nad skutečným náhledem webu. Fotografie můžete nahrát a rovnou přiřadit k týmu, technice, hero sekci nebo jinému místu.</p></div>
                <button class="button primary" data-go="content" data-page="index.html">Otevřít vizuální editor</button>
            </div>
            <div class="task-grid">
                <button data-go="content" data-page="index.html"><span class="task-icon">✎</span><strong>Upravit stránku</strong><small>Texty, tlačítka a fotografie přímo v náhledu.</small></button>
                <button data-go="media"><span class="task-icon">▧</span><strong>Nahrát fotografie</strong><small>Nahrajte soubor a vyberte, kde se na webu zobrazí.</small></button>
                <button data-go="videos"><span class="task-icon">▶</span><strong>Přidat video</strong><small>Správa projektů a pořadí v portfoliu.</small></button>
                <button data-go="blog"><span class="task-icon">▤</span><strong>Napsat článek</strong><small>Vytvoření, úpravy a publikování blogu.</small></button>
            </div>
            <div class="dashboard-status"><div><span>Spravované stránky</span><strong id="pageCount">—</strong></div><div><span>Poslední změna</span><strong id="lastUpdate">—</strong></div><div><span>Automatické zálohy</span><strong>Zapnuté</strong></div></div>
        </section>

        <section class="view visual-view" data-panel="content">
            <div class="visual-toolbar">
                <label class="select-control"><span class="sr-only">Stránka</span><select id="pageSelect"></select></label>
                <div class="device-switcher" role="group" aria-label="Velikost náhledu"><button class="is-active" data-device="desktop" title="Počítač" aria-label="Náhled pro počítač">▰</button><button data-device="tablet" title="Tablet" aria-label="Náhled pro tablet">▯</button><button data-device="mobile" title="Mobil" aria-label="Náhled pro mobil">▯</button></div>
                <label class="visual-search"><span class="sr-only">Hledat sekci</span><input id="sectionSearch" type="search" placeholder="Hledat sekci…"></label>
            </div>
            <div class="visual-editor-shell">
                <nav class="visual-section-list" id="sectionNav" aria-label="Sekce stránky"><div class="loading">Načítám sekce…</div></nav>
                <div class="preview-stage"><div class="preview-browser-bar"><span></span><span></span><span></span><strong id="previewAddress">www.ivproduction.cz</strong></div><div class="preview-frame-wrap is-desktop" id="previewFrameWrap"><iframe id="visualPreview" title="Živý náhled stránky"></iframe></div></div>
                <aside class="section-inspector" id="sectionInspector"><div class="inspector-empty"><strong>Vyberte sekci</strong><p>Klikněte vlevo například na Hero, Služby, Tým nebo Techniku.</p></div></aside>
            </div>
            <div class="visual-savebar"><span id="changeCount">Žádné neuložené změny</span><div><button class="button ghost" id="discardContent" disabled>Zahodit změny</button><button class="button primary" id="saveContent" disabled>Uložit změny</button></div></div>
        </section>

        <section class="view" data-panel="media">
            <div class="view-heading"><div><h2>Média</h2><p>Nahrajte fotografie a videa a rovnou je přiřaďte na web.</p></div><label class="button primary upload-button">Nahrát soubory<input type="file" id="mediaFileTop" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple></label></div>
            <form id="uploadForm" class="media-dropzone"><input type="file" id="mediaFile" name="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required><label for="mediaFile"><span class="drop-icon">⇧</span><strong>Přetáhněte fotku nebo video sem</strong><small>Obrázky převedeme do WebP automaticky.</small></label><button class="button ghost" type="submit">Vybrat soubor</button></form>
            <div class="media-toolbar"><label class="search-control"><span>⌕</span><input id="mediaSearch" type="search" placeholder="Hledat soubor…"></label><div class="filter-tabs" id="mediaFilters"><button class="is-active" data-filter="all">Vše</button><button data-filter="image">Obrázky</button><button data-filter="video">Videa</button></div><select id="mediaSort" aria-label="Řazení médií"><option value="newest">Nejnovější</option><option value="oldest">Nejstarší</option><option value="name">Podle názvu</option></select></div>
            <div class="media-grid" id="mediaGrid"><div class="loading">Načítám média…</div></div>
        </section>

        <section class="view" data-panel="videos">
            <div class="view-heading"><div><h2>Portfolio</h2><p id="portfolioCount">Načítám projekty…</p></div><button class="button primary" id="addVideo">＋ Přidat video</button></div>
            <div class="list-toolbar"><label class="search-control"><span>⌕</span><input id="portfolioSearch" type="search" placeholder="Hledat projekt…"></label><select id="portfolioFilter"><option value="">Všechny kategorie</option></select><button class="button ghost" id="saveVideos" disabled>Uložit pořadí</button></div>
            <div class="portfolio-list" id="videoProjects"><div class="loading">Načítám portfolio…</div></div>
        </section>

        <section class="view" data-panel="blog">
            <div class="view-heading"><div><h2>Blog</h2><p>Správa článků</p></div><button class="button primary" id="addBlogPost">＋ Nový článek</button></div>
            <div class="blog-toolbar"><label class="search-control"><span>⌕</span><input id="blogSearch" type="search" placeholder="Hledat článek…"></label><select id="blogCategoryFilter"><option value="">Všechny kategorie</option></select><div class="blog-status-tabs" id="blogStatusTabs"><button class="is-active" data-status="">Vše</button><button data-status="published">Publikované</button><button data-status="draft">Koncepty</button></div></div>
            <div class="blog-list-head"><span>Článek</span><span>Kategorie</span><span>Datum publikace</span><span>Stav</span><span>Akce</span></div><div class="blog-list" id="blogList"><div class="loading">Načítám články…</div></div>
        </section>

        <section class="view" data-panel="history"><div class="view-heading"><div><h2>Historie změn</h2><p>Před každým uložením automaticky vytváříme zálohu.</p></div><button class="button ghost" id="refreshHistory">Obnovit</button></div><div class="history-list" id="historyList"></div></section>

        <section class="view" data-panel="security"><div class="settings-card"><h2>Změna přístupových údajů</h2><form id="passwordForm" class="form-stack"><label>Současné heslo<input type="password" name="currentPassword" autocomplete="current-password" required></label><label>Nové heslo<input type="password" name="newPassword" autocomplete="new-password" minlength="12" required><small>Minimálně 12 znaků, velké i malé písmeno a číslo.</small></label><label>Nové heslo znovu<input type="password" name="confirmPassword" autocomplete="new-password" required></label><button class="button primary" type="submit">Změnit heslo</button></form></div></section>
    </main>
</div>

<div class="drawer-backdrop" id="drawerBackdrop" hidden></div>

<aside class="side-drawer" id="mediaAssignDrawer" aria-hidden="true" aria-labelledby="mediaAssignTitle"><header><div><h2 id="mediaAssignTitle">Použít médium</h2><p>Vyberte přesně, kde se má soubor zobrazit.</p></div><button class="icon-button" data-close-drawer aria-label="Zavřít">×</button></header><form id="mediaAssignForm" class="drawer-form"><div class="assignment-preview" id="mediaAssignPreview"></div><label>Stránka<select id="assignPage"></select></label><label>Sekce<select id="assignSection"></select></label><label>Umístění<select id="assignTarget"></select></label><div class="assignment-location" id="assignmentLocation"></div><p class="drawer-help">Po uložení bude médium ihned použité na vybraném místě webu.</p><div class="drawer-footer"><button type="button" class="button ghost" data-close-drawer>Zrušit</button><button type="submit" class="button primary">Přiřadit a uložit</button></div></form></aside>

<aside class="side-drawer" id="videoDrawer" aria-hidden="true" aria-labelledby="videoDrawerTitle"><header><div><h2 id="videoDrawerTitle">Nové video</h2><p id="videoDrawerSubtitle">Vyplňte údaje a projekt rovnou publikujte.</p></div><button class="icon-button" data-close-drawer aria-label="Zavřít">×</button></header><form id="videoEditor" class="drawer-form"><input type="hidden" id="videoEditIndex" value="-1"><label>Název projektu <span>*</span><input id="videoTitle" required maxlength="240" placeholder="Např. Jana & Petr · 14. 6. 2026"></label><label>Typ projektu<input id="videoLabel" maxlength="160" placeholder="Např. Svatební film"></label><fieldset><legend>Kategorie <span>*</span></legend><div class="category-options" id="videoCategories"></div></fieldset><label>YouTube odkaz nebo video <span>*</span><input id="videoUrl" required placeholder="https://youtu.be/… nebo /assets/uploads/video.mp4"></label><div class="media-actions"><button type="button" class="button ghost" id="chooseVideoFile">Vybrat nahrané video</button><label class="button ghost upload-button">Nahrát MP4<input type="file" id="uploadPortfolioVideo" accept="video/mp4,video/webm"></label></div><div class="video-live-preview" id="videoLivePreview"><span>Náhled se zobrazí po vložení odkazu.</span></div><label>Náhledový obrázek <span>*</span><input id="videoImage" required placeholder="/assets/uploads/nahled.webp"></label><div class="media-actions"><button type="button" class="button ghost" id="chooseVideoImage">Vybrat z médií</button><label class="button ghost upload-button">Nahrát nový<input type="file" id="uploadVideoImage" accept="image/jpeg,image/png,image/webp,image/gif"></label></div><div class="media-picker" id="videoMediaPicker" hidden></div><label>Popis obrázku<input id="videoAlt" maxlength="400" placeholder="Krátký popis pro přístupnost"></label><div class="drawer-footer"><button type="button" class="button ghost" data-close-drawer>Zrušit</button><button type="submit" class="button primary" id="submitVideoEditor">Přidat do portfolia</button></div></form></aside>

<aside class="side-drawer blog-drawer" id="blogDrawer" aria-hidden="true" aria-labelledby="blogDrawerTitle"><header><div><h2 id="blogDrawerTitle">Nový článek</h2><p>Článek můžete uložit jako koncept nebo rovnou publikovat.</p></div><button class="icon-button" data-close-drawer aria-label="Zavřít">×</button></header><form id="blogEditor" class="drawer-form"><input type="hidden" id="blogId"><label>Název článku <span>*</span><input id="blogTitle" required maxlength="180"></label><label>Adresa článku <span>*</span><div class="slug-field"><span>/clanky/</span><input id="blogSlug" required pattern="[a-z0-9-]+"><span>/</span></div><small id="blogPathHelp">Adresa vznikne automaticky z názvu a můžete ji upravit před publikováním.</small></label><div class="form-columns"><label>Kategorie<select id="blogCategory"><option>Svatby</option><option>Reality</option><option>Firemní video</option><option>Promo</option><option>Tipy a triky</option><option>Technika</option><option>Fotobudka</option></select></label><label>Datum publikace<input id="blogPublishedAt" type="date" required></label></div><label>Krátký úvod <span>*</span><textarea id="blogExcerpt" rows="4" required maxlength="700"></textarea></label><label>Titulek pro Google<input id="blogSeoTitle" maxlength="220"><small>Pokud necháte prázdné, použije se název článku.</small></label><label>Popis pro Google<textarea id="blogMetaDescription" rows="3" maxlength="320"></textarea></label><label>Titulní fotografie <span>*</span><input id="blogImage" required placeholder="/assets/uploads/fotografie.webp"></label><div class="blog-image-preview" id="blogImagePreview"><span>Vyberte titulní fotografii.</span></div><div class="media-actions"><button type="button" class="button ghost" id="chooseBlogImage">Vybrat z médií</button><label class="button ghost upload-button">Nahrát nový<input type="file" id="uploadBlogImage" accept="image/jpeg,image/png,image/webp,image/gif"></label></div><div class="media-picker" id="blogMediaPicker" hidden></div><label>Popis fotografie<input id="blogImageAlt" maxlength="300"></label><label>Obsah článku <span>*</span></label><div class="rich-editor"><div class="rich-toolbar" role="toolbar" aria-label="Formátování článku"><button type="button" data-format="bold"><strong>B</strong></button><button type="button" data-format="italic"><em>I</em></button><button type="button" data-block="h2">H2</button><button type="button" data-block="h3">H3</button><button type="button" data-format="insertUnorderedList">• Seznam</button><button type="button" data-format="createLink">Odkaz</button></div><div id="blogBody" class="rich-body" contenteditable="true" data-placeholder="Začněte psát obsah článku…"></div></div><label class="checkbox-row"><input id="blogFeatured" type="checkbox"> Doporučený článek na začátku blogu</label><div class="danger-row"><button type="button" id="deleteBlogPost">Smazat článek</button></div><div class="drawer-footer"><button type="button" class="button ghost" id="saveBlogDraft">Uložit koncept</button><button type="submit" class="button primary">Publikovat změny</button></div></form></aside>

<div class="modal-backdrop" id="mediaPickerModal" hidden><div class="media-modal" role="dialog" aria-modal="true" aria-labelledby="mediaPickerTitle"><header><div><h2 id="mediaPickerTitle">Vybrat z médií</h2><p>Klikněte na obrázek, který chcete použít.</p></div><button class="icon-button" id="closeMediaPicker" aria-label="Zavřít">×</button></header><label class="search-control"><span>⌕</span><input id="mediaPickerSearch" type="search" placeholder="Hledat obrázek…"></label><div class="media-picker-grid" id="mediaPickerGrid"></div></div></div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="assets/admin.js?v=20260902-team-photo-fix-1"></script>
</body>
</html>
