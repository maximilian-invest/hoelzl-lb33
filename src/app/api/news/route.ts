import { NextRequest, NextResponse } from 'next/server';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  region: string;
  category: 'immobilien' | 'wirtschaft' | 'politik' | 'allgemein';
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'high' | 'medium' | 'low';
  featured: boolean;
  tags: string[];
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  region: string;
  lastUpdated: string;
}

// Mock-Nachrichten für verschiedene Bundesländer
const MOCK_NEWS: Record<string, NewsArticle[]> = {
  'wien': [
    {
      id: '1',
      title: 'Wien: Immobilienpreise steigen moderat - 3,2% Plus im ersten Quartal',
      description: 'Die Wiener Immobilienpreise zeigen eine moderate Entwicklung. Experten rechnen mit stabilen Wachstumsraten für 2024.',
      url: 'https://example.com/wien-immobilien-q1-2024',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'Immobilien Kurier',
      region: 'Wien',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['preisentwicklung', 'marktanalyse', 'q1-2024']
    },
    {
      id: '2',
      title: 'Neue Bauprojekte in Wien-Donaustadt genehmigt',
      description: 'Die Stadt Wien hat mehrere neue Wohnbauprojekte im 22. Bezirk genehmigt. Bis zu 500 neue Wohnungen entstehen.',
      url: 'https://example.com/wien-donaustadt-bauprojekte',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: 'Wirtschaftsblatt',
      region: 'Wien',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'medium',
      featured: false,
      tags: ['bauprojekte', 'wohnbau', 'donaustadt']
    },
    {
      id: '3',
      title: 'Mietpreisbremse: Wien plant strengere Regulierung',
      description: 'Die Stadtregierung plant eine Verschärfung der Mietpreisbremse. Vermieter müssen mit strengeren Auflagen rechnen.',
      url: 'https://example.com/wien-mietpreisbremse',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: 'Der Standard',
      region: 'Wien',
      category: 'politik',
      sentiment: 'negative',
      importance: 'high',
      featured: true,
      tags: ['mietpreisbremse', 'regulierung', 'politik']
    }
  ],
  'niederoesterreich': [
    {
      id: '4',
      title: 'NÖ: Immobilienmarkt profitiert von Wien-Nähe',
      description: 'Der niederösterreichische Immobilienmarkt profitiert von der Nähe zu Wien. Besonders der Speckgürtel verzeichnet hohe Nachfrage.',
      url: 'https://example.com/noe-speckguertel-immobilien',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      source: 'NÖN',
      region: 'Niederösterreich',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['speckgürtel', 'wien-nähe', 'marktentwicklung']
    },
    {
      id: '5',
      title: 'Neue Gewerbegebiete in St. Pölten geplant',
      description: 'Die Landeshauptstadt plant die Erschließung neuer Gewerbegebiete. Bis zu 200 neue Arbeitsplätze sollen entstehen.',
      url: 'https://example.com/st-poelten-gewerbegebiete',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      source: 'Kurier',
      region: 'Niederösterreich',
      category: 'wirtschaft',
      sentiment: 'positive',
      importance: 'medium',
      featured: false,
      tags: ['gewerbegebiete', 'arbeitsplätze', 'st-pölten']
    }
  ],
  'oberoesterreich': [
    {
      id: '6',
      title: 'OÖ: Linz verzeichnet Rekord bei Gewerbeimmobilien',
      description: 'Die oberösterreichische Landeshauptstadt verzeichnet einen Rekord bei Gewerbeimmobilien. Investoren zeigen großes Interesse.',
      url: 'https://example.com/linz-gewerbeimmobilien-rekord',
      publishedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      source: 'OÖ Nachrichten',
      region: 'Oberösterreich',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'medium',
      featured: false,
      tags: ['gewerbeimmobilien', 'linz', 'rekord']
    }
  ],
  'salzburg': [
    {
      id: '7',
      title: 'Salzburg: Luxusimmobilien weiterhin gefragt',
      description: 'Der Salzburger Luxusimmobilienmarkt bleibt stabil. Internationale Käufer zeigen weiterhin großes Interesse.',
      url: 'https://example.com/salzburg-luxusimmobilien',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      source: 'Salzburger Nachrichten',
      region: 'Salzburg',
      category: 'immobilien',
      sentiment: 'neutral',
      importance: 'medium',
      featured: false,
      tags: ['luxusimmobilien', 'salzburg', 'international']
    }
  ],
  'tirol': [
    {
      id: '8',
      title: 'Tirol: Tourismus treibt Immobilienpreise in Bergregionen',
      description: 'Der starke Tourismus in Tirol treibt die Immobilienpreise in Bergregionen weiter an. Ferienwohnungen besonders gefragt.',
      url: 'https://example.com/tirol-bergregionen-immobilien',
      publishedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      source: 'Tiroler Tageszeitung',
      region: 'Tirol',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['tourismus', 'bergregionen', 'ferienwohnungen']
    }
  ],
  'vorarlberg': [
    {
      id: '9',
      title: 'Vorarlberg: Industrie treibt Gewerbeimmobilien-Nachfrage',
      description: 'Die starke Industrie in Vorarlberg treibt die Nachfrage nach Gewerbeimmobilien an. Neue Produktionsstätten geplant.',
      url: 'https://example.com/vorarlberg-gewerbeimmobilien',
      publishedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      source: 'Vorarlberger Nachrichten',
      region: 'Vorarlberg',
      category: 'wirtschaft',
      sentiment: 'positive',
      importance: 'medium',
      featured: false,
      tags: ['industrie', 'gewerbeimmobilien', 'produktionsstätten']
    }
  ],
  'steiermark': [
    {
      id: '10',
      title: 'Steiermark: Graz plant neue Wohnbauoffensive',
      description: 'Die steirische Landeshauptstadt plant eine neue Wohnbauoffensive. Bis zu 1000 neue Wohnungen sollen entstehen.',
      url: 'https://example.com/graz-wohnbauoffensive',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'Kleine Zeitung',
      region: 'Steiermark',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['graz', 'wohnbauoffensive', '1000-wohnungen']
    }
  ],
  'kaernten': [
    {
      id: '11',
      title: 'Kärnten: Seenregion bleibt bei Ferienimmobilien beliebt',
      description: 'Die Kärntner Seenregion bleibt bei Ferienimmobilien beliebt. Deutsche und österreichische Käufer dominieren den Markt.',
      url: 'https://example.com/kaernten-seenregion-ferienimmobilien',
      publishedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      source: 'Kärntner Krone',
      region: 'Kärnten',
      category: 'immobilien',
      sentiment: 'neutral',
      importance: 'medium',
      featured: false,
      tags: ['seenregion', 'ferienimmobilien', 'deutsche-käufer']
    }
  ],
  'burgenland': [
    {
      id: '12',
      title: 'Burgenland: Wien-Nähe macht Region attraktiv',
      description: 'Die Nähe zu Wien macht das Burgenland für Immobilienkäufer attraktiv. Preise steigen moderat aber stetig.',
      url: 'https://example.com/burgenland-wien-naehe',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      source: 'Burgenländische Volkszeitung',
      region: 'Burgenland',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'medium',
      featured: false,
      tags: ['wien-nähe', 'preisentwicklung', 'attraktivität']
    }
  ]
};

