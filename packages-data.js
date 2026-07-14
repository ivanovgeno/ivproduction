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
    }
};
