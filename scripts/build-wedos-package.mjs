import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'release', 'wedos');
const pageFiles = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name);

const rootFiles = new Set([
    ...pageFiles,
    '404.html', '.htaccess', 'robots.txt', 'sitemap.xml', 'sitemap.php', 'kontakt-handler.php',
    'blog-index.php', 'blog-post.php'
]);
const rootExtensions = new Set(['.css', '.js', '.json', '.webmanifest', '.ico', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.webm']);
const publicDirectories = new Set(['admin', 'api', 'assets', 'content', 'images', 'l', 'partners']);

function shouldCopy(relative, entry) {
    const parts = relative.split(path.sep);
    const normalized = parts.join('/');
    if (parts.some((part) => ['.git', '.github', 'release', 'scripts', 'tools', 'dist', 'zálohy'].includes(part))) return false;
    if (['.md', '.py', '.mjs', '.yml', '.yaml', '.bak', '.tmp', '.admin-tmp', '.log'].includes(path.extname(relative).toLowerCase())) return false;
    if (/^(?:api\/private\/google-reviews-config\.php|api\/cache\/google-reviews\.json|admin\/data\/login-rate\.json)$/.test(normalized)) return false;
    if (normalized.startsWith('admin/data/history/') && entry.isFile() && entry.name !== '.htaccess') return false;
    if (/^(?:sprava-balicku|kalkulacka|index_v1_backup|index\s+chyba)\.html$/i.test(normalized)) return false;
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
