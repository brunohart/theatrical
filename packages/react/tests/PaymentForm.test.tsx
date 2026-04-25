import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaymentForm } from '../src/components/PaymentForm/PaymentForm';

describe('PaymentForm', () => {
  it('renders the payment heading', () => {
    render(<PaymentForm amountMinor={4294} />);
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('renders the pay button with formatted amount', () => {
    render(<PaymentForm amountMinor={5500} currency="NZD" />);
    expect(screen.getByRole('button', { name: /Pay.*55\.00/i })).toBeInTheDocument();
  });

  it('renders placeholder when no paymentSlot is provided', () => {
    render(<PaymentForm amountMinor={5500} />);
    expect(screen.getByText(/Payment provider not configured/i)).toBeInTheDocument();
  });

  it('renders custom paymentSlot when provided', () => {
    render(<PaymentForm amountMinor={5500} paymentSlot={<div>Adyen Drop-in</div>} />);
    expect(screen.getByText('Adyen Drop-in')).toBeInTheDocument();
  });

  it('disables the confirm button when disabled prop is true', () => {
    render(<PaymentForm amountMinor={5500} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows processing state while payment is in progress', async () => {
    render(<PaymentForm amountMinor={5500} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('shows confirmed state and calls onPaymentComplete after success', async () => {
    const onComplete = vi.fn();
    render(<PaymentForm amountMinor={5500} onPaymentComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Confirmed')).toBeInTheDocument(), { timeout: 3000 });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
