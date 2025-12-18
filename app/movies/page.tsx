'use client';

import { useState } from 'react';
import { MoviesProvider } from '@/contexts/MoviesContext';
import MovieSearch from '@/components/movies/MovieSearch';
import Watchlist from '@/components/movies/Watchlist';
import Watched from '@/components/movies/Watched';
import Recommendations from '@/components/movies/Recommendations';
import { Search, List, CheckCircle, Sparkles, Download } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import OnlineStatus from '@/components/ui/OnlineStatus';

type Tab = 'search' | 'watchlist' | 'watched' | 'recommendations';

function MoviesDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/movies/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movies-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movies-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Movies & TV Shows</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your watched content and discover new recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download size={18} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Tabs - Desktop */}
      <div className="hidden md:flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'search'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search size={18} />
            Search
          </div>
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'watchlist'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <List size={18} />
            Watchlist
          </div>
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'watched'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            Watched
          </div>
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'recommendations'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            Recommendations
          </div>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-30 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'search'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <Search size={20} />
            <span className="text-xs mt-1 font-medium">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'watchlist'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <List size={20} />
            <span className="text-xs mt-1 font-medium">Watchlist</span>
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'watched'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <CheckCircle size={20} />
            <span className="text-xs mt-1 font-medium">Watched</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
              activeTab === 'recommendations'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
            }`}
          >
            <Sparkles size={20} />
            <span className="text-xs mt-1 font-medium">Recs</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 md:mt-6 pb-20 md:pb-6">
        {activeTab === 'search' && <MovieSearch />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'watched' && <Watched />}
        {activeTab === 'recommendations' && <Recommendations />}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <MoviesProvider>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <MoviesDashboard />
        </div>
        <OnlineStatus />
      </AppLayout>
    </MoviesProvider>
  );
}

