export type SeatState = 'available' | 'taken' | 'selected' | 'wheelchair' | 'companion' | 'premium';

export interface SeatData {
  id: string;
  row: string;
  number: number;
  state: SeatState;
  label?: string;
}

export interface SeatRowData {
  rowLabel: string;
  seats: SeatData[];
}

export interface SeatMapProps {
  /** 2D grid of seats: outer array is rows, inner array is seats */
  rows: SeatRowData[];
  /** Currently selected seat IDs */
  selectedSeatIds: Set<string>;
  /** Called when user clicks/activates a seat */
  onSeatSelect: (seatId: string) => void;
  /** Maximum number of seats user can select */
  maxSelectable?: number;
  /** Screen label shown at the top of the map */
  screenLabel?: string;
  /** Whether interaction is disabled (e.g. during checkout) */
  disabled?: boolean;
}
