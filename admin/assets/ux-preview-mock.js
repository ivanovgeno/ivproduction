(() => {
    const projects = [
        { id: 'tomas-kristyna-2026', title: 'Tomáš & Kristýna · 20. 6. 2026', label: 'Svatební film', categories: ['svatby'], image: '/assets/site/wedding.webp', alt: 'Svatební pár', video: 'https://www.youtube-nocookie.com/embed/6AC4PnE1RF4' },
        { id: 'rodinny-dum', title: 'Rodinný dům · České Meziříčí', label: 'Reality', categories: ['reality'], image: '/assets/site/reality.webp', alt: 'Rodinný dům', video: 'https://www.youtube-nocookie.com/embed/tL52LiBnCFc' },
        { id: 'ples-kojetin', title: 'Maturitní ples Kojetín · 6. 2. 2026', label: 'Ples & event', categories: ['plesy'], image: '/assets/site/event.webp', alt: 'Ples', video: 'https://www.youtube-nocookie.com/embed/2gdlYieJtOA' }
    ];
    const response = payload => Promise.resolve(new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    window.fetch = async (url, options = {}) => {
        const target = String(url);
        if (target.includes('api/content.php')) return response({ ok: true, pages: { 'index.html': 'Homepage', 'kontakt.html': 'Kontakt', 'portfolio.html': 'Portfolio' }, content: { version: 1, pages: {} }, storage: { content: true, contentDirectory: true, history: true, pages: true }, csrf: 'preview' });
        if (target.includes('api/videos.php')) return response({ ok: true, items: options.method === 'POST' ? JSON.parse(options.body).items : projects });
        if (target.includes('api/media.php')) return response({ ok: true, items: [{ name: 'wedding.webp', url: '/assets/site/wedding.webp', type: 'image' }, { name: 'reality.webp', url: '/assets/site/reality.webp', type: 'image' }, { name: 'event.webp', url: '/assets/site/event.webp', type: 'image' }] });
        if (target.includes('api/history.php')) return response({ ok: true, items: [] });
        return response({ ok: true });
    };
})();
