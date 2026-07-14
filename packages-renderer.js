(function () {
    'use strict';

    function textElement(tag, className, value) {
        var element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = value || '';
        return element;
    }

    function createCard(item, group) {
        var card = document.createElement('article');
        card.className = 'pricing-card package-card package-card--' + group;
        card.dataset.packageId = item.id || '';

        if (item.popular) {
            card.classList.add('featured', 'is-popular');
            card.appendChild(textElement('div', 'package-popular-badge', item.popularLabel || 'Nejoblíbenější'));
        }

        if (item.partner) {
            var markerLabel = item.type === 'owned' ? item.partner : 'Ve spolupráci s';
            var marker = textElement('p', 'package-partner-label', markerLabel);
            card.appendChild(marker);
            if (item.type !== 'owned') {
                card.appendChild(textElement('p', 'package-partner-name', item.partner));
            }
        }

        card.appendChild(textElement('h3', 'pricing-name', item.name));

        if (item.description) {
            card.appendChild(textElement('p', 'package-description', item.description));
        }

        var price = document.createElement('div');
        price.className = 'pricing-price';
        price.appendChild(textElement('span', '', item.price));
        card.appendChild(price);

        if (Array.isArray(item.features) && item.features.length) {
            var list = document.createElement('ul');
            list.className = 'pricing-features';
            item.features.forEach(function (feature) {
                list.appendChild(textElement('li', '', feature));
            });
            card.appendChild(list);
        }

        var action = document.createElement('a');
        action.className = 'pricing-btn';
        action.href = item.ctaHref || 'kontakt.html#poptavka';
        action.textContent = item.ctaLabel || 'Nezávazně poptat';
        card.appendChild(action);
        return card;
    }

    function renderPackages() {
        var data = window.IVP_PACKAGE_DATA || {};
        document.querySelectorAll('[data-package-page][data-package-group]').forEach(function (section) {
            var page = section.dataset.packagePage;
            var group = section.dataset.packageGroup;
            var target = section.querySelector('[data-packages-list]');
            var packages = data[page] && data[page][group];
            if (!target || !Array.isArray(packages)) return;

            target.replaceChildren();
            packages.forEach(function (item) {
                target.appendChild(createCard(item, group));
            });
            section.classList.add('packages-ready');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderPackages, { once: true });
    } else {
        renderPackages();
    }
}());
