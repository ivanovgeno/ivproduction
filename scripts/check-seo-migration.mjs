#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root = process.argv[2] ? path.resolve(process.argv[2]) : sourceRoot;
const origin = 'https://www.ivproduction.cz';
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const htaccess = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');
const errors = [];
const warnings = [];

if (/^\s*Options\b[^\r\n]*\bMultiViews\b/im.test(htaccess)) {
    fail('WEDOS nepovoluje Options MultiViews; tento příkaz způsobí chybu HTTP 500.');
}

const specialFiles = new Map([
    ['/', 'index.html'],
    ['/ivbudka/', 'fotobudka.html'],
    ['/ivbudka360/', '360budka.html'],
    ['/aftermovie-promo-hudebniklipy/', 'promo.html'],
    ['/ukazky/', 'portfolio.html'],
    ['/svatebni-blog/', 'blog.html']
]);

const oldRedirects = new Map([
    ['/predsvatebni-videa/', '/svatby/'],
    ['/svatebni-videa/', '/svatby/'],
    ['/video/', '/ukazky/'],
    ['/fotokoutky/', '/ivbudka/'],
    ['/pozadi/', '/ivbudka/'],
    ['/spoluprace/', '/ukazky/'],
    ['/rezervacenasvatbu/', '/kontakt/#poptavka'],
    ['/evidenceplesu/', '/plesy/']
]);

const preservedOldRoutes = [
    '/', '/kontakt/', '/svatby/', '/svatebni-blog/', '/plesy/', '/reality/',
    '/tehotenska-a-newborn-videa/', '/aftermovie-promo-hudebniklipy/',
    '/ivbudka/', '/ukazky/', '/ivbudka360/', '/ivshop/',
    '/l/planovani-svatby-cim-zacit/', '/l/vyber-svatebniho-mista/',
    '/l/typy-svatebniho-obradu/',
    '/l/dodavatele-aneb-koho-vsechno-potrebujete-na-sve-svatbe/',
    '/l/instax-nebo-fotokoutek-tot-otazka/'
];

function routeFile(route) {
    if (specialFiles.has(route)) return specialFiles.get(route);
    if (route.startsWith('/l/')) return `${route.slice(1)}index.html`;
    return `${route.replace(/^\//, '').replace(/\/$/, '')}.html`;
}

function fail(message) {
    errors.push(message);
}

function localPath(value) {
    const url = new URL(value, origin);
    return decodeURIComponent(url.pathname);
}

const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (!urls.length) fail('Sitemap neobsahuje žádné URL.');
if (new Set(urls).size !== urls.length) fail('Sitemap obsahuje duplicitní URL.');

