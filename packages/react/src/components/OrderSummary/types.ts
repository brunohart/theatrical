export interface OrderLineItem {
  id: string;
  type: 'ticket' | 'fnb' | 'service-fee' | 'discount' | 'loyalty';
  label: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency?: string;
}

export interface PriceBreakdownData {
  subtotal: number;
  tax: number;
  taxLabel?: string;
  discounts: Array<{ label: string; amount: number }>;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscount?: number;
  serviceFee?: number;
  total: number;
  currency?: string;
}

export interface OrderSummaryProps {
  lineItems: OrderLineItem[];
  priceBreakdown: PriceBreakdownData;
  /** Session details to display at the top */
  sessionDetails?: {
    filmTitle: string;
    cinema: string;
    screenName: string;
    startTime: string;
    format: string;
    seats: string[];
  };
  isLoading?: boolean;
}
