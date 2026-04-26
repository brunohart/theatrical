import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { TheatricalThemeProvider } from '@theatrical/react';
import { BookingProvider } from './context/BookingContext';
import { Home } from './pages/Home';
import { Film } from './pages/Film';
import { Booking } from './pages/Booking';
import { Confirmation } from './pages/Confirmation';

function Nav() {
  const location = useLocation();
  const isConfirmation = location.pathname === '/confirmation';

  return (
    <nav
      style={{
        borderBottom: '1px solid #1a1a2e',
        padding: '0.875rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0a0a0a',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}
    >
      <NavLink
        to="/"
        style={{
          textDecoration: 'none',
          fontWeight: 800,
          fontSize: '1.1rem',
          letterSpacing: '-0.02em',
          color: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🎭</span>
        CinemaBook
      </NavLink>

      {isConfirmation && (
        <span
          style={{
            fontSize: '0.78rem',
            color: '#48bb78',
            background: '#1a2e1a',
            border: '1px solid #276749',
            borderRadius: 4,
            padding: '3px 10px',
            fontWeight: 600,
          }}
        >
          Booking Confirmed
        </span>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <TheatricalThemeProvider>
      <BookingProvider>
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f5' }}>
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/film/:filmId" element={<Film />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/confirmation" element={<Confirmation />} />
          </Routes>

          <footer
            style={{
              borderTop: '1px solid #1a1a2e',
              padding: '1.5rem',
              textAlign: 'center',
              color: '#4a5568',
              fontSize: '0.78rem',
              marginTop: '4rem',
            }}
          >
            Built with{' '}
            <a
              href="https://theatrical.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#718096', textDecoration: 'none' }}
            >
              @theatrical/sdk
            </a>{' '}
            &amp;{' '}
            <a
              href="https://theatrical.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#718096', textDecoration: 'none' }}
            >
              @theatrical/react
            </a>
          </footer>
        </div>
      </BookingProvider>
    </TheatricalThemeProvider>
  );
}
