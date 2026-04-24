import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionPicker } from '../src/components/SessionPicker/SessionPicker';
import type { SessionCardData } from '../src/components/SessionPicker/SessionCard';

const MOCK_SESSIONS: SessionCardData[] = [
  {
    id: 'ses-001',
    filmTitle: 'The Holdovers',
    startTime: '13:30',
    screenName: 'Screen 1',
    format: '2D',
    priceFrom: 18.5,
    currency: '$',
  },
  {
    id: 'ses-002',
    filmTitle: 'The Holdovers',
    startTime: '19:15',
    screenName: 'Screen 3',
    format: 'IMAX',
    priceFrom: 24.0,
    currency: '$',
    availableSeats: 6,
  },
  {
    id: 'ses-003',
    filmTitle: 'Poor Things',
    startTime: '20:30',
    screenName: 'Screen 2',
    format: '2D',
    priceFrom: 18.5,
    currency: '$',
  },
];

describe('SessionPicker', () => {
  it('renders group labels when grouping by film', () => {
    render(
      <SessionPicker
        sessions={MOCK_SESSIONS}
        selectedDate="2026-04-25"
        onSessionSelect={vi.fn()}
        groupBy="film"
      />,
    );
    expect(screen.getByText('The Holdovers')).toBeInTheDocument();
    expect(screen.getByText('Poor Things')).toBeInTheDocument();
  });

  it('renders session cards', () => {
    render(
      <SessionPicker
        sessions={MOCK_SESSIONS}
        onSessionSelect={vi.fn()}
        groupBy="film"
        selectedDate="2026-04-25"
      />,
    );
    expect(screen.getByText('13:30')).toBeInTheDocument();
    expect(screen.getByText('19:15')).toBeInTheDocument();
    expect(screen.getByText('20:30')).toBeInTheDocument();
  });

  it('groups sessions by time of day', () => {
    render(
      <SessionPicker
        sessions={MOCK_SESSIONS}
        onSessionSelect={vi.fn()}
        groupBy="time"
        selectedDate="2026-04-25"
      />,
    );
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('calls onSessionSelect when a session card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SessionPicker sessions={MOCK_SESSIONS} onSessionSelect={onSelect} groupBy="film" selectedDate="2026-04-25" />,
    );
    fireEvent.click(screen.getByLabelText('13:30 — Screen 1 — 2D'));
    expect(onSelect).toHaveBeenCalledWith('ses-001');
  });

  it('marks selected session with aria-pressed', () => {
    render(
      <SessionPicker
        sessions={MOCK_SESSIONS}
        selectedSessionId="ses-002"
        onSessionSelect={vi.fn()}
        groupBy="film"
        selectedDate="2026-04-25"
      />,
    );
    const selectedCard = screen.getByLabelText('19:15 — Screen 3 — IMAX');
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows low availability warning when seats <= 10', () => {
    render(
      <SessionPicker sessions={MOCK_SESSIONS} onSessionSelect={vi.fn()} groupBy="film" selectedDate="2026-04-25" />,
    );
    expect(screen.getByText('6 seats left')).toBeInTheDocument();
  });

  it('shows empty message when sessions array is empty', () => {
    render(
      <SessionPicker
        sessions={[]}
        onSessionSelect={vi.fn()}
        groupBy="film"
        selectedDate="2026-04-25"
        emptyMessage="No sessions for this day."
      />,
    );
    expect(screen.getByText('No sessions for this day.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <SessionPicker sessions={[]} onSessionSelect={vi.fn()} groupBy="film" selectedDate="2026-04-25" isLoading />,
    );
    expect(screen.getByText('Loading sessions…')).toBeInTheDocument();
  });

  it('calls onDateChange when a date is selected', () => {
    const onDateChange = vi.fn();
    render(
      <SessionPicker
        sessions={MOCK_SESSIONS}
        onSessionSelect={vi.fn()}
        groupBy="film"
        selectedDate="2026-04-25"
        onDateChange={onDateChange}
        dayCount={3}
      />,
    );
    const dateButtons = screen.getAllByRole('option');
    fireEvent.click(dateButtons[1]);
    expect(onDateChange).toHaveBeenCalled();
  });
});
