export type EventCategory = 'booking' | 'session' | 'loyalty' | 'site' | 'film';

export interface TheatricalEvent<T = unknown> {
  id: string;
  type: string;
  category: EventCategory;
  timestamp: string;
  source: string;
  data: T;
  metadata?: Record<string, string>;
}

export interface BookingCreatedEvent {
  orderId: string;
  sessionId: string;
  siteId: string;
  ticketCount: number;
  totalAmount: number;
  currency: string;
}

export interface SessionUpdatedEvent {
  sessionId: string;
  siteId: string;
  seatsAvailable: number;
  previousSeatsAvailable: number;
  isSoldOut: boolean;
}

export interface LoyaltyPointsEarnedEvent {
  memberId: string;
  orderId: string;
  pointsEarned: number;
  newBalance: number;
  tier: string;
}
