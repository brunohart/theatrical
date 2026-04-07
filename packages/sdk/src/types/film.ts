/** A film available for screening */
export interface Film {
  id: string;
  title: string;
  synopsis: string;
  genres: Genre[];
  runtime: number;
  rating: Rating;
  releaseDate: string;
  posterUrl?: string;
  trailerUrl?: string;
  cast: CastMember[];
  director: string;
  distributor?: string;
  isNowShowing: boolean;
  isComingSoon: boolean;
}

export type Genre = 'action' | 'adventure' | 'animation' | 'comedy' | 'crime' | 'documentary' |
  'drama' | 'family' | 'fantasy' | 'horror' | 'musical' | 'mystery' | 'romance' |
  'sci-fi' | 'thriller' | 'war' | 'western' | string;

export interface Rating {
  classification: string;
  description?: string;
}

export interface CastMember {
  name: string;
  role?: string;
}

export interface FilmFilter {
  siteId?: string;
  genre?: Genre;
  query?: string;
  nowShowing?: boolean;
  comingSoon?: boolean;
  limit?: number;
  offset?: number;
}
