# 📊 SEO Optimalizace pro Iv Production

## Optimalizované Titulky a Meta Descriptions

### Homepage
```html
<title>Iv Production | Profesionální Video Produkce – Svatby, Reality, Promo videa</title>
<meta name="description" content="Profesionální video produkce pro svatby, reality a promo videa. Dva zkušení kameramani s dronem. Hradec Králové a celá ČR. ✓ 500+ akcí ✓ 8 let zkušeností">
```

---

### Svatby
```html
<title>Svatební Kameraman & Video | Iv Production – Emoce navždy</title>
<meta name="description" content="Profesionální svatební kameraman s osobním přístupem. Filmové svatební video, dron, 2 kameramani. Ceny od 16 000 Kč. ✓ 300+ svateb ✓ Celá ČR">
```

---

### Reality
```html
<title>Video Prohlídky Nemovitostí & Dron | Iv Production – Královéhradecký kraj</title>
<meta name="description" content="Profesionální video a foto pro realitní makléře. Videoprohlídky, dron, virtuální 3D prohlídky. Prodávejte rychleji a za vyšší cenu. ✓ Expresní dodání">
```

---

### Kontakt ❌→✅
```html
<!-- STARÉ - ŠPATNĚ -->
<title>kontakt</title>

<!-- NOVÉ - SPRÁVNĚ -->
<title>Kontakt | Iv Production – Profesionální Video Produkce</title>
<meta name="description" content="Kontaktujte Iv Production pro profesionální svatební videa, realitní prezentace a promo. ☎️ +420 XXX XXX XXX | Hradec Králové a celá ČR">
```

---

### Plesy
```html
<title>Plesová Videa & Aftermovie | Iv Production – Zachytíme atmosféru</title>
<meta name="description" content="Profesionální plesová videa a aftermovie. Maturitní, firemní a městské plesy. Dva kameramani s dronem. ✓ Expresní dodání ✓ Celá ČR">
```

---

### Fotobudka
```html
<title>Fotobudka na Svatbu & Akce | IV Budka – Neomezený tisk</title>
<meta name="description" content="Prémiová fotobudka s neomezeným tiskem a online galerií. Svatby, plesy, firemní akce. Cena od 6000 Kč. ✓ Obsluha v ceně ✓ Rekvizity">
```

---

## Schema.org – Strukturovaná Data

### Pro Homepage (Organization)
```json
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Iv Production",
    "url": "https://www.ivproduction.cz",
    "logo": "https://www.ivproduction.cz/logo.png",
    "description": "Profesionální video produkce a fotobudky",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hradec Králové",
        "addressCountry": "CZ"
    },
    "sameAs": [
        "https://facebook.com/ivproduction",
        "https://instagram.com/ivproduction",
        "https://youtube.com/@ivproduction"
    ]
}
```

### Pro Kontakt (LocalBusiness)
```json
{
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Iv Production",
    "description": "Profesionální video produkce",
    "url": "https://www.ivproduction.cz",
    "telephone": "+420XXXXXXXXX",
    "email": "info@ivproduction.cz",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hradec Králové",
        "addressCountry": "CZ"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "50.2103",
        "longitude": "15.8327"
    },
    "openingHours": "Mo-Fr 09:00-18:00",
    "priceRange": "$$"
}
```

### Pro Služby (Service)
```json
{
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Svatební video produkce",
    "provider": {
        "@type": "LocalBusiness",
        "name": "Iv Production"
    },
    "areaServed": {
        "@type": "Country",
        "name": "Česká republika"
    },
    "offers": {
        "@type": "Offer",
        "priceRange": "16000 CZK - 22000 CZK"
    }
}
```

---

## Opravy k Provedení

| Stránka | Problém | Řešení |
|---------|---------|--------|
| Kontakt | Title jen "kontakt" | Změnit na "Kontakt \| Iv Production – Profesionální Video Produkce" |
| Svatby | Překlep "STANDART" | Změnit na "STANDARD" |
| Všechny | Chybí Schema.org | Přidat JSON-LD strukturovaná data |
| Všechny | Chybí Open Graph | Přidat og:title, og:description, og:image |

---

## Open Graph Tags (pro sociální sítě)

```html
<!-- Homepage -->
<meta property="og:title" content="Iv Production | Profesionální Video Produkce">
<meta property="og:description" content="Svatby, reality, promo videa. Dva zkušení kameramani s dronem po celé ČR.">
<meta property="og:image" content="https://www.ivproduction.cz/og-image.jpg">
<meta property="og:url" content="https://www.ivproduction.cz">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Iv Production | Profesionální Video Produkce">
<meta name="twitter:description" content="Svatby, reality, promo videa. Dva zkušení kameramani s dronem.">
<meta name="twitter:image" content="https://www.ivproduction.cz/og-image.jpg">
```
