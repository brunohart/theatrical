export interface PriceCalculation {
  sessionId: string;
  ticketTypeId: string;
  basePrice: number;
  taxAmount: number;
  discountAmount: number;
  totalPrice: number;
  currency: string;
  taxInclusive: boolean;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  isDefault: boolean;
  requiresLoyalty: boolean;
}
