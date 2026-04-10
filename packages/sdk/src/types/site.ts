import { z } from 'zod';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

/**
 * Zod schema for a geographic coordinate pair.
 * Validates latitude/longitude ranges from Vista's OCAPI site responses.
 */
export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Zod schema for a postal address.
 */
export const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string().length(2),
});

/**
 * Zod schema for a cinema screen/auditorium.
 * `formats` is a list of presentation formats (e.g. '2D', 'IMAX', 'DOLBY_ATMOS').
 */
export const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
  seatCount: z.number().int().positive(),
  formats: z.array(z.string()).min(1),
  isAccessible: z.boolean(),
});

/**
 * Zod schema for a site amenity — a feature or service available at the cinema.
 */
export const amenitySchema = z.object({
  /** Amenity identifier (e.g. 'parking', 'bar', 'vip_lounge', 'imax') */
  id: z.string(),
  /** Human-readable label */
  label: z.string(),
  /** Optional icon key for rendering */
  icon: z.string().optional(),
});

/**
 * Zod schema for site booking and operational configuration.
 */
export const siteConfigSchema = z.object({
  bookingLeadTime: z.number().int().nonnegative(),
  maxTicketsPerOrder: z.number().int().positive(),
  loyaltyEnabled: z.boolean(),
  fnbEnabled: z.boolean(),
});

/**
 * Zod schema for a cinema site (location).
 * Validates the full shape of a site returned from Vista's OCAPI.
 */
export const siteSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: addressSchema,
  location: geoLocationSchema,
  screens: z.array(screenSchema),
  config: siteConfigSchema,
  timezone: z.string(),
  currency: z.string().length(3),
  isActive: z.boolean(),
  amenities: z.array(amenitySchema).optional(),
});

/**
 * Zod schema for a site list response.
 */
export const siteListResponseSchema = z.array(siteSchema);

// ─── TypeScript types ─────────────────────────────────────────────────────────

/** Geographic coordinate pair */
export type GeoLocation = z.infer<typeof geoLocationSchema>;

/** Postal address */
export type Address = z.infer<typeof addressSchema>;

/**
 * A cinema amenity — a feature or service available at the site.
 *
 * @example
 * ```typescript
 * const amenities = site.amenities ?? [];
 * const hasImax = amenities.some(a => a.id === 'imax');
 * ```
 */
export type Amenity = z.infer<typeof amenitySchema>;

/** Cinema screen/auditorium configuration */
export type Screen = z.infer<typeof screenSchema>;

/** Site booking and operational configuration */
export type SiteConfig = z.infer<typeof siteConfigSchema>;

/**
 * A cinema site (location) — the physical venue with screens, address, and config.
 *
 * @example
 * ```typescript
 * const sites = await client.sites.list();
 * const active = sites.filter(s => s.isActive);
 * ```
 */
export type Site = z.infer<typeof siteSchema>;
