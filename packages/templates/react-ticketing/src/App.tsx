/// <reference types="vite/client" />
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { TheatricalThemeProvider } from '@theatrical/react';
import { TheatricalClient } from '@theatrical/sdk';
import { BookingProvider, useBooking } from './context/BookingContext';
import { Home } from './pages/Home';
import { FilmPage } from './pages/Film';
import { BookingPage } from './pages/Booking';
import { ConfirmationPage } from './pages/Confirmation';

const isMock = import.meta.env.VITE_THEATRICAL_MOCK !== 'false';

const client = isMock
  ? TheatricalClient.createMock()
  : TheatricalClient.create({
      apiKey: import.meta.env.VITE_THEATRICAL_API_KEY ?? '',
      environment: (import.meta.env.VITE_THEATRICAL_ENV ?? 'sandbox') as 'sandbox' | 'staging' | 'production',
    });

function Nav() {
  const { state, dispatch } = useBooking();
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid #D6D0C4',
        background: '#F0EDE6',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#1B2D4F', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          theatrical
        </span>
        {isMock && (
          <span style={{ marginLeft: 8, fontSize: 10, color: '#8A8578', background: '#EBE6DA', padding: '2px 6px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
            MOCK
          </span>
        )}
      </NavLink>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {state.film && (
          <span style={{ fontSize: 13, color: '#1A1A1A' }}>{state.film.title}</span>
        )}
        {state.session && (
          <span style={{ fontSize: 12, color: '#8A8578', fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(state.session.startTime).toLocaleTimeString('en-NZ', {
              hour: '2-digit', minute: '2-digit', hour12: true,
            })}
          </span>
        )}
        {state.selectedSeatIds.length > 0 && (
          <span style={{ fontSize: 12, color: '#D4622B', fontWeight: 600 }}>
            {state.selectedSeatIds.length} seat{state.selectedSeatIds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <TheatricalThemeProvider>
      <BrowserRouter>
        <BookingProvider client={client}>
          <div style={{ minHeight: '100vh', background: '#F0EDE6' }}>
            <Nav />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/film/:filmId" element={<FilmPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
            </Routes>
          </div>
        </BookingProvider>
      </BrowserRouter>
    </TheatricalThemeProvider>
  );
}
