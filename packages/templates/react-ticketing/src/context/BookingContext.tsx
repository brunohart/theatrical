import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { SessionCardData } from '@theatrical/react';
import type { MockFilm } from '../data/mock';

interface BookingState {
  selectedFilm: MockFilm | null;
  selectedSession: SessionCardData | null;
  selectedSeatIds: Set<string>;
  ticketCount: number;
  confirmationRef: string | null;
}

type BookingAction =
  | { type: 'SELECT_FILM'; film: MockFilm }
  | { type: 'SELECT_SESSION'; session: SessionCardData }
  | { type: 'TOGGLE_SEAT'; seatId: string }
  | { type: 'CONFIRM'; ref: string }
  | { type: 'RESET' };

const initialState: BookingState = {
  selectedFilm: null,
  selectedSession: null,
  selectedSeatIds: new Set(),
  ticketCount: 1,
  confirmationRef: null,
};

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_FILM':
      return { ...initialState, selectedFilm: action.film };
    case 'SELECT_SESSION':
      return { ...state, selectedSession: action.session, selectedSeatIds: new Set() };
    case 'TOGGLE_SEAT': {
      const next = new Set(state.selectedSeatIds);
      if (next.has(action.seatId)) {
        next.delete(action.seatId);
      } else {
        next.add(action.seatId);
      }
      return { ...state, selectedSeatIds: next, ticketCount: next.size };
    }
    case 'CONFIRM':
      return { ...state, confirmationRef: action.ref };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface BookingContextValue {
  state: BookingState;
  selectFilm: (film: MockFilm) => void;
  selectSession: (session: SessionCardData) => void;
  toggleSeat: (seatId: string) => void;
  confirm: (ref: string) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: BookingContextValue = {
    state,
    selectFilm: (film) => dispatch({ type: 'SELECT_FILM', film }),
    selectSession: (session) => dispatch({ type: 'SELECT_SESSION', session }),
    toggleSeat: (seatId) => dispatch({ type: 'TOGGLE_SEAT', seatId }),
    confirm: (ref) => dispatch({ type: 'CONFIRM', ref }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
