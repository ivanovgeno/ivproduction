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
    { path: '/svatby.html', file: 'svatby.html', changefreq: 'monthly', priority: '0.9' },
    { path: '/reality.html', file: 'reality.html', changefreq: 'monthly', priority: '0.9' },
    { path: '/promo.html', file: 'promo.html', changefreq: 'monthly', priority: '0.9' },
    { path: '/plesy.html', file: 'plesy.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/konference.html', file: 'konference.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/podcast.html', file: 'podcast.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/fotobudka.html', file: 'fotobudka.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/360budka.html', file: '360budka.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/reels.html', file: 'reels.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/portfolio.html', file: 'portfolio.html', changefreq: 'weekly', priority: '0.8' },
    { path: '/blog.html', file: 'blog.html', changefreq: 'weekly', priority: '0.7' },
    { path: '/jak-vybrat-svatebniho-kameramana.html', file: 'jak-vybrat-svatebniho-kameramana.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/trendy-svatebni-video-2026.html', file: 'trendy-svatebni-video-2026.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/proc-video-pomaha-prodat-nemovitost.html', file: 'proc-video-pomaha-prodat-nemovitost.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/jak-pripravit-firemni-video.html', file: 'jak-pripravit-firemni-video.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/video-pro-socialni-site.html', file: 'video-pro-socialni-site.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/svatebni-lokace-kralovehradecky-kraj.html', file: 'svatebni-lokace-kralovehradecky-kraj.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/hudba-ve-videu.html', file: 'hudba-ve-videu.html', changefreq: 'yearly', priority: '0.7' },
    { path: '/kontakt.html', file: 'kontakt.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/kalkulacka.html', file: 'kalkulacka.html', changefreq: 'monthly', priority: '0.6' },
    { path: '/ochrana-osobnich-udaju.html', file: 'ochrana-osobnich-udaju.html', changefreq: 'yearly', priority: '0.3' },
    { path: '/obchodni-podminky.html', file: 'obchodni-podminky.html', changefreq: 'yearly', priority: '0.3' },
    { path: '/marketingovy-souhlas.html', file: 'marketingovy-souhlas.html', changefreq: 'yearly', priority: '0.3' }
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
