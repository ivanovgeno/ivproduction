#!/usr/bin/env python3
"""Connect every public page to its dedicated Open Graph preview."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMAGE_BASE = "https://ivanovgeno.github.io/ivproduction/assets/og"


@dataclass(frozen=True)
class Page:
    filename: str
    slug: str
    alt: str


PAGES = (
    Page("index.html", "homepage", "IV Production – profesionální video produkce"),
    Page("svatby.html", "svatby", "Svatební video IV Production"),
    Page("reality.html", "reality", "Profesionální video a fotografie nemovitostí"),
    Page("promo.html", "promo", "Promo video pro firmy a značky"),
    Page("plesy.html", "plesy", "Video a fotografie maturitního plesu"),
    Page("konference.html", "konference", "Profesionální záznam konference a livestream"),
    Page("podcast.html", "podcast", "Natáčení video podcastu IV Production"),
    Page("fotobudka.html", "fotobudka", "Fotobudka IV Budka pro svatby, plesy a firemní akce"),
    Page("360budka.html", "360budka", "Hosté při natáčení v IV Budce 360"),
    Page("reels.html", "reels", "Tvorba krátkých videí a Reels pro firmy"),
    Page("portfolio.html", "portfolio", "Případové studie a portfolio IV Production"),
    Page("blog.html", "blog", "Blog IV Production o profesionálním videu"),
    Page("jak-vybrat-svatebniho-kameramana.html", "jak-vybrat-svatebniho-kameramana", "Jak vybrat svatebního kameramana"),
    Page("trendy-svatebni-video-2026.html", "trendy-svatebni-video-2026", "Trendy ve svatebních videích 2026"),
    Page("proc-video-pomaha-prodat-nemovitost.html", "proc-video-pomaha-prodat-nemovitost", "Proč profesionální video pomáhá prodat nemovitost"),
    Page("jak-pripravit-firemni-video.html", "jak-pripravit-firemni-video", "Jak připravit firemní video v pěti krocích"),
    Page("video-pro-socialni-site.html", "video-pro-socialni-site", "Jak ve videu pro sociální sítě udržet pozornost"),
    Page("svatebni-lokace-kralovehradecky-kraj.html", "svatebni-lokace-kralovehradecky-kraj", "Jak vybrat svatební lokaci v Královéhradeckém kraji"),
    Page("hudba-ve-videu.html", "hudba-ve-videu", "Jak vybrat správný soundtrack k videu"),
    Page("kontakt.html", "kontakt", "Kontaktujte IV Production"),
    Page("kalkulacka.html", "kalkulacka", "Cenová kalkulačka video produkce"),
    Page("ochrana-osobnich-udaju.html", "ochrana-osobnich-udaju", "Ochrana osobních údajů IV Production"),
    Page("obchodni-podminky.html", "obchodni-podminky", "Obchodní podmínky IV Production"),
    Page("marketingovy-souhlas.html", "marketingovy-souhlas", "Marketingový souhlas IV Production"),
)


OG_GROUP = re.compile(
    r'<meta\s+property="og:image"\s+content="[^"]+">'
    r'(?:\s*<meta\s+property="og:image:(?:secure_url|type|width|height|alt)"\s+content="[^"]*">)*',
    re.IGNORECASE,
)

TWITTER_GROUP = re.compile(
    r'<meta\s+name="twitter:image"\s+content="[^"]+">'
    r'(?:\s*<meta\s+name="twitter:image:alt"\s+content="[^"]*">)*',
    re.IGNORECASE,
)

ARTICLE_IMAGE = re.compile(r'("image"\s*:\s*\[\s*")[^"]+("\s*\])')


def update_page(page: Page) -> None:
    path = ROOT / page.filename
    raw = path.read_bytes()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    image_url = f"{IMAGE_BASE}/{page.slug}.jpg"

    og = (
        f'<meta property="og:image" content="{image_url}">\n'
        f'    <meta property="og:image:secure_url" content="{image_url}">\n'
        f'    <meta property="og:image:type" content="image/jpeg">\n'
        f'    <meta property="og:image:width" content="1200">\n'
        f'    <meta property="og:image:height" content="630">\n'
        f'    <meta property="og:image:alt" content="{page.alt}">'
    )
    text, og_count = OG_GROUP.subn(og, text, count=1)
    if og_count != 1:
        raise RuntimeError(f"Expected one Open Graph image in {page.filename}, found {og_count}")

    twitter = (
        f'<meta name="twitter:image" content="{image_url}">\n'
        f'    <meta name="twitter:image:alt" content="{page.alt}">'
    )
    text, twitter_count = TWITTER_GROUP.subn(twitter, text, count=1)
    if twitter_count != 1:
        raise RuntimeError(f"Expected one Twitter image in {page.filename}, found {twitter_count}")

    # Article structured data should reference the same large representative image.
    text = ARTICLE_IMAGE.sub(lambda match: f'{match.group(1)}{image_url}{match.group(2)}', text, count=1)

    encoded = text.encode("utf-8")
    if has_bom:
        encoded = b"\xef\xbb\xbf" + encoded
    path.write_bytes(encoded)
    print(f"{page.filename}: {image_url}")


def main() -> None:
    for page in PAGES:
        update_page(page)


if __name__ == "__main__":
    main()
