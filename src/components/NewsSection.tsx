"use client";

import { useEffect, useState } from 'react';
import { ExternalLink, Clock, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { NewsArticle, NewsResponse } from '@/app/api/news/route';

interface NewsSectionProps {
  region?: string;
  className?: string;
  showFeatured?: boolean;
  showHistorical?: boolean;
  importanceFilter?: 'all' | 'high' | 'medium' | 'low';
}

export function NewsSection({ 
  region = 'wien', 
  className = '', 
  showFeatured = false,
  showHistorical = false,
  importanceFilter = 'all'
}: NewsSectionProps) {
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        
        // Query-Parameter für die API
        const params = new URLSearchParams({
          region,
          category: 'immobilien',
          limit: '5'
        });
        
        if (showFeatured) params.append('featured', 'true');
        if (showHistorical) params.append('historical', 'true');
        if (importanceFilter !== 'all') params.append('importance', importanceFilter);
        
        const response = await fetch(`/api/news?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newsData: NewsResponse = await response.json();
        setNews(newsData);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Abrufen der Nachrichten:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [region, showFeatured, showHistorical, importanceFilter]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3 text-emerald-600" />;
      case 'negative': return <TrendingDown className="w-3 h-3 text-red-600" />;
      case 'neutral': return <Minus className="w-3 h-3 text-gray-500" />;
      default: return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800';
      case 'negative': return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'neutral': return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Gerade eben';
    if (diffInHours === 1) return 'Vor 1 Stunde';
    if (diffInHours < 24) return `Vor ${diffInHours} Stunden`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Vor 1 Tag';
    return `Vor ${diffInDays} Tagen`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Immobilien-Nachrichten</h3>
          <MapPin className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            Lade Nachrichten...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Immobilien-Nachrichten</h3>
          <MapPin className="w-4 h-4 text-slate-500" />
        </div>
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          <p>Fehler beim Laden der Nachrichten</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!news || news.articles.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Immobilien-Nachrichten</h3>
          <MapPin className="w-4 h-4 text-slate-500" />
        </div>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>Keine Nachrichten verfügbar</p>
          <p className="text-sm mt-1">Für {region}</p>
        </div>
      </div>
    );
  }

    return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Immobilien-Nachrichten</h3>
          <MapPin className="w-3 h-3 text-slate-500" />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {news.region.charAt(0).toUpperCase() + news.region.slice(1)}
        </div>
      </div>
      
      <div className="space-y-3 md:space-y-2">
        {news.articles.map((article) => (
          <article
            key={article.id}
            className={`p-3 md:p-2 rounded-lg border ${getSentimentColor(article.sentiment)} transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-start gap-2 md:gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSentimentIcon(article.sentiment)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm md:text-xs leading-tight line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex gap-1">
                    {article.featured && (
                      <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
                        Featured
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      article.importance === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                      article.importance === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                      'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                    }`}>
                      {article.importance === 'high' ? 'Hoch' : 
                       article.importance === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                  {article.description}
                </p>
                
                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {article.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                        >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                    <span>•</span>
                    <span>{article.source}</span>
                  </div>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>Lesen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Letzte Aktualisierung: {new Date(news.lastUpdated).toLocaleTimeString('de-AT')}
        </div>
      </div>
    </div>
  );
}

export default NewsSection;
