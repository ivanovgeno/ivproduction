#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const origin = 'https://www.ivproduction.cz';
const errors = [];
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
const social = readJson('content/social-meta.seed.json').items || {};
const blogPosts = (readJson('content/blog-posts.seed.json').posts || []).filter((post) => (post.status || 'published') === 'published');
const blogByRoute = new Map(blogPosts.map((post) => [post.path || `/clanky/${post.slug}/`, post]));

for (const route of routes) {
    const item = social[route] || blogByRoute.get(route);
    if (!item) {
        errors.push(`${route}: stránka nemá nastavení sociální karty ani publikovaný článek`);
        continue;
    }
    const title = String(item.title || '').trim();
    const description = String(item.description || item.metaDescription || item.excerpt || '').trim();
    const image = String(item.image || '').trim();
    const imageAlt = String(item.imageAlt || title).trim();
    if (!title) errors.push(`${route}: chybí titulek sociální karty`);
    if (title.length > 110) errors.push(`${route}: titulek je delší než 110 znaků`);
    if (!description) errors.push(`${route}: chybí popis sociální karty`);
    if (description.length > 240) errors.push(`${route}: popis je delší než 240 znaků`);
    if (!image) errors.push(`${route}: chybí obrázek sociální karty`);
    if (!imageAlt) errors.push(`${route}: chybí popis obrázku sociální karty`);
    if (image.startsWith('/')) {
        const imagePath = path.join(root, decodeURIComponent(image).replace(/^\//, ''));
        if (!fs.existsSync(imagePath)) errors.push(`${route}: obrázek ${image} neexistuje`);
    } else if (!image.startsWith('https://')) {
        errors.push(`${route}: obrázek musí být lokální cesta nebo HTTPS URL`);
    }
}

for (const route of Object.keys(social)) {
    if (!routes.includes(route)) errors.push(`${route}: nastavení sociální karty neodpovídá žádné URL v sitemapě`);
}

const titles = Object.values(social).map((item) => String(item.title || '').trim()).filter(Boolean);
if (new Set(titles).size !== titles.length) errors.push('Hlavní stránky používají duplicitní titulky sociálních karet.');
if (!fs.existsSync(path.join(root, 'page.php'))) errors.push('Chybí serverový renderer page.php.');
if (!fs.readFileSync(path.join(root, '.htaccess'), 'utf8').includes('page.php?file=')) errors.push('.htaccess nepředává veřejné stránky rendereru sociálních metadat.');

if (errors.length) {
    console.error(`Kontrola sociálního sdílení selhala (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Sociální sdílení: ${routes.length} veřejných URL má vlastní titulek, popis a obrázek.`);
console.log(`Přednastavení hlavních stránek: ${Object.keys(social).length}; publikované články: ${blogByRoute.size}.`);
