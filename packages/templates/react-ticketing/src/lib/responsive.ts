import { useEffect, useState } from 'react';

/** Subscribe to a media query. SSR-safe; re-renders on match changes. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Phone-sized viewports where the multi-column desktop layouts stop fitting. */
export const useIsMobile = () => useMediaQuery('(max-width: 760px)');
