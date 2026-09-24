#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const contentPath = resolve(projectRoot, process.argv[2] || 'content/site-content.json');
const content = JSON.parse(readFileSync(contentPath, 'utf8'));

const metaSelectors = new Map([
    ['meta[name="description"]', ['name', 'description']],
    ['meta[property="og:title"]', ['property', 'og:title']],
    ['meta[property="og:description"]', ['property', 'og:description']],
    ['meta[property="og:url"]', ['property', 'og:url']],
    ['meta[property="og:image"]', ['property', 'og:image']],
    ['meta[property="og:image:secure_url"]', ['property', 'og:image:secure_url']],
    ['meta[name="twitter:title"]', ['name', 'twitter:title']],
    ['meta[name="twitter:description"]', ['name', 'twitter:description']],
    ['meta[name="twitter:image"]', ['name', 'twitter:image']]
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeAttribute = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const escapeText = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

function replaceTagAttribute(html, tag, matchAttribute, matchValue, targetAttribute, value) {
    const pattern = new RegExp(`<${escapeRegExp(tag)}\\b[^>]*\\b${escapeRegExp(matchAttribute)}\\s*=\\s*"${escapeRegExp(matchValue)}"[^>]*>`, 'i');
    return html.replace(pattern, (tagHtml) => {
        const attributePattern = new RegExp(`(\\b${escapeRegExp(targetAttribute)}\\s*=\\s*)".*?"`, 'i');
        const escaped = escapeAttribute(value);
        return attributePattern.test(tagHtml)
            ? tagHtml.replace(attributePattern, `$1"${escaped}"`)
            : `${tagHtml.slice(0, -1)} ${targetAttribute}="${escaped}">`;
    });
}

function applyRecord(html, record) {
    const selector = String(record?.selector || '');
    const property = String(record?.property || '');
    const value = String(record?.value || '');

    if (selector === 'title' && property === 'title') {
        return html.replace(/(<title\b[^>]*>).*?(<\/title>)/is, `$1${escapeText(value)}$2`);
    }
    if (selector === 'link[rel="canonical"]' && property === 'href') {
        return replaceTagAttribute(html, 'link', 'rel', 'canonical', 'href', value);
    }
    if (metaSelectors.has(selector) && property === 'content') {
        const [matchAttribute, matchValue] = metaSelectors.get(selector);
        return replaceTagAttribute(html, 'meta', matchAttribute, matchValue, 'content', value);
    }
    if (selector === 'script[type="application/ld+json"]' && property === 'json-ld') {
        let normalized;
        try {
            const decoded = JSON.parse(value);
            if (!decoded || typeof decoded !== 'object') return html;
            normalized = JSON.stringify(decoded, null, 2);
        } catch {
            return html;
        }
        const target = Math.max(0, Number.parseInt(record?.node || 0, 10));
        let seen = 0;
        return html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>).*?(<\/script>)/gis, (match, opening, closing) => {
            if (seen++ !== target) return match;
            return `${opening}\n${normalized}\n${closing}`;
        });
    }
    return html;
}

let changedPages = 0;
let changedRecords = 0;
const globalRecords = Array.isArray(content?.pages?.['*']) ? content.pages['*'] : [];

for (const [page, pageRecords] of Object.entries(content?.pages || {})) {
    if (page === '*' || !Array.isArray(pageRecords) || !/^[a-z0-9][a-z0-9._/-]*\.html$/i.test(page) || page.includes('..')) continue;
    const pagePath = resolve(projectRoot, page);
    if (isAbsolute(page) || relative(projectRoot, pagePath).startsWith('..') || !existsSync(pagePath)) continue;

    const original = readFileSync(pagePath, 'utf8');
    let html = original;
    for (const record of [...globalRecords, ...pageRecords]) {
        const before = html;
        html = applyRecord(html, record);
        if (html !== before) changedRecords++;
    }
    if (html !== original) {
        writeFileSync(pagePath, html, 'utf8');
        changedPages++;
    }
}

console.log(`SEO z administrace: ${changedPages} změněných stránek, ${changedRecords} změněných údajů.`);
