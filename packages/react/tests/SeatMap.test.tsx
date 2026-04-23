import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SeatMap } from '../src/components/SeatMap/SeatMap';
import type { SeatRowData } from '../src/components/SeatMap/types';

function makeRows(): SeatRowData[] {
  return [
    {
      rowLabel: 'A',
      seats: [
        { id: 'A1', row: 'A', number: 1, state: 'available' },
        { id: 'A2', row: 'A', number: 2, state: 'available' },
        { id: 'A3', row: 'A', number: 3, state: 'taken' },
      ],
    },
    {
      rowLabel: 'B',
      seats: [
        { id: 'B1', row: 'B', number: 1, state: 'premium' },
        { id: 'B2', row: 'B', number: 2, state: 'wheelchair' },
        { id: 'B3', row: 'B', number: 3, state: 'companion' },
      ],
    },
  ];
}

describe('SeatMap', () => {
  it('renders the screen label', () => {
    render(
      <SeatMap
        rows={makeRows()}
        selectedSeatIds={new Set()}
        onSeatSelect={vi.fn()}
        screenLabel="Screen 3 — Embassy Wellington"
      />,
    );
    expect(screen.getByText('Screen 3 — Embassy Wellington')).toBeInTheDocument();
  });

  it('renders all seats', () => {
    render(<SeatMap rows={makeRows()} selectedSeatIds={new Set()} onSeatSelect={vi.fn()} />);
    expect(screen.getByLabelText('Seat A1 — Available')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat A3 — Taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat B1 — Premium')).toBeInTheDocument();
  });

  it('calls onSeatSelect when an available seat is clicked', () => {
    const onSelect = vi.fn();
    render(<SeatMap rows={makeRows()} selectedSeatIds={new Set()} onSeatSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Seat A1 — Available'));
    expect(onSelect).toHaveBeenCalledWith('A1');
  });

  it('does not call onSeatSelect for a taken seat', () => {
    const onSelect = vi.fn();
    render(<SeatMap rows={makeRows()} selectedSeatIds={new Set()} onSeatSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Seat A3 — Taken'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders a selected seat with selected state', () => {
    render(
      <SeatMap
        rows={makeRows()}
        selectedSeatIds={new Set(['A1'])}
        onSeatSelect={vi.fn()}
      />,
    );
    const seat = screen.getByLabelText('Seat A1 — Selected');
    expect(seat).toHaveAttribute('aria-checked', 'true');
  });

  it('enforces maxSelectable — does not call onSeatSelect when limit is reached', () => {
    const onSelect = vi.fn();
    render(
      <SeatMap
        rows={makeRows()}
        selectedSeatIds={new Set(['A1'])}
        onSeatSelect={onSelect}
        maxSelectable={1}
      />,
    );
    fireEvent.click(screen.getByLabelText('Seat A2 — Available'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows seat count when maxSelectable is provided', () => {
    render(
      <SeatMap
        rows={makeRows()}
        selectedSeatIds={new Set(['A1'])}
        onSeatSelect={vi.fn()}
        maxSelectable={2}
      />,
    );
    expect(screen.getByText('1 of 2 seats selected')).toBeInTheDocument();
  });

  it('does not fire onSeatSelect when disabled', () => {
    const onSelect = vi.fn();
    render(
      <SeatMap rows={makeRows()} selectedSeatIds={new Set()} onSeatSelect={onSelect} disabled />,
    );
    fireEvent.click(screen.getByLabelText('Seat A1 — Available'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the seat legend', () => {
    render(<SeatMap rows={makeRows()} selectedSeatIds={new Set()} onSeatSelect={vi.fn()} />);
    expect(screen.getByLabelText('Seat legend')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('renders row labels', () => {
    render(<SeatMap rows={makeRows()} selectedSeatIds={new Set()} onSeatSelect={vi.fn()} />);
    expect(screen.getByLabelText('Row A')).toBeInTheDocument();
    expect(screen.getByLabelText('Row B')).toBeInTheDocument();
  });
});
