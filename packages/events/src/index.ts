// Real-time event bridge — poll → diff → emit → webhook.
// Watchers turn a request-response API into a typed event stream.
export * from './watchers';
export { computeSignature, verifySignature } from './webhook';
export { EventEmitter } from './emitter';
export { TypedEventEmitter } from './emitter/typed-emitter';
export type {
  TheatricalEvent,
  EventCategory,
  BookingCreatedEvent,
  SessionUpdatedEvent,
  LoyaltyPointsEarnedEvent,
} from './types';
