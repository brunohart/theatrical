import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderSummary } from '../src/components/OrderSummary/OrderSummary';
import type { OrderLineItem, PriceBreakdownData } from '../src/components/OrderSummary/types';

const MOCK_LINE_ITEMS: OrderLineItem[] = [
  {
    id: 'ticket-001',
    type: 'ticket',
    label: 'Adult — The Holdovers',
    description: 'Seat B4 · IMAX',
    quantity: 1,
    unitPrice: 24.0,
    totalPrice: 24.0,
    currency: '$',
  },
  {
    id: 'ticket-002',
    type: 'ticket',
    label: 'Adult — The Holdovers',
    description: 'Seat B5 · IMAX',
    quantity: 1,
    unitPrice: 24.0,
    totalPrice: 24.0,
    currency: '$',
  },
  {
    id: 'fnb-001',
    type: 'fnb',
    label: 'Large Popcorn Combo',
    quantity: 1,
    unitPrice: 14.5,
    totalPrice: 14.5,
    currency: '$',
  },
];

const MOCK_BREAKDOWN: PriceBreakdownData = {
  subtotal: 62.5,
  tax: 8.15,
  taxLabel: 'GST included',
  discounts: [{ label: 'Tuesday discount', amount: 4.0 }],
  loyaltyPointsRedeemed: 200,
  loyaltyDiscount: 5.0,
  serviceFee: 1.5,
  total: 55.0,
  currency: '$',
};

describe('OrderSummary', () => {
  it('renders the order summary heading', () => {
    render(<OrderSummary lineItems={MOCK_LINE_ITEMS} priceBreakdown={MOCK_BREAKDOWN} />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('renders all line items', () => {
    render(<OrderSummary lineItems={MOCK_LINE_ITEMS} priceBreakdown={MOCK_BREAKDOWN} />);
    const holdoversItems = screen.getAllByText('Adult — The Holdovers');
    expect(holdoversItems).toHaveLength(2);
    expect(screen.getByText('Large Popcorn Combo')).toBeInTheDocument();
  });

  it('renders seat descriptions in line items', () => {
    render(<OrderSummary lineItems={MOCK_LINE_ITEMS} priceBreakdown={MOCK_BREAKDOWN} />);
    expect(screen.getByText('Seat B4 · IMAX')).toBeInTheDocument();
  });

  it('renders price breakdown — subtotal and total', () => {
    render(<OrderSummary lineItems={MOCK_LINE_ITEMS} priceBreakdown={MOCK_BREAKDOWN} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$55.00')).toBeInTheDocument();
  });

  it('renders discount line in price breakdown', () => {
    render(<OrderSummary lineItems={MOCK_LINE_ITEMS} priceBreakdown={MOCK_BREAKDOWN} />);
    expect(screen.getByText('Tuesday discount')).toBeInTheDocument();
  });

  it('renders loyalty points redemption', () => {
    render(<OrderSummary lineItems={MOCK_LINE_ITEMS} priceBreakdown={MOCK_BREAKDOWN} />);
    expect(screen.getByText('Loyalty points (200 pts)')).toBeInTheDocument();
  });

  it('renders session details when provided', () => {
    render(
      <OrderSummary
        lineItems={MOCK_LINE_ITEMS}
        priceBreakdown={MOCK_BREAKDOWN}
        sessionDetails={{
          filmTitle: 'The Holdovers',
          cinema: 'Embassy Theatre Wellington',
          screenName: 'Screen 1',
          startTime: '2026-04-25T19:15:00',
          format: 'IMAX',
          seats: ['B4', 'B5'],
        }}
      />,
    );
    expect(screen.getByText('The Holdovers')).toBeInTheDocument();
    expect(screen.getByText('Embassy Theatre Wellington · Screen 1')).toBeInTheDocument();
    expect(screen.getByText('Seats: B4, B5')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<OrderSummary lineItems={[]} priceBreakdown={MOCK_BREAKDOWN} isLoading />);
    expect(screen.getByText('Loading order…')).toBeInTheDocument();
  });
});
