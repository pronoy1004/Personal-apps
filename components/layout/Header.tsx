'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel from '@/components/search/FilterPanel';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ExportImport from '@/components/ui/ExportImport';
import ColumnManager from '@/components/kanban/ColumnManager';
import { FilterOptions } from '@/lib/types';
import { Filter, Archive, BarChart3, Settings, Activity, Menu, X } from 'lucide-react';

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableStatuses: string[];
  availableTags: string[];
}

export default function Header({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  availableStatuses,
  availableTags,
}: HeaderProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSettings && !target.closest('[data-settings-panel]') && !target.closest('[data-settings-button]')) {
        setShowSettings(false);
      }
      if (showFilters && !target.closest('[data-filter-panel]') && !target.closest('[data-filter-button]')) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings, showFilters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 sm:px-6 py-3 sm:py-4 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
          Pronoy&apos;s To-Do List
        </h1>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          <SearchBar value={searchValue} onChange={onSearchChange} />
          
          <Link
            href="/fitness"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 rounded-lg transition-colors"
            title="Fitness & Nutrition"
          >
            <Activity size={20} />
          </Link>
          <Link
            href="/stats"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 rounded-lg transition-colors"
            title="View statistics"
          >
            <BarChart3 size={20} />
          </Link>
          <Link
            href="/archive"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 rounded-lg transition-colors"
            title="View archived tasks"
          >
            <Archive size={20} />
          </Link>
          
          <button
            data-filter-button
            onClick={() => setShowFilters(!showFilters)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600'
            }`}
            aria-label="Filter tasks"
          >
            <Filter size={20} />
          </button>
          
          <div className="relative">
            <button
              data-settings-button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600'
              }`}
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            
            {showSettings && (
              <div 
                data-settings-panel
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 z-50 max-h-[calc(100vh-120px)] overflow-y-auto"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <ThemeToggle />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Management
                    </label>
                    <ExportImport />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Columns
                    </label>
                    <ColumnManager />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors active:bg-gray-300 dark:active:bg-gray-600"
          aria-label="Menu"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="mb-3">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/fitness"
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors active:bg-gray-300 dark:active:bg-gray-600"
              onClick={() => setShowMobileMenu(false)}
            >
              <Activity size={20} />
              <span>Fitness</span>
            </Link>
            <Link
              href="/stats"
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors active:bg-gray-300 dark:active:bg-gray-600"
              onClick={() => setShowMobileMenu(false)}
            >
              <BarChart3 size={20} />
              <span>Stats</span>
            </Link>
            <Link
              href="/archive"
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors active:bg-gray-300 dark:active:bg-gray-600"
              onClick={() => setShowMobileMenu(false)}
            >
              <Archive size={20} />
              <span>Archive</span>
            </Link>
            <button
              data-filter-button
              onClick={() => {
                setShowFilters(!showFilters);
                setShowMobileMenu(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-600'
              }`}
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>
            <button
              data-settings-button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
                setShowMobileMenu(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg transition-colors ${
                showSettings
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-600'
              }`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div data-filter-panel className="mt-4">
          <FilterPanel
            filters={filters}
            onChange={onFiltersChange}
            availableStatuses={availableStatuses}
            availableTags={availableTags}
          />
        </div>
      )}
    </header>
  );
}
