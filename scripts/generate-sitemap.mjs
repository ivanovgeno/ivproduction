#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sitemapPath = join(projectRoot, 'sitemap.xml');
const today = new Date().toISOString().slice(0, 10);

const pages = [
    { path: '/', file: 'index.html', changefreq: 'weekly', priority: '1.0' },
    { path: '/svatby/', file: 'svatby.html', changefreq: 'monthly', priority: '0.9' },
    { path: '/reality/', file: 'reality.html', changefreq: 'monthly', priority: '0.9' },
    { path: '/aftermovie-promo-hudebniklipy/', file: 'promo.html', changefreq: 'monthly', priority: '0.9' },
    { path: '/plesy/', file: 'plesy.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/konference/', file: 'konference.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/podcast/', file: 'podcast.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/ivbudka/', file: 'fotobudka.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/ivbudka360/', file: '360budka.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/reels/', file: 'reels.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/tehotenska-a-newborn-videa/', file: 'tehotenska-a-newborn-videa.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/ivshop/', file: 'ivshop.html', changefreq: 'monthly', priority: '0.6' },
    { path: '/ukazky/', file: 'portfolio.html', changefreq: 'weekly', priority: '0.8' },
    { path: '/svatebni-blog/', file: 'blog.html', changefreq: 'weekly', priority: '0.7' },
    { path: '/jak-vybrat-svatebniho-kameramana/', file: 'jak-vybrat-svatebniho-kameramana.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/trendy-svatebni-video-2026/', file: 'trendy-svatebni-video-2026.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/proc-video-pomaha-prodat-nemovitost/', file: 'proc-video-pomaha-prodat-nemovitost.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/jak-pripravit-firemni-video/', file: 'jak-pripravit-firemni-video.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/video-pro-socialni-site/', file: 'video-pro-socialni-site.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/svatebni-lokace-kralovehradecky-kraj/', file: 'svatebni-lokace-kralovehradecky-kraj.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/hudba-ve-videu/', file: 'hudba-ve-videu.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/l/planovani-svatby-cim-zacit/', file: 'l/planovani-svatby-cim-zacit/index.html', changefreq: 'yearly', priority: '0.6' },
    { path: '/l/vyber-svatebniho-mista/', file: 'l/vyber-svatebniho-mista/index.html', changefreq: 'yearly', priority: '0.6' },
    { path: '/l/typy-svatebniho-obradu/', file: 'l/typy-svatebniho-obradu/index.html', changefreq: 'yearly', priority: '0.6' },
    { path: '/l/dodavatele-aneb-koho-vsechno-potrebujete-na-sve-svatbe/', file: 'l/dodavatele-aneb-koho-vsechno-potrebujete-na-sve-svatbe/index.html', changefreq: 'yearly', priority: '0.6' },
    { path: '/l/instax-nebo-fotokoutek-tot-otazka/', file: 'l/instax-nebo-fotokoutek-tot-otazka/index.html', changefreq: 'yearly', priority: '0.6' },
    { path: '/kontakt/', file: 'kontakt.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/ochrana-osobnich-udaju/', file: 'ochrana-osobnich-udaju.html', changefreq: 'yearly', priority: '0.3' },
    { path: '/obchodni-podminky/', file: 'obchodni-podminky.html', changefreq: 'yearly', priority: '0.3' },
    { path: '/marketingovy-souhlas/', file: 'marketingovy-souhlas.html', changefreq: 'yearly', priority: '0.3' }
];

function lastModified(file) {
    const diff = spawnSync('git', ['diff', '--quiet', '--', file], { cwd: projectRoot });
    if (diff.status === 1) return today;

    try {
        return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
            cwd: projectRoot,
            encoding: 'utf8'
        }).trim() || today;
    } catch {
        return today;
    }
}

const entries = pages.map((page) => [
    '    <url>',
    `        <loc>https://www.ivproduction.cz${page.path}</loc>`,
    `        <lastmod>${lastModified(page.file)}</lastmod>`,
    `        <changefreq>${page.changefreq}</changefreq>`,
    `        <priority>${page.priority}</priority>`,
    '    </url>'
].join('\n'));

const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    ''
].join('\n');

const previous = readFileSync(sitemapPath, 'utf8');
if (previous !== sitemap) {
    writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log('Sitemap byla aktualizována.');
} else {
    console.log('Sitemap je aktuální.');
}
