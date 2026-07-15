'use client';

import { useState, useCallback } from 'react';
import { generateInsights } from '@/lib/api/ai-insights';
import { useFitness } from '@/hooks/useFitness';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const CACHE_KEY = 'fitness-ai-insights';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedInsights {
  insights: string;
  timestamp: number;
}

function getCachedInsights(): string | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedInsights = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data.insights;
  } catch {
    return null;
  }
}

function setCachedInsights(insights: string): void {
  try {
    const data: CachedInsights = {
      insights,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export default function AIInsights() {
  const { data } = useFitness();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate available data days dynamically
  const calculateAvailableDays = useCallback((): number | undefined => {
    if (!data) return undefined;

    const now = new Date();
    let oldestTime: number | null = null;
    const consider = (t: number) => {
      if (!Number.isNaN(t) && (oldestTime === null || t < oldestTime)) oldestTime = t;
    };

    // Find oldest entry from all data types
    data.foodEntries.forEach((e) => consider(new Date(e.timestamp).getTime()));
    data.weightEntries.forEach((e) => consider(new Date(e.date).getTime()));
    data.workoutEntries.forEach((e) => consider(new Date(e.date).getTime()));

    if (oldestTime === null) return undefined;

    // Calculate days between oldest and now
    const days = Math.ceil((now.getTime() - oldestTime) / (24 * 60 * 60 * 1000));
    // Use minimum of available days and 30 for reasonable analysis
    return Math.min(Math.max(days, 1), 30);
  }, [data]);

  const handleGenerate = useCallback(async (forceRefresh = false) => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedInsights();
      if (cached) {
        setInsights(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate available days dynamically
      const availableDays = calculateAvailableDays();
      const generatedInsights = await generateInsights(availableDays);
      setInsights(generatedInsights);
      setCachedInsights(generatedInsights);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [calculateAvailableDays]);

  const handleRefresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    handleGenerate(true);
  }, [handleGenerate]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Insights</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personalized analysis of your fitness journey
            </p>
          </div>
        </div>
        {insights && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Analyzing your data and generating insights...
          </p>
        </div>
      )}

      {!loading && !insights && !error && (
        <div className="text-center py-12">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Get AI-Powered Insights
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get personalized analysis of your fitness data, including weight trends, nutrition patterns, workout consistency, and actionable recommendations.
          </p>
          <button
            onClick={() => handleGenerate(false)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Get AI Insights
          </button>
        </div>
      )}

      {!loading && insights && (
        <div className="space-y-6">
          {formatMarkdownInsights(insights)}
        </div>
      )}
    </div>
  );
}

// Helper function to format markdown insights
function formatMarkdownInsights(markdown: string): JSX.Element[] {
  const sections: JSX.Element[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Check for TLDR Summary section
    if (line.match(/^###?\s*TLDR\s*(Summary)?/i)) {
      let tldrContent = '';
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine.match(/^###/)) break; // Stop at next section
        if (nextLine) {
          tldrContent += nextLine + ' ';
        }
        i++;
      }
      
      sections.push(
        <div key="tldr" className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800 mb-6">
          <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            TLDR Summary
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{tldrContent.trim()}</p>
        </div>
      );
      continue;
    }

    // Check for ### headings (Key Observations, Strengths, etc.)
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      const headingText = headingMatch[1].trim();
      sections.push(
        <div key={`heading-${sections.length}`} className="pt-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b-2 border-purple-500 dark:border-purple-400 pb-2">
            {headingText}
          </h2>
        </div>
      );
      i++;
      
      // Process items under this heading
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        
        // Stop at next section heading
        if (nextLine && nextLine.match(/^###/)) break;
        
        if (!nextLine) {
          i++;
          continue;
        }
        
        // Check for numbered item with bold: "1. **Title**: content" or "1 **Title**: content"
        // Also handle malformed: "1. **1. **Title**: content" by cleaning it up
        let cleanedLine = nextLine.replace(/^(\d+)\.\s*\*\*\d+\.\s*\*\*/, '$1. **'); // Fix double numbering
        const numberedWithBoldMatch = cleanedLine.match(/^(\d+)\.\s+\*\*([^*]+)\*\*:\s*(.+)$/);
        if (numberedWithBoldMatch) {
          const [, number, title, initialContent] = numberedWithBoldMatch;
          let fullContent = initialContent;
          i++;
          
          // Collect any following lines that are part of this item (until next numbered item or empty line + next section)
          while (i < lines.length) {
            const peekLine = lines[i];
            const trimmedPeek = peekLine.trim();
            
            if (!trimmedPeek) {
              // Empty line might mean end of item, but check next line
              if (i + 1 < lines.length) {
                const nextPeek = lines[i + 1].trim();
                if (nextPeek && (nextPeek.match(/^\d+\.\s/) || nextPeek.match(/^\d+$/) || nextPeek.match(/^###/))) {
                  break; // Next is a new item or section
                }
              }
              // Preserve single empty line as space
              if (fullContent && !fullContent.endsWith('\n\n')) {
                fullContent += '\n\n';
              }
              i++;
              continue;
            }
            
            if (trimmedPeek.match(/^\d+\.\s/) || trimmedPeek.match(/^\d+$/) || trimmedPeek.match(/^###/)) {
              break; // Next numbered item or section
            }
            
            // Add line with proper spacing
            if (fullContent && !fullContent.endsWith(' ') && !fullContent.endsWith('\n')) {
              fullContent += ' ';
            }
            fullContent += trimmedPeek;
            i++;
          }
          
          const isRecommendation = headingText.toLowerCase().includes('recommendation');
          sections.push(
            <div key={`item-${sections.length}`} className={`${isRecommendation ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-gray-50 dark:bg-gray-700/50 border-purple-500'} rounded-lg p-4 border-l-4 mb-3`}>
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-8 h-8 ${isRecommendation ? 'bg-green-500' : 'bg-purple-500'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                  {number}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{fullContent.trim()}</p>
                </div>
              </div>
            </div>
          );
          continue;
        }
        
        // Check for standalone number on its own line, then bold title on next line
        const standaloneNumberMatch = nextLine.match(/^(\d+)$/);
        if (standaloneNumberMatch) {
          const number = standaloneNumberMatch[1];
          i++;
          
          // Skip empty lines
          while (i < lines.length && !lines[i].trim()) {
            i++;
          }
          
          // Get the next non-empty line which should have the bold title and content
          if (i < lines.length) {
            let contentLine = lines[i].trim();
            // Fix double numbering issues
            contentLine = contentLine.replace(/^\*\*\d+\.\s*\*\*/, '**');
            
            const boldMatch = contentLine.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
            if (boldMatch) {
              const [, title, initialContent] = boldMatch;
              let fullContent = initialContent;
              i++;
              
              // Collect any following lines
              while (i < lines.length) {
                const peekLine = lines[i];
                const trimmedPeek = peekLine.trim();
                
                if (!trimmedPeek) {
                  if (i + 1 < lines.length) {
                    const nextPeek = lines[i + 1].trim();
                    if (nextPeek && (nextPeek.match(/^\d+$/) || nextPeek.match(/^\d+\./) || nextPeek.match(/^###/))) {
                      break;
                    }
                  }
                  // Preserve single empty line as space
                  if (fullContent && !fullContent.endsWith('\n\n')) {
                    fullContent += '\n\n';
                  }
                  i++;
                  continue;
                }
                
                if (trimmedPeek.match(/^\d+$/) || trimmedPeek.match(/^\d+\./) || trimmedPeek.match(/^###/)) {
                  break;
                }
                
                // Add line with proper spacing
                if (fullContent && !fullContent.endsWith(' ') && !fullContent.endsWith('\n')) {
                  fullContent += ' ';
                }
                fullContent += trimmedPeek;
                i++;
              }
              
              const isRecommendation = headingText.toLowerCase().includes('recommendation');
              sections.push(
                <div key={`item-${sections.length}`} className={`${isRecommendation ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-gray-50 dark:bg-gray-700/50 border-purple-500'} rounded-lg p-4 border-l-4 mb-3`}>
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 ${isRecommendation ? 'bg-green-500' : 'bg-purple-500'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                      {number}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{fullContent.trim()}</p>
                    </div>
                  </div>
                </div>
              );
              continue;
            }
          }
          continue;
        }
        
        // Check for bold text items without numbers (e.g., "**High Protein Intake**: ...")
        const boldMatch = nextLine.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
        if (boldMatch) {
          const [, title, content] = boldMatch;
          sections.push(
            <div key={`bold-${sections.length}`} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500 mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{content.trim()}</p>
            </div>
          );
          i++;
          continue;
        }
        
        // Regular paragraph
        sections.push(
          <p key={`para-${sections.length}`} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
            {nextLine}
          </p>
        );
        i++;
      }
      continue;
    }

    // Regular paragraph (not a heading, not numbered)
    sections.push(
      <p key={`para-${sections.length}`} className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {line}
      </p>
    );
    i++;
  }

  return sections;
}

