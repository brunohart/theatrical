import React from 'react';
import { tokens } from '../../tokens';
import type { OrderLineItem } from './types';

interface LineItemProps {
  item: OrderLineItem;
}

const ITEM_TYPE_COLORS: Record<OrderLineItem['type'], string> = {
  ticket: tokens.colors.text,
  fnb: tokens.colors.text,
  'service-fee': tokens.colors.textMuted,
  discount: tokens.colors.success,
  loyalty: tokens.colors.accent,
};

export function LineItem({ item }: LineItemProps) {
  const currency = item.currency ?? '$';
  const isDiscount = item.type === 'discount' || item.type === 'loyalty';
  const color = ITEM_TYPE_COLORS[item.type];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: tokens.spacing.sm,
        borderBottom: `1px solid ${tokens.colors.border}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
          {item.quantity > 1 && (
            <span
              style={{
                fontSize: tokens.typography.sizes.xs,
                color: tokens.colors.textMuted,
                backgroundColor: tokens.colors.surfaceRaised,
                padding: '1px 6px',
                borderRadius: tokens.radii.full,
              }}
            >
              ×{item.quantity}
            </span>
          )}
          <span style={{ fontSize: tokens.typography.sizes.sm, color }}>{item.label}</span>
        </div>
        {item.description && (
          <p
            style={{
              fontSize: tokens.typography.sizes.xs,
              color: tokens.colors.textMuted,
              marginTop: 2,
            }}
          >
            {item.description}
          </p>
        )}
      </div>
      <span
        style={{
          fontSize: tokens.typography.sizes.sm,
          fontWeight: tokens.typography.weights.semibold,
          color,
          flexShrink: 0,
          marginLeft: tokens.spacing.md,
        }}
      >
        {isDiscount ? '–' : ''}{currency}{Math.abs(item.totalPrice).toFixed(2)}
      </span>
    </div>
  );
}