// Historische Featured-News (bis zu 1 Jahr zurück)
const HISTORICAL_FEATURED_NEWS: Record<string, NewsArticle[]> = {
  'wien': [
    {
      id: 'wien-hist-1',
      title: 'Wien: Historische Immobilienreform 2023 - Neue Bauordnung verabschiedet',
      description: 'Die Stadt Wien hat eine historische Immobilienreform verabschiedet. Die neue Bauordnung ermöglicht höhere Gebäude und mehr Wohnraum.',
      url: 'https://example.com/wien-bauordnung-2023',
      publishedAt: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 8 Monate zurück
      source: 'Der Standard',
      region: 'Wien',
      category: 'politik',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['bauordnung', 'reform', 'historisch', '2023']
    },
    {
      id: 'wien-hist-2',
      title: 'Wien: Größtes Wohnbauprojekt der Stadtgeschichte genehmigt',
      description: 'Das größte Wohnbauprojekt der Wiener Stadtgeschichte wurde genehmigt. 2000 neue Wohnungen entstehen in Seestadt Aspern.',
      url: 'https://example.com/wien-seestadt-aspern-2023',
      publishedAt: new Date(Date.now() - 10 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 10 Monate zurück
      source: 'Kurier',
      region: 'Wien',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['seestadt', 'aspern', 'wohnbauprojekt', 'historisch']
    }
  ],
  'niederoesterreich': [
    {
      id: 'noe-hist-1',
      title: 'NÖ: Speckgürtel-Immobilien erreichen Rekordpreise',
      description: 'Die Immobilienpreise im Wiener Speckgürtel haben 2023 Rekordwerte erreicht. Experten sehen weiteres Wachstumspotenzial.',
      url: 'https://example.com/noe-speckguertel-rekord-2023',
      publishedAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 Monate zurück
      source: 'NÖN',
      region: 'Niederösterreich',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['speckgürtel', 'rekordpreise', '2023', 'wachstum']
    }
  ],
  'oberoesterreich': [
    {
      id: 'ooe-hist-1',
      title: 'OÖ: Linz wird zum Immobilien-Hotspot',
      description: 'Linz entwickelt sich zum neuen Immobilien-Hotspot Österreichs. Investoren zeigen großes Interesse an der oberösterreichischen Landeshauptstadt.',
      url: 'https://example.com/linz-immobilien-hotspot-2023',
      publishedAt: new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 7 Monate zurück
      source: 'OÖ Nachrichten',
      region: 'Oberösterreich',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['linz', 'hotspot', 'investoren', '2023']
    }
  ],
  'salzburg': [
    {
      id: 'salzburg-hist-1',
      title: 'Salzburg: Luxusimmobilien-Markt boomt',
      description: 'Der Salzburger Luxusimmobilien-Markt verzeichnet einen historischen Boom. Internationale Käufer dominieren den Markt.',
      url: 'https://example.com/salzburg-luxus-boom-2023',
      publishedAt: new Date(Date.now() - 9 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 9 Monate zurück
      source: 'Salzburger Nachrichten',
      region: 'Salzburg',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['luxusimmobilien', 'boom', 'international', '2023']
    }
  ],
  'tirol': [
    {
      id: 'tirol-hist-1',
      title: 'Tirol: Bergregionen werden zum Immobilien-Mekka',
      description: 'Die Tiroler Bergregionen werden zum neuen Immobilien-Mekka für Ferienimmobilien. Deutsche und Schweizer Käufer dominieren.',
      url: 'https://example.com/tirol-bergregionen-mekka-2023',
      publishedAt: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 5 Monate zurück
      source: 'Tiroler Tageszeitung',
      region: 'Tirol',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['bergregionen', 'ferienimmobilien', 'mekka', '2023']
    }
  ],
  'vorarlberg': [
    {
      id: 'vorarlberg-hist-1',
      title: 'Vorarlberg: Industrie treibt Immobilienmarkt an',
      description: 'Die starke Vorarlberger Industrie treibt den Immobilienmarkt weiter an. Neue Produktionsstätten schaffen Arbeitsplätze.',
      url: 'https://example.com/vorarlberg-industrie-immobilien-2023',
      publishedAt: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 4 Monate zurück
      source: 'Vorarlberger Nachrichten',
      region: 'Vorarlberg',
      category: 'wirtschaft',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['industrie', 'produktionsstätten', 'arbeitsplätze', '2023']
    }
  ],
  'steiermark': [
    {
      id: 'steiermark-hist-1',
      title: 'Steiermark: Graz plant Mega-Wohnbauprojekt',
      description: 'Die steirische Landeshauptstadt plant ein Mega-Wohnbauprojekt. Bis zu 5000 neue Wohnungen sollen entstehen.',
      url: 'https://example.com/graz-mega-wohnbau-2023',
      publishedAt: new Date(Date.now() - 11 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 11 Monate zurück
      source: 'Kleine Zeitung',
      region: 'Steiermark',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['graz', 'mega-projekt', '5000-wohnungen', '2023']
    }
  ],
  'kaernten': [
    {
      id: 'kaernten-hist-1',
      title: 'Kärnten: Seenregion wird zum Ferienimmobilien-Paradies',
      description: 'Die Kärntner Seenregion entwickelt sich zum Ferienimmobilien-Paradies. Deutsche Käufer dominieren den Markt.',
      url: 'https://example.com/kaernten-seenregion-paradies-2023',
      publishedAt: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 3 Monate zurück
      source: 'Kärntner Krone',
      region: 'Kärnten',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['seenregion', 'ferienimmobilien', 'paradies', '2023']
    }
  ],
  'burgenland': [
    {
      id: 'burgenland-hist-1',
      title: 'Burgenland: Neue Autobahn macht Region attraktiv',
      description: 'Die neue Autobahnverbindung macht das Burgenland für Immobilienkäufer attraktiv. Preise steigen kontinuierlich.',
      url: 'https://example.com/burgenland-autobahn-2023',
      publishedAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 12 Monate zurück
      source: 'Burgenländische Volkszeitung',
      region: 'Burgenland',
      category: 'immobilien',
      sentiment: 'positive',
      importance: 'high',
      featured: true,
      tags: ['autobahn', 'infrastruktur', 'attraktivität', '2023']
    }
  ]
};

// Region-Mapping für verschiedene Schreibweisen
const REGION_MAPPING: Record<string, string> = {
  'wien': 'wien',
  'vienna': 'wien',
  'niederoesterreich': 'niederoesterreich',
  'nö': 'niederoesterreich',
  'noe': 'niederoesterreich',
  'oberoesterreich': 'oberoesterreich',
  'oö': 'oberoesterreich',
  'ooe': 'oberoesterreich',
  'salzburg': 'salzburg',
  'tirol': 'tirol',
  'vorarlberg': 'vorarlberg',
  'steiermark': 'steiermark',
  'kaernten': 'kaernten',
  'kärnten': 'kaernten',
  'burgenland': 'burgenland'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region')?.toLowerCase() || 'wien';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '5');
    const featured = searchParams.get('featured') === 'true';
    const importance = searchParams.get('importance') || 'all';
    const includeHistorical = searchParams.get('historical') === 'true';

    // Region normalisieren
    const normalizedRegion = REGION_MAPPING[region] || 'wien';
    
    // Aktuelle Nachrichten für die Region abrufen
    let articles = MOCK_NEWS[normalizedRegion] || MOCK_NEWS['wien'];
    
    // Historische Featured-News hinzufügen (bis zu 1 Jahr zurück)
    if (includeHistorical) {
      const historicalArticles = HISTORICAL_FEATURED_NEWS[normalizedRegion] || [];
      articles = [...articles, ...historicalArticles];
    }
    
    // Nach Kategorie filtern
    if (category !== 'all') {
      articles = articles.filter(article => article.category === category);
    }
    
    // Nach Wichtigkeit filtern
    if (importance !== 'all') {
      articles = articles.filter(article => article.importance === importance);
    }
    
    // Nach Featured-Status filtern
    if (featured) {
      articles = articles.filter(article => article.featured);
    }
    
    // Nach Veröffentlichungsdatum sortieren (neueste zuerst)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Limit anwenden
    articles = articles.slice(0, limit);

    const response: NewsResponse = {
      articles,
      totalResults: articles.length,
      region: normalizedRegion,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=1800', // 30 min
      },
    });
  } catch (error) {
    console.error('News API Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Nachrichten' },
      { status: 500 }
    );
  }
}
