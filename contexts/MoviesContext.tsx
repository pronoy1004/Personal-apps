'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadMoviesData, loadMoviesDataAsync, saveMoviesData } from '@/lib/storage';
import type { MoviesData, MediaEntry, WatchEntry, UserPreferences } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface MoviesContextType {
  data: MoviesData | null;
  loading: boolean;
  addMediaEntry: (entry: Omit<MediaEntry, 'id' | 'addedAt'>) => MediaEntry;
  addToWatchlist: (mediaId: string) => void;
  addToWatched: (mediaId: string, rating?: 'thumbs_up' | 'thumbs_down', notes?: string) => void;
  removeFromList: (watchEntryId: string) => void;
  updateWatchEntry: (watchEntryId: string, updates: Partial<WatchEntry>) => void;
  rateItem: (watchEntryId: string, rating: 'thumbs_up' | 'thumbs_down' | null) => void;
  getWatchlist: () => WatchEntry[];
  getWatched: () => WatchEntry[];
  getMediaById: (mediaId: string) => MediaEntry | undefined;
  getWatchEntryByMediaId: (mediaId: string) => WatchEntry | undefined;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

export function MoviesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MoviesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoviesDataAsync()
      .then((moviesData) => {
        setData(moviesData);
        setLoading(false);
      })
      .catch(() => {
        const moviesData = loadMoviesData();
        setData(moviesData);
        setLoading(false);
      });
  }, []);

  const updateData = useCallback((updater: (data: MoviesData) => MoviesData) => {
    setData((current) => {
      if (!current) return current;
      const updated = updater(current);
      saveMoviesData(updated);
      return {
        ...updated,
        mediaEntries: [...updated.mediaEntries],
        watchEntries: [...updated.watchEntries],
      };
    });
  }, []);

  const addMediaEntry = useCallback((entry: Omit<MediaEntry, 'id' | 'addedAt'>): MediaEntry => {
    let mediaEntry: MediaEntry | undefined;
    
    updateData((data) => {
      // Check if media entry already exists by tmdbId and type
      const existing = data.mediaEntries.find(
        (e) => e.tmdbId === entry.tmdbId && e.type === entry.type
      );

      if (existing) {
        mediaEntry = existing;
        return data;
      }

      const newEntry: MediaEntry = {
        ...entry,
        id: generateId(),
        addedAt: new Date().toISOString(),
      };

      data.mediaEntries.push(newEntry);
      mediaEntry = newEntry;
      return data;
    });

    return mediaEntry!;
  }, [updateData]);

  const addToWatchlist = useCallback((mediaId: string) => {
    updateData((data) => {
      const existing = data.watchEntries.find(
        (e) => e.mediaId === mediaId && e.status === 'watchlist'
      );

      if (existing) {
        return data;
      }

      // Remove from watched if exists
      const watchedIndex = data.watchEntries.findIndex(
        (e) => e.mediaId === mediaId && e.status === 'watched'
      );
      if (watchedIndex >= 0) {
        data.watchEntries.splice(watchedIndex, 1);
      }

      const newEntry: WatchEntry = {
        id: generateId(),
        mediaId,
        status: 'watchlist',
        addedDate: new Date().toISOString(),
      };

      data.watchEntries.push(newEntry);
      return data;
    });
  }, [updateData]);

  const addToWatched = useCallback((
    mediaId: string,
    rating?: 'thumbs_up' | 'thumbs_down',
    notes?: string
  ) => {
    updateData((data) => {
      // Check if already watched
      const existing = data.watchEntries.find(
        (e) => e.mediaId === mediaId && e.status === 'watched'
      );

      if (existing) {
        // Update existing
        existing.rating = rating;
        existing.notes = notes;
        existing.watchedDate = existing.watchedDate || new Date().toISOString();
        return data;
      }

      // Remove from watchlist if exists
      const watchlistIndex = data.watchEntries.findIndex(
        (e) => e.mediaId === mediaId && e.status === 'watchlist'
      );
      if (watchlistIndex >= 0) {
        data.watchEntries.splice(watchlistIndex, 1);
      }

      const newEntry: WatchEntry = {
        id: generateId(),
        mediaId,
        status: 'watched',
        rating,
        watchedDate: new Date().toISOString(),
        addedDate: new Date().toISOString(),
        notes,
      };

      data.watchEntries.push(newEntry);
      return data;
    });
  }, [updateData]);

  const removeFromList = useCallback((watchEntryId: string) => {
    updateData((data) => {
      data.watchEntries = data.watchEntries.filter((e) => e.id !== watchEntryId);
      return data;
    });
  }, [updateData]);

  const updateWatchEntry = useCallback((watchEntryId: string, updates: Partial<WatchEntry>) => {
    updateData((data) => {
      const entry = data.watchEntries.find((e) => e.id === watchEntryId);
      if (entry) {
        Object.assign(entry, updates);
      }
      return data;
    });
  }, [updateData]);

  const rateItem = useCallback((watchEntryId: string, rating: 'thumbs_up' | 'thumbs_down' | null) => {
    updateData((data) => {
      const entry = data.watchEntries.find((e) => e.id === watchEntryId);
      if (entry) {
        entry.rating = rating || undefined;
      }
      return data;
    });
  }, [updateData]);

  const getWatchlist = useCallback((): WatchEntry[] => {
    if (!data) return [];
    return data.watchEntries.filter((e) => e.status === 'watchlist');
  }, [data]);

  const getWatched = useCallback((): WatchEntry[] => {
    if (!data) return [];
    return data.watchEntries.filter((e) => e.status === 'watched');
  }, [data]);

  const getMediaById = useCallback((mediaId: string): MediaEntry | undefined => {
    if (!data) return undefined;
    return data.mediaEntries.find((e) => e.id === mediaId);
  }, [data]);

  const getWatchEntryByMediaId = useCallback((mediaId: string): WatchEntry | undefined => {
    if (!data) return undefined;
    return data.watchEntries.find((e) => e.mediaId === mediaId);
  }, [data]);

  const value: MoviesContextType = {
    data,
    loading,
    addMediaEntry,
    addToWatchlist,
    addToWatched,
    removeFromList,
    updateWatchEntry,
    rateItem,
    getWatchlist,
    getWatched,
    getMediaById,
    getWatchEntryByMediaId,
  };

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}

export function useMovies() {
  const context = useContext(MoviesContext);
  if (!context) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
}

