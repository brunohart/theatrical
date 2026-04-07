/** A booking order */
export interface Order {
  id: string;
  sessionId: string;
  status: OrderStatus;
  tickets: Ticket[];
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  loyaltyPointsEarned?: number;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled' | 'refunded';

export interface Ticket {
  id: string;
  type: string;
  seatId: string;
  seatLabel: string;
  price: number;
  discount?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
