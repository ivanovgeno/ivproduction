#!/usr/bin/env python3
"""Create the immutable blog seed from the current static article pages."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from lxml import etree, html


ROOT = Path(__file__).resolve().parent.parent
ARTICLE_FILES = [
    "jak-vybrat-svatebniho-kameramana.html",
    "trendy-svatebni-video-2026.html",
    "proc-video-pomaha-prodat-nemovitost.html",
    "jak-pripravit-firemni-video.html",
    "video-pro-socialni-site.html",
    "svatebni-lokace-kralovehradecky-kraj.html",
    "hudba-ve-videu.html",
    "l/planovani-svatby-cim-zacit/index.html",
    "l/vyber-svatebniho-mista/index.html",
    "l/typy-svatebniho-obradu/index.html",
    "l/dodavatele-aneb-koho-vsechno-potrebujete-na-sve-svatbe/index.html",
    "l/instax-nebo-fotokoutek-tot-otazka/index.html",
]


def first(document: html.HtmlElement, expression: str, default: str = "") -> str:
    values = document.xpath(expression)
    if not values:
        return default
    value = values[0]
    if isinstance(value, etree._Element):
        return " ".join(value.itertext()).strip()
    return str(value).strip()


def attribute(document: html.HtmlElement, expression: str, name: str, default: str = "") -> str:
    nodes = document.xpath(expression)
    return str(nodes[0].get(name, default)).strip() if nodes else default


def inner_html(element: etree._Element) -> str:
    parts: list[str] = []
    if element.text and element.text.strip():
        parts.append(element.text.strip())
    for child in element:
        classes = set((child.get("class") or "").split())
        if "article-cta" in classes:
            continue
        parts.append(etree.tostring(child, encoding="unicode", method="html").strip())
    return "\n".join(part for part in parts if part)


def public_path(relative: str) -> str:
    if relative.startswith("l/"):
        return "/" + relative.removesuffix("index.html")
    return "/" + relative.removesuffix(".html") + "/"


def schema_value(document: html.HtmlElement, key: str, default: str = "") -> str:
    for source in document.xpath('//script[@type="application/ld+json"]/text()'):
        try:
            payload = json.loads(str(source))
        except (TypeError, ValueError, json.JSONDecodeError):
            continue
        candidates = payload if isinstance(payload, list) else [payload]
        for candidate in candidates:
            if isinstance(candidate, dict) and candidate.get(key):
                return str(candidate[key]).strip()
    return default


def post(relative: str, index: int) -> dict[str, object]:
    document = html.fromstring((ROOT / relative).read_text(encoding="utf-8"))
    route = public_path(relative)
    slug = route.rstrip("/").split("/")[-1]
    body_nodes = document.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," article-body ")]')
    if not body_nodes:
        raise RuntimeError(f"{relative}: article-body was not found")

    title = first(document, "//h1[1]")
    seo_title = first(document, "//title[1]") or f"{title} | Iv Production"
    description = attribute(document, '//meta[@name="description"]', "content")
    excerpt = first(document, '//*[contains(concat(" ",normalize-space(@class)," ")," article-hero__lead ")][1]') or description
    category = attribute(document, '//meta[@property="article:section"]', "content")
    if not category:
        category = first(document, '//*[contains(concat(" ",normalize-space(@class)," ")," article-kicker ")][1]').split("·")[0].strip() or "Tipy"
    published = (
        attribute(document, '//meta[@property="article:published_time"]', "content")
        or schema_value(document, "datePublished")
        or date.today().isoformat()
    )
    reading = first(document, '//*[contains(concat(" ",normalize-space(@class)," ")," article-meta ")]/*[2]') or "5 minut čtení"
    image = attribute(document, '//*[contains(concat(" ",normalize-space(@class)," ")," article-hero__media ")]//img[1]', "src")
    image_alt = attribute(document, '//*[contains(concat(" ",normalize-space(@class)," ")," article-hero__media ")]//img[1]', "alt") or title
    kicker = first(document, '//*[contains(concat(" ",normalize-space(@class)," ")," article-kicker ")][1]') or category

    return {
        "id": f"legacy-{index + 1}",
        "slug": slug,
        "path": route,
        "sourceFile": relative,
        "title": title,
        "seoTitle": seo_title,
        "metaDescription": description or excerpt,
        "excerpt": excerpt,
        "category": category,
        "kicker": kicker,
        "publishedAt": published[:10],
        "readingTime": reading,
        "image": image,
        "imageAlt": image_alt,
        "bodyHtml": inner_html(body_nodes[0]),
        "status": "published",
        "featured": index == 0,
        "createdAt": published[:10] + "T00:00:00Z",
        "updatedAt": "2026-09-01T00:00:00Z",
    }


payload = {
    "version": 1,
    "updatedAt": "2026-09-01T00:00:00Z",
    "posts": [post(relative, index) for index, relative in enumerate(ARTICLE_FILES)],
}
(ROOT / "content" / "blog-posts.seed.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Generated {len(payload['posts'])} blog posts.")
