#!/usr/bin/env python3
"""Generate branded 1200x630 social sharing previews for public pages."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "og"
WIDTH = 1200
HEIGHT = 630

GOLD = (240, 212, 119)
GOLD_DARK = (212, 175, 55)
WHITE = (250, 249, 246)
MUTED = (220, 220, 216)
INK = (4, 7, 12)

FONT_BOLD = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
FONT_REGULAR = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")


@dataclass(frozen=True)
class Preview:
    slug: str
    source: str
    eyebrow: str
    title: str
    focus: tuple[float, float] = (0.5, 0.5)


PREVIEWS = (
    Preview("homepage", "assets/site/camera.webp", "IV PRODUCTION", "Profesionální video, které má příběh", (0.65, 0.52)),
    Preview("svatby", "assets/site/wedding.webp", "SVATEBNÍ VIDEO", "Vzpomínky, ke kterým se budete vracet", (0.68, 0.50)),
    Preview("reality", "assets/site/luxury-house.webp", "REALITY", "Video a fotografie, které prodávají prostor", (0.70, 0.54)),
    Preview("promo", "assets/site/promo.webp", "PROMO VIDEO", "Představte svou značku ve správném světle", (0.68, 0.50)),
    Preview("plesy", "assets/site/concert.webp", "MATURITNÍ PLESY", "Váš velký večer zachycený naplno", (0.70, 0.45)),
    Preview("konference", "assets/site/conference.webp", "KONFERENCE A LIVESTREAM", "Profesionální záznam bez kompromisů", (0.68, 0.48)),
    Preview("podcast", "assets/site/podcast.webp", "VIDEO PODCAST", "Podcast na klíč od natáčení po střih", (0.68, 0.52)),
    Preview("fotobudka", "assets/site/photobooth.webp", "IV BUDKA", "Fotobudka pro každou skvělou akci", (0.69, 0.46)),
    Preview("360budka", "assets/360budka/og.webp", "IV BUDKA 360°", "Zážitek, který zachytí každý úhel", (0.65, 0.50)),
    Preview("reels", "assets/site/event-detail.webp", "REELS PRO FIRMY", "Krátká videa, která udrží pozornost", (0.67, 0.52)),
    Preview("portfolio", "assets/site/video-production.webp", "NAŠE PRÁCE", "Případové studie a portfolio", (0.69, 0.55)),
    Preview("blog", "assets/site/blog-writing.webp", "BLOG", "Tipy ze světa profesionálního videa", (0.69, 0.48)),
    Preview("jak-vybrat-svatebniho-kameramana", "assets/site/camera.webp", "ČLÁNEK · SVATBY", "Jak vybrat svatebního kameramana", (0.70, 0.52)),
    Preview("trendy-svatebni-video-2026", "assets/site/wedding-three.webp", "ČLÁNEK · SVATBY", "Trendy ve svatebních videích 2026", (0.70, 0.50)),
    Preview("proc-video-pomaha-prodat-nemovitost", "assets/site/reality.webp", "ČLÁNEK · REALITY", "Proč video pomáhá prodat nemovitost", (0.69, 0.50)),
    Preview("jak-pripravit-firemni-video", "assets/site/business.webp", "ČLÁNEK · FIRMY", "Jak připravit firemní video v 5 krocích", (0.67, 0.50)),
    Preview("video-pro-socialni-site", "assets/site/reels.webp", "ČLÁNEK · SOCIÁLNÍ SÍTĚ", "Jak ve videu udržet pozornost", (0.69, 0.50)),
    Preview("svatebni-lokace-kralovehradecky-kraj", "assets/site/wedding-two.webp", "ČLÁNEK · SVATBY", "Jak vybrat svatební lokaci", (0.69, 0.50)),
    Preview("hudba-ve-videu", "assets/site/music.webp", "ČLÁNEK · TIPY", "Jak vybrat správný soundtrack", (0.69, 0.48)),
    Preview("kontakt", "assets/site/conference-room.webp", "KONTAKT", "Pojďme vytvořit něco výjimečného", (0.70, 0.50)),
    Preview("kalkulacka", "assets/site/laptop.webp", "CENOVÁ KALKULAČKA", "Spočítejte si cenu své produkce", (0.70, 0.50)),
    Preview("ochrana-osobnich-udaju", "assets/site/documents.webp", "INFORMACE", "Ochrana osobních údajů", (0.69, 0.50)),
    Preview("obchodni-podminky", "assets/site/documents.webp", "INFORMACE", "Obchodní podmínky", (0.69, 0.50)),
    Preview("marketingovy-souhlas", "assets/site/marketing.webp", "INFORMACE", "Marketingový souhlas", (0.69, 0.50)),
)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def wrap_title(draw: ImageDraw.ImageDraw, value: str, max_width: int, max_lines: int = 3) -> tuple[list[str], int]:
    for size in range(62, 43, -2):
        face = font(size, bold=True)
        words = value.split()
        lines: list[str] = []
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=face)[2] <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        if len(lines) <= max_lines:
            return lines, size
    return [value], 44


def draw_letterspaced(draw: ImageDraw.ImageDraw, position: tuple[int, int], value: str, face: ImageFont.FreeTypeFont, fill: tuple[int, ...], spacing: int) -> None:
    x, y = position
    for character in value:
        draw.text((x, y), character, font=face, fill=fill)
        x += int(draw.textlength(character, font=face)) + spacing


def make_gradient() -> Image.Image:
    gradient = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    pixels = gradient.load()
    for x in range(WIDTH):
        progress = x / (WIDTH - 1)
        alpha = int(238 - 190 * min(progress / 0.82, 1.0))
        for y in range(HEIGHT):
            vertical = abs((y / (HEIGHT - 1)) - 0.5) * 2
            extra = int(24 * vertical)
            pixels[x, y] = (*INK, min(255, alpha + extra))
    return gradient


def load_logo() -> Image.Image:
    logo = Image.open(ROOT / "favicon-512x512.png").convert("RGBA")
    return logo.resize((74, 74), Image.Resampling.LANCZOS)


def render(preview: Preview, gradient: Image.Image, logo: Image.Image) -> Path:
    source = Image.open(ROOT / preview.source).convert("RGB")
    background = ImageOps.fit(source, (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS, centering=preview.focus)
    background = ImageEnhance.Color(background).enhance(0.88)
    background = ImageEnhance.Contrast(background).enhance(1.08)
    background = ImageEnhance.Brightness(background).enhance(0.87)
    canvas = background.convert("RGBA")
    canvas.alpha_composite(gradient)

    # Soft gold ambience connects the photographic background to the site palette.
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((890, -170, 1330, 270), fill=(*GOLD_DARK, 42))
    glow = glow.filter(ImageFilter.GaussianBlur(82))
    canvas.alpha_composite(glow)

    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), outline=(*GOLD_DARK, 120), width=2)

    canvas.alpha_composite(logo, (64, 48))
    draw.text((154, 58), "IV PRODUCTION", font=font(28, bold=True), fill=GOLD)
    draw_letterspaced(draw, (156, 94), "PROFESIONÁLNÍ VIDEO PRODUKCE", font(11), MUTED, 2)

    eyebrow_y = 218
    eyebrow_face = font(18, bold=True)
    eyebrow_width = int(draw.textlength(preview.eyebrow, font=eyebrow_face)) + 46
    draw.rounded_rectangle((64, eyebrow_y, 64 + eyebrow_width, eyebrow_y + 42), radius=21, fill=(8, 11, 17, 208), outline=(*GOLD_DARK, 170), width=1)
    draw.text((87, eyebrow_y + 9), preview.eyebrow, font=eyebrow_face, fill=GOLD)

    lines, title_size = wrap_title(draw, preview.title, 690)
    title_face = font(title_size, bold=True)
    line_height = int(title_size * 1.18)
    title_y = 282
    for index, line in enumerate(lines):
        y = title_y + index * line_height
        draw.text((64, y + 3), line, font=title_face, fill=(0, 0, 0, 120), stroke_width=2, stroke_fill=(0, 0, 0, 100))
        draw.text((64, y), line, font=title_face, fill=WHITE)

    footer_y = 558
    draw.rounded_rectangle((64, footer_y, 118, footer_y + 4), radius=2, fill=GOLD)
    draw_letterspaced(draw, (134, footer_y - 10), "IVPRODUCTION.CZ", font(18, bold=True), WHITE, 2)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / f"{preview.slug}.jpg"
    canvas.convert("RGB").save(target, "JPEG", quality=88, optimize=True, progressive=True, subsampling=1)
    return target


def main() -> None:
    gradient = make_gradient()
    logo = load_logo()
    for preview in PREVIEWS:
        target = render(preview, gradient, logo)
        print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
