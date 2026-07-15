/*
 * IV Production – veřejná data balíčků.
 * Tento soubor je jediným zdrojem pro cenové karty na stránkách.
 * Upravovat lze také přes neveřejnou stránku sprava-balicku.html.
 */
window.IVP_PACKAGE_DATA = {
    svatby: {
        main: [
            {
                id: 'eco',
                name: 'ECO',
                price: '16 000 Kč',
                description: 'Citlivě zachycený svatební den v kompaktním filmovém rozsahu.',
                features: [
                    'Licencovaná hudba',
                    '12 hodin natáčení',
                    'Videoklip 4–7 minut',
                    'Až 3 kamery během obřadu',
                    'Dronové záběry',
                    'Doprava po celé ČR zdarma',
                    '2 roky uschování záznamů'
                ],
                ctaLabel: 'Zjistit dostupnost',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'standard',
                name: 'STANDARD',
                price: '18 000 Kč',
                description: 'Vyvážený rozsah pro páry, které chtějí ještě více děje a emocí.',
                features: [
                    'Vše z balíčku ECO',
                    'Svatební highlight 1–2 minuty',
                    'Dva profesionální kameramani',
                    'Filmový střih s autentickým zvukem',
                    'Doprava po celé ČR zdarma',
                    '2 roky uschování záznamů',
                    'Prioritní zákaznická podpora'
                ],
                ctaLabel: 'Zjistit dostupnost',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'premium',
                name: 'PREMIUM',
                price: '22 000 Kč',
                description: 'Kompletní filmová vzpomínka od příprav až po závěr vašeho dne.',
                features: [
                    'Vše z balíčku STANDARD',
                    'Film z celého dne 30–120 minut',
                    'Flash disk s dárkovou krabičkou',
                    'Vše smluvně a přehledně potvrzené',
                    'Doprava po celé ČR zdarma',
                    '2 roky uschování záznamů',
                    'VIP zákaznická péče'
                ],
                ctaLabel: 'Ověřit termín',
                ctaHref: 'kontakt.html#poptavka',
                popular: true,
                popularLabel: 'Nejoblíbenější'
            },
            {
                id: 'na-miru',
                name: 'SVATBA NA MÍRU',
                price: 'Dle nabídky',
                description: 'Pro den, který se nevejde do běžné šablony a zaslouží si vlastní scénář.',
                features: [
                    'Rozsah vytvořený podle vašeho dne',
                    'Možnost propojit video, foto i doplňky',
                    'Jedna přehledná nabídka bez zbytečností',
                    'Osobní konzultace před rezervací'
                ],
                ctaLabel: 'Sestavit balíček',
                ctaHref: 'kontakt.html#poptavka'
            }
        ],
        partners: [
            {
                id: 'marek-kyncl',
                type: 'partner',
                partner: 'Marek Kyncl Fotograf',
                linkLabel: 'Portfolio fotografa',
                linkUrl: 'https://www.marekyncl.cz/portfolio',
                name: 'Video + fotograf',
                price: 'Cena na míru',
                description: 'Jeden sladěný tým pro film i fotografie, od příprav až po poslední tanec.',
                features: [
                    'Společná příprava harmonogramu',
                    'Kameraman IV Production + fotograf Marek Kyncl',
                    'Jednotná komunikace a sladěný přístup',
                    'Přehledný společný návrh rozsahu'
                ],
                ctaLabel: 'Chci video + foto',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'scholz',
                type: 'partner',
                partner: 'Scholz foto a video',
                linkLabel: 'Svatební portfolio',
                linkUrl: 'https://scholzfotovideo.cz/svatebni-portfolio',
                name: 'Foto + video v jednom týmu',
                price: 'Cena na míru',
                description: 'Kompletní foto-video pokrytí pro páry, které chtějí vše domluvit na jednom místě.',
                features: [
                    'Společné plánování dne',
                    'Jasně rozdělené role foto a video týmu',
                    'Výstupy navržené jako jeden celek',
                    'Jedna kontaktní cesta od poptávky po předání'
                ],
                ctaLabel: 'Probrat společný balíček',
                ctaHref: 'kontakt.html#poptavka'
            }
        ],
        extras: [
            {
                id: 'iv-budka',
                type: 'owned',
                partner: 'Vlastní služba IV Production',
                name: 'Fotobudka IV Budka',
                price: 'Dle délky pronájmu',
                description: 'Zábava pro hosty a okamžitá vzpomínka, kterou si odnesou domů.',
                features: [
                    'Prostor pro rekvizity a společné momenty',
                    'Výstup pro hosty během akce',
                    'Snadné sladění s vaším svatebním stylem'
                ],
                ctaLabel: 'Přidat fotobudku',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'duhohratky',
                linkLabel: 'Poznat Duhohrátky',
                linkUrl: 'https://duhohratky.cz/',
                name: 'Duhohrátky',
                price: 'Cena na míru',
                description: 'Promyšlené vyžití pro malé hosty, aby si den užili i rodiče.',
                features: [
                    'Dětský koutek podle prostoru akce',
                    'Doplněk k celodennímu programu',
                    'Rozsah domluvíme individuálně'
                ],
                ctaLabel: 'Zjistit možnosti',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'skakaci-hrad',
                name: 'Menší skákací hrad',
                price: 'Cena na míru',
                description: 'Praktický doplněk pro dětské hosty na svatbu s dostatkem prostoru.',
                features: [
                    'Vhodné pro menší dětskou zónu',
                    'Rozsah podle místa a termínu',
                    'Doporučení pro bezpečné umístění'
                ],
                ctaLabel: 'Prověřit dostupnost',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'destniky',
                name: 'Zapůjčení deštníků',
                price: 'Cena na míru',
                description: 'Rezerva pro proměnlivé počasí i elegantní detail na společné fotografie.',
                features: [
                    'Praktické řešení pro hosty',
                    'Vhodné pro obřad i přesuny',
                    'Množství podle velikosti svatby'
                ],
                ctaLabel: 'Přidat do poptávky',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'predsvatebni-video',
                name: 'Předsvatební video',
                price: 'Cena na míru',
                description: 'Krátký osobní film před svatbou, který dá vašemu příběhu další rozměr.',
                features: [
                    'Koncept podle vás dvou',
                    'Vhodné pro promítání na svatbě',
                    'Filmový střih a licencovaná hudba'
                ],
                ctaLabel: 'Vytvořit předsvatební video',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'video-z-fotek',
                name: 'Video z fotografií',
                price: 'Cena na míru',
                description: 'Příběh z vašich fotografií pro promítání, překvapení nebo společnou vzpomínku.',
                features: [
                    'Výběr a uspořádání dodaných fotografií',
                    'Hudba, titulky a citlivý střih',
                    'Připraveno pro promítání i online sdílení'
                ],
                ctaLabel: 'Připravit video z fotek',
                ctaHref: 'kontakt.html#poptavka'
            }
        ]
    },
    plesy: {
        main: [
            {
                id: 'ples-standard',
                name: 'STANDARD VIDEO',
                price: '10 000 Kč',
                description: 'Pro třídu, která chce profesionální film z celého večera a při více třídách cenu od 300 Kč za studenta.',
                features: [
                    'Profesionální natáčení plesu od začátku do konce',
                    'Dynamický klip z nejlepších momentů, který můžete sdílet celé třídě',
                    'Fotobudka zdarma – host platí pouze 50 Kč za tištěnou fotografii',
                    'Královéhradecký kraj zdarma, ostatní kraje 9 Kč/km ze startu Jasenná',
                    'Druhý kameraman +3 000 Kč',
                    'Dlouhé video +5 000 Kč',
                    'Instagram Reel +3 500 Kč',
                    'Gravírovaný flash disk 500 Kč/ks, od 5 ks 400 Kč/ks',
                    'Při 2 a více třídách 300 Kč za studenta, minimálně 10 000 Kč'
                ],
                ctaLabel: 'Ověřit termín pro třídu',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'ples-premium',
                name: 'PREMIUM FOTO + VIDEO',
                price: '19 000 Kč',
                description: 'Nejčastější volba tříd: fotografie i dynamické video od jednoho týmu, při více třídách od 600 Kč za studenta.',
                features: [
                    'Profesionální focení a natáčení celého plesu',
                    'Dynamický klip připravený ke sdílení spolužákům',
                    'Fotobudka zdarma a kupon na 1 tištěnou fotografii pro každého studenta',
                    'Doprava po celé České republice zdarma',
                    'Druhý kameraman +2 500 Kč',
                    'Dlouhé video +5 000 Kč',
                    'Instagram Reel +3 000 Kč',
                    'Gravírovaný flash disk 450 Kč/ks, od 5 ks 350 Kč/ks',
                    'Při 2 a více třídách 600 Kč za studenta, minimálně 19 000 Kč'
                ],
                ctaLabel: 'Chceme Foto + Video',
                ctaHref: 'kontakt.html#poptavka',
                popular: true,
                popularLabel: 'Volba maturantů'
            },
            {
                id: 'ples-all-in-one',
                name: 'ALL IN ONE',
                price: '28 000 Kč',
                description: 'Pro třídu, která chce z plesu vytěžit maximum: foto, krátký i dlouhý film, fotobudku a 360° videa.',
                features: [
                    'Profesionální focení a natáčení celého plesu',
                    'Krátký dynamický videoklip i dlouhé video z celého večera',
                    '360° video koutek a 1 kupon zdarma pro každého maturanta',
                    'Fotobudka zdarma a kupon na 1 tištěnou fotografii pro každého studenta',
                    'Doprava po celé České republice zdarma',
                    'Druhý kameraman +2 000 Kč',
                    'Instagram Reel +2 500 Kč',
                    'Gravírovaný flash disk 450 Kč/ks, od 5 ks 350 Kč/ks',
                    'Při 2 a více třídách 900 Kč za studenta, minimálně 28 000 Kč'
                ],
                ctaLabel: 'Chceme celý zážitek',
                ctaHref: 'kontakt.html#poptavka'
            }
        ],
        other: [
            {
                id: 'ples-na-miru',
                name: 'PLES NA MÍRU',
                price: 'Individuální cena',
                description: 'Kompletní produkční a technická nabídka pro městský, firemní, reprezentační, sportovní nebo jakýkoliv jiný ples.',
                features: [
                    'Video, fotografie nebo kompletní produkční tým podle potřeby',
                    'Kompletní profesionální osvětlení sálu, pódia i tanečního parketu',
                    'Ozvučení přizpůsobené velikosti prostoru, programu a počtu hostů',
                    'Fotobudka a 360° video koutek jako volitelné rozšíření',
                    'Rozsah natáčení přizpůsobený programu a počtu hostů',
                    'Krátký dynamický sestřih, dlouhé video i obsah na sociální sítě',
                    'Individuální kalkulace dopravy, techniky a počtu členů týmu',
                    'Přehledná nezávazná nabídka potvrzená předem'
                ],
                ctaLabel: 'Připravit nabídku na míru',
                ctaHref: 'kontakt.html#poptavka'
            }
        ]
    },
    reality: {
        main: [
            {
                id: 'reality-standard',
                name: 'STANDARD VIDEO',
                price: '8 000 Kč',
                description: 'Profesionální video pro samostatnou prezentaci nemovitosti.',
                features: [
                    'Natáčení videoprohlídky nemovitosti',
                    'Plynulé záběry interiéru a exteriéru',
                    'Střih, barevné korekce a základní postprodukce',
                    'Dodání pro web a realitní portály',
                    'Letecké záběry z dronu',
                    'Komentovaná prohlídka s titulky'
                ],
                ctaLabel: 'Poptat Standard',
                ctaHref: 'kontakt.html#poptavka'
            },
            {
                id: 'reality-premium',
                name: 'PREMIUM',
                price: '12 500 Kč',
                description: 'Kombinace videa a fotografií pro maximálně přesvědčivou nabídku.',
                features: [
                    'Profesionální video nemovitosti',
                    'Komentovaná prohlídka s titulky',
                    'Letecké záběry z dronu',
                    'Formát videa pro sociální sítě',
                    'HDR fotografie interiéru a exteriéru',
                    'Srovnání svislic a drobné retuše',
                    'Dodání pro web, sítě a realitní portály'
                ],
                ctaLabel: 'Poptat Premium',
                ctaHref: 'kontakt.html#poptavka',
                popular: true,
                popularLabel: 'Nejžádanější'
            },
            {
                id: 'reality-all-in-one',
                name: 'ALL IN ONE',
                price: '15 000 Kč',
                description: 'Kompletní balíček pro nejvyšší úroveň prezentace nemovitosti.',
                features: [
                    'Profesionální video včetně komentáře a titulků',
                    'Letecké záběry z dronu',
                    'Formát videa pro sociální sítě',
                    'HDR fotografie interiéru a exteriéru',
                    'Srovnání svislic a drobné retuše',
                    'Virtuální prohlídka celé nemovitosti',
                    'Doprava zdarma'
                ],
                ctaLabel: 'Poptat All in One',
                ctaHref: 'kontakt.html#poptavka'
            }
        ]
    }
};
