/** A cinema site (location) */
export interface Site {
  id: string;
  name: string;
  address: Address;
  location: GeoLocation;
  screens: Screen[];
  config: SiteConfig;
  timezone: string;
  currency: string;
  isActive: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Screen {
  id: string;
  name: string;
  seatCount: number;
  formats: string[];
  isAccessible: boolean;
}

export interface SiteConfig {
  bookingLeadTime: number;
  maxTicketsPerOrder: number;
  loyaltyEnabled: boolean;
  fnbEnabled: boolean;
}
