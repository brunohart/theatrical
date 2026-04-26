import React, { createContext, useContext, useReducer } from 'react';
import type { TheatricalClient } from '@theatrical/sdk';
import type { Film } from '@theatrical/sdk';
import type { Session } from '@theatrical/sdk';
import type { Order } from '@theatrical/sdk';
import type { LoyaltyMember } from '@theatrical/sdk';

export interface BookingState {
  film: Film | null;
  session: Session | null;
  selectedSeatIds: string[];
  order: Order | null;
  member: LoyaltyMember | null;
}

type BookingAction =
  | { type: 'SELECT_FILM'; film: Film }
  | { type: 'SELECT_SESSION'; session: Session }
  | { type: 'SELECT_SEATS'; seatIds: string[] }
  | { type: 'SET_ORDER'; order: Order }
  | { type: 'SET_MEMBER'; member: LoyaltyMember }
  | { type: 'RESET' };

const initialState: BookingState = {
  film: null,
  session: null,
  selectedSeatIds: [],
  order: null,
  member: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_FILM':
      return { ...initialState, film: action.film };
    case 'SELECT_SESSION':
      return { ...state, session: action.session, selectedSeatIds: [], order: null };
    case 'SELECT_SEATS':
      return { ...state, selectedSeatIds: action.seatIds };
    case 'SET_ORDER':
      return { ...state, order: action.order };
    case 'SET_MEMBER':
      return { ...state, member: action.member };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface BookingContextValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  client: TheatricalClient;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({
  children,
  client,
}: {
  children: React.ReactNode;
  client: TheatricalClient;
}) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  return (
    <BookingContext.Provider value={{ state, dispatch, client }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
