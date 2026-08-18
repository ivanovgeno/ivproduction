import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'release', 'wedos');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const pageFiles = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => {
    const pathname = new URL(match[1]).pathname.replace(/^\//, '');
    return pathname || 'index.html';
});

const rootFiles = new Set([
    ...pageFiles,
    '404.html', '.htaccess', 'robots.txt', 'sitemap.xml', 'kontakt-handler.php'
]);
const rootExtensions = new Set(['.css', '.js', '.json', '.webmanifest', '.ico', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.webm']);
const publicDirectories = new Set(['admin', 'api', 'assets', 'content', 'images', 'partners']);

function shouldCopy(relative, entry) {
    const parts = relative.split(path.sep);
    if (parts.some((part) => ['.git', '.github', 'release', 'scripts', 'tools', 'dist', 'zálohy'].includes(part))) return false;
    if (['.md', '.py', '.mjs', '.yml', '.yaml'].includes(path.extname(relative).toLowerCase())) return false;
    if (relative.endsWith('.gitkeep') || relative.endsWith('.example.php')) return false;
    if (parts.length === 1) return entry.isDirectory() ? publicDirectories.has(relative) : rootFiles.has(relative) || rootExtensions.has(path.extname(relative).toLowerCase());
    return publicDirectories.has(parts[0]);
}

function copyTree(sourceDir, relative = '') {
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
        const childRelative = path.join(relative, entry.name);
        if (!shouldCopy(childRelative, entry)) continue;
        const source = path.join(sourceDir, entry.name);
        const target = path.join(output, childRelative);
        if (entry.isDirectory()) {
            fs.mkdirSync(target, { recursive: true });
            copyTree(source, childRelative);
        } else {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.copyFileSync(source, target);
        }
    }
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
copyTree(root);

const copied = [];
function list(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) list(absolute);
        else copied.push(path.relative(output, absolute));
    }
}
list(output);

console.log(`WEDOS balíček vytvořen: ${output}`);
console.log(`Počet souborů: ${copied.length}`);