const routes = new Set(urls.map((value) => new URL(value).pathname));
for (const route of preservedOldRoutes) {
    if (!routes.has(route)) fail(`${route}: historická Webnode URL není zachovaná v sitemapě`);
}
if (preservedOldRoutes.length + oldRedirects.size !== 25) fail('Migrační mapa nepokrývá přesně 25 původních Webnode URL.');
if (process.argv[3]) {
    const legacySitemap = fs.readFileSync(path.resolve(process.argv[3]), 'utf8');
    const legacyRoutes = [...legacySitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
    const mappedRoutes = new Set([...preservedOldRoutes, ...oldRedirects.keys()]);
    for (const route of legacyRoutes) if (!mappedRoutes.has(route)) fail(`${route}: původní sitemap URL nemá migrační řešení`);
    for (const route of mappedRoutes) if (!legacyRoutes.includes(route)) fail(`${route}: migrační mapa nesouhlasí s původní sitemapou`);
}

for (const absoluteUrl of urls) {
    const url = new URL(absoluteUrl);
    const route = url.pathname;
    const relativeFile = routeFile(route);
    const file = path.join(root, relativeFile);
    if (!fs.existsSync(file)) {
        fail(`${route}: chybí zdrojový soubor ${relativeFile}`);
        continue;
    }

    const html = fs.readFileSync(file, 'utf8');
    const expected = `${origin}${route}`;
    const canonicals = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
    if (canonicals.length !== 1) fail(`${route}: očekávána právě jedna canonical URL, nalezeno ${canonicals.length}`);
    else if (canonicals[0] !== expected) fail(`${route}: canonical ${canonicals[0]} neodpovídá ${expected}`);

    const ogUrl = html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    if (ogUrl && ogUrl !== expected) fail(`${route}: og:url ${ogUrl} neodpovídá canonical ${expected}`);
    for (const match of html.matchAll(/<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)) {
        if (match[1].startsWith(origin + '/') && !fs.existsSync(path.join(root, localPath(match[1]).slice(1)))) fail(`${route}: chybí obrázek náhledu pro sdílení ${match[1]}`);
    }

    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim();
    const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1].trim();
    const h1Count = [...html.matchAll(/<h1\b/gi)].length;
    if (!title) fail(`${route}: chybí title`);
    if (!description) fail(`${route}: chybí meta description`);
    if (h1Count !== 1) fail(`${route}: očekáváno jedno H1, nalezeno ${h1Count}`);
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) fail(`${route}: indexovaná stránka obsahuje noindex`);
    if (/<base\b/i.test(html)) fail(`${route}: produkční stránka nesmí spoléhat na base URL`);

    for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            JSON.parse(script[1]);
        } catch (error) {
            fail(`${route}: neplatné JSON-LD (${error.message})`);
        }
    }

    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicateIds.length) fail(`${route}: duplicitní ID ${duplicateIds.join(', ')}`);

    for (const match of html.matchAll(/\b(href|src|action|poster|data-video)=(['"])(.*?)\2/gi)) {
        const attribute = match[1].toLowerCase();
        const value = match[3].trim();
        if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
        if (value.startsWith('#')) {
            const id = decodeURIComponent(value.slice(1));
            if (id && !ids.includes(id)) fail(`${route}: kotva ${value} nemá odpovídající ID`);
            continue;
        }
        if (!value.startsWith('/')) {
            fail(`${route}: relativní ${attribute}="${value}" by se na čisté URL načetl z nesprávné složky`);
            continue;
        }

        const pathname = localPath(value);
        if (attribute === 'href' && (routes.has(pathname) || oldRedirects.has(pathname))) {
            const hash = new URL(value, origin).hash.slice(1);
            if (hash && routes.has(pathname)) {
                const targetHtml = pathname === route ? html : fs.readFileSync(path.join(root, routeFile(pathname)), 'utf8');
                const targetIds = [...targetHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map((item) => item[1]);
                if (!targetIds.includes(decodeURIComponent(hash))) fail(`${route}: odkaz ${value} míří na neexistující kotvu`);
            }
            continue;
        }

        const diskPath = path.join(root, pathname.replace(/^\//, ''));
        if (!fs.existsSync(diskPath)) fail(`${route}: ${attribute}="${value}" odkazuje na chybějící lokální cíl`);
    }

    for (const match of html.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/gi)) {
        const value = match[2];
        if (/^(?:https?:|data:|#)/i.test(value)) continue;
        if (!value.startsWith('/')) fail(`${route}: relativní CSS url(${value}) by se načetla z nesprávné složky`);
        else if (!fs.existsSync(path.join(root, value.replace(/^\//, '')))) fail(`${route}: CSS url(${value}) odkazuje na chybějící soubor`);
    }
}

for (const [source, destination] of oldRedirects) {
    const sourceToken = source.replace(/^\//, '').replace(/\/$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(sourceToken).test(htaccess)) fail(`${source}: v .htaccess chybí stará adresa`);
    if (!htaccess.includes(`${origin}${destination}`)) fail(`${source}: v .htaccess chybí přímý cíl ${destination}`);
}

const portfolio = fs.readFileSync(path.join(root, 'portfolio-data.js'), 'utf8');
const videoIds = [...portfolio.matchAll(/youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]+)/g)].map((match) => match[1]);
if (videoIds.length < 6) fail('Portfolio obsahuje méně než šest video ukázek.');
if (new Set(videoIds).size !== videoIds.length) fail('Portfolio obsahuje duplicitní YouTube video.');

if (!/Disallow:\s*\/admin\//i.test(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'))) warnings.push('robots.txt neblokuje administraci.');

if (errors.length) {
    console.error(`SEO kontrola selhala (${errors.length}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`SEO kontrola OK: ${urls.length} canonical URL, ${preservedOldRoutes.length} zachovaných Webnode URL, ${oldRedirects.size} přímých 301 mapování, ${videoIds.length} unikátních videí.`);
warnings.forEach((warning) => console.warn(`Upozornění: ${warning}`));
