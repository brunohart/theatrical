import type { TheatricalHTTPClient } from '../http/client';
import type { PriceCalculation, TicketType } from '../types/pricing';

/**
 * Pricing resource — ticket types, price calculations, tax handling.
 */
export class PricingResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async ticketTypes(sessionId: string): Promise<TicketType[]> {
    return this.http.get<TicketType[]>(`/ocapi/v1/sessions/${sessionId}/ticket-types`);
  }

  async calculate(sessionId: string, ticketTypeId: string, quantity?: number): Promise<PriceCalculation> {
    return this.http.get<PriceCalculation>(`/ocapi/v1/pricing/calculate`, {
      params: { sessionId, ticketTypeId, quantity },
    });
  }
}
