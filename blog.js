(function () {
    'use strict';

    function initBlogFilters() {
        var buttons = Array.from(document.querySelectorAll('[data-blog-filter]'));
        var cards = Array.from(document.querySelectorAll('[data-blog-category]'));
        var status = document.getElementById('blogFilterStatus');
        if (!buttons.length || !cards.length) return;

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                var filter = button.dataset.blogFilter || 'all';
                var visible = 0;

                buttons.forEach(function (item) {
                    var active = item === button;
                    item.classList.toggle('active', active);
                    item.setAttribute('aria-pressed', String(active));
                });

                cards.forEach(function (card) {
                    var show = filter === 'all' || card.dataset.blogCategory === filter;
                    card.hidden = !show;
                    if (show) visible += 1;
                });

                if (status) {
                    status.textContent = filter === 'all'
                        ? 'Zobrazeny jsou všechny články.'
                        : 'Zobrazené články: ' + button.textContent.trim() + ' (' + visible + ').';
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlogFilters, { once: true });
    } else {
        initBlogFilters();
    }
}());
