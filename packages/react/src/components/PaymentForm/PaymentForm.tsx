import React, { useState } from 'react';
import { tokens } from '../../tokens';

type PaymentProvider = 'adyen' | 'stripe' | 'custom';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

interface PaymentFormProps {
  /** Total amount to charge, in minor currency units (e.g. cents) */
  amountMinor: number;
  currency?: string;
  /** Adyen or Stripe session/client-secret for drop-in initialisation */
  providerToken?: string;
  provider?: PaymentProvider;
  /** Slot for provider-supplied drop-in UI (Adyen Drop-in, Stripe Elements, etc.) */
  paymentSlot?: React.ReactNode;
  onPaymentComplete?: (result: { success: boolean; reference?: string; error?: string }) => void;
  disabled?: boolean;
}

function formatAmount(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency }).format(major);
}

/**
 * Payment form shell with configurable provider slot. Renders the total,
 * a provider drop-in area, and a confirm button. Integrates with Adyen
 * Drop-in by passing the drop-in component as `paymentSlot`.
 *
 * @example
 * ```tsx
 * // Adyen Drop-in integration
 * <PaymentForm
 *   amountMinor={4294}
 *   currency="NZD"
 *   provider="adyen"
 *   paymentSlot={<AdyenDropIn sessionData={sessionData} />}
 *   onPaymentComplete={handleComplete}
 * />
 * ```
 */
export function PaymentForm({
  amountMinor,
  currency = 'NZD',
  paymentSlot,
  onPaymentComplete,
  disabled = false,
}: PaymentFormProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    if (disabled || status === 'processing') return;
    setStatus('processing');
    setErrorMessage(null);

    // When paymentSlot is provided, it handles submission — this button is the
    // fallback for custom providers that invoke onPaymentComplete directly.
    if (!paymentSlot) {
      try {
        // Placeholder: real integration dispatches to Adyen/Stripe SDK here
        await new Promise<void>((resolve) => setTimeout(resolve, 1200));
        setStatus('success');
        onPaymentComplete?.({ success: true, reference: `REF-${Date.now()}` });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
        setStatus('error');
        setErrorMessage(message);
        onPaymentComplete?.({ success: false, error: message });
      }
    }
  }

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing.lg,
        border: `1px solid ${tokens.colors.border}`,
      }}
      aria-label="Payment form"
    >
      <h2
        style={{
          fontSize: tokens.typography.sizes.lg,
          fontWeight: tokens.typography.weights.semibold,
          color: tokens.colors.text,
          marginBottom: tokens.spacing.lg,
        }}
      >
        Payment
      </h2>

      {/* Provider drop-in slot */}
      {paymentSlot ? (
        <div style={{ marginBottom: tokens.spacing.lg }}>{paymentSlot}</div>
      ) : (
        <div
          style={{
            border: `1px dashed ${tokens.colors.border}`,
            borderRadius: tokens.radii.md,
            padding: tokens.spacing.xl,
            textAlign: 'center',
            marginBottom: tokens.spacing.lg,
            color: tokens.colors.textMuted,
            fontSize: tokens.typography.sizes.sm,
          }}
        >
          Payment provider not configured. Pass a <code>paymentSlot</code> to integrate Adyen or Stripe.
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: `${tokens.colors.error}18`,
            border: `1px solid ${tokens.colors.error}`,
            borderRadius: tokens.radii.md,
            padding: tokens.spacing.md,
            marginBottom: tokens.spacing.md,
            fontSize: tokens.typography.sizes.sm,
            color: tokens.colors.error,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div
          role="status"
          style={{
            backgroundColor: `${tokens.colors.success}18`,
            border: `1px solid ${tokens.colors.success}`,
            borderRadius: tokens.radii.md,
            padding: tokens.spacing.md,
            marginBottom: tokens.spacing.md,
            fontSize: tokens.typography.sizes.sm,
            color: tokens.colors.success,
          }}
        >
          Payment confirmed.
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={disabled || status === 'processing' || status === 'success'}
        aria-busy={status === 'processing'}
        style={{
          width: '100%',
          padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
          borderRadius: tokens.radii.md,
          border: 'none',
          backgroundColor:
            status === 'success'
              ? tokens.colors.success
              : disabled
              ? tokens.colors.border
              : tokens.colors.accent,
          color: tokens.colors.bg,
          fontSize: tokens.typography.sizes.md,
          fontWeight: tokens.typography.weights.bold,
          cursor: disabled || status === 'processing' || status === 'success' ? 'not-allowed' : 'pointer',
          transition: tokens.transitions.normal,
          letterSpacing: '0.02em',
        }}
      >
        {status === 'processing'
          ? 'Processing…'
          : status === 'success'
          ? 'Confirmed'
          : `Pay ${formatAmount(amountMinor, currency)}`}
      </button>
    </div>
  );
}
