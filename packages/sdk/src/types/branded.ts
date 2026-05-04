declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;

export type SessionId = Branded<string, 'SessionId'>;
export type FilmId = Branded<string, 'FilmId'>;
export type SiteId = Branded<string, 'SiteId'>;
export type OrderId = Branded<string, 'OrderId'>;
export type MemberId = Branded<string, 'MemberId'>;

export function sessionId(id: string): SessionId { return id as SessionId; }
export function filmId(id: string): FilmId { return id as FilmId; }
export function siteId(id: string): SiteId { return id as SiteId; }
export function orderId(id: string): OrderId { return id as OrderId; }
export function memberId(id: string): MemberId { return id as MemberId; }
