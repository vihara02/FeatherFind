import { useEffect, useState } from 'react';
import { BirdTaxonSuggestion, searchBirdTaxa } from '../services/birdSearch';

interface BirdSearchState {
  suggestions: BirdTaxonSuggestion[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

interface CompletedBirdSearch {
  query: string;
  retryCount: number;
  suggestions: BirdTaxonSuggestion[];
  loading: boolean;
  error: string | null;
}

export function useBirdSearch(query: string): BirdSearchState {
  const [search, setSearch] = useState<CompletedBirdSearch>({
    query: '',
    retryCount: 0,
    suggestions: [],
    loading: false,
    error: null,
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return;

    const controller = new AbortController();
    let active = true;
    let timedOut = false;

    const debounce = setTimeout(() => {
      setSearch({
        query,
        retryCount,
        suggestions: [],
        loading: true,
        error: null,
      });
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 12_000);

      searchBirdTaxa(normalized, controller.signal)
        .then((results) => {
          if (active) {
            setSearch({ query, retryCount, suggestions: results, loading: false, error: null });
          }
        })
        .catch((cause: unknown) => {
          if (!active || (controller.signal.aborted && !timedOut)) return;
          console.error('Unable to search iNaturalist bird taxa:', cause);
          setSearch({
            query,
            retryCount,
            suggestions: [],
            loading: false,
            error: timedOut
              ? 'The online bird search timed out. Check your connection and try again.'
              : cause instanceof Error
                ? cause.message
                : 'Could not connect to iNaturalist. Check your connection and try again.',
          });
        })
        .finally(() => {
          clearTimeout(timeout);
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(debounce);
      controller.abort();
    };
  }, [query, retryCount]);

  const normalized = query.trim();
  const currentSearch = normalized.length >= 2 && search.query === query && search.retryCount === retryCount;
  return {
    suggestions: currentSearch ? search.suggestions : [],
    loading: normalized.length >= 2 && (!currentSearch || search.loading),
    error: currentSearch ? search.error : null,
    retry: () => setRetryCount((current) => current + 1),
  };
}
