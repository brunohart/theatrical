import { describe, expect, it, vi } from 'vitest';
import { TypedEventEmitter } from '../../src/emitter';

type TestEvents = {
  'session.added': { sessionId: string; filmTitle: string };
  'booking.created': { orderId: string; memberId?: string };
};

describe('TypedEventEmitter', () => {
  it('emits and receives typed events', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('session.added', listener);
    emitter.emit('session.added', { sessionId: 'ses-001', filmTitle: 'The Last Projection' });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ sessionId: 'ses-001', filmTitle: 'The Last Projection' });
  });

  it('supports multiple listeners on the same event', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const l1 = vi.fn();
    const l2 = vi.fn();
    emitter.on('booking.created', l1);
    emitter.on('booking.created', l2);
    emitter.emit('booking.created', { orderId: 'ord-001' });
    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });

  it('off() removes a listener', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('booking.created', listener);
    emitter.off('booking.created', listener);
    emitter.emit('booking.created', { orderId: 'ord-001' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('once() fires exactly once then removes itself', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.once('session.added', listener);
    emitter.emit('session.added', { sessionId: 'ses-001', filmTitle: 'The Wild Robot' });
    emitter.emit('session.added', { sessionId: 'ses-002', filmTitle: 'The Wild Robot 2' });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('events do not cross-contaminate listeners', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const sessionListener = vi.fn();
    const bookingListener = vi.fn();
    emitter.on('session.added', sessionListener);
    emitter.on('booking.created', bookingListener);
    emitter.emit('session.added', { sessionId: 'ses-001', filmTitle: 'Sinners' });
    expect(sessionListener).toHaveBeenCalledOnce();
    expect(bookingListener).not.toHaveBeenCalled();
  });

  it('returns false when no listeners are registered', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const result = emitter.emit('booking.created', { orderId: 'ord-001' });
    expect(result).toBe(false);
  });
});
