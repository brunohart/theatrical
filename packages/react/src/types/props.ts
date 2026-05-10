export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

export interface SessionCardProps extends BaseComponentProps {
  sessionId: string;
  filmTitle: string;
  startTime: string;
  screenName: string;
  format: string;
  seatsAvailable: number;
  isSoldOut: boolean;
  onSelect?: (sessionId: string) => void;
}

export interface SeatMapProps extends BaseComponentProps {
  sessionId: string;
  rows: SeatRow[];
  selectedSeats: string[];
  onSeatToggle?: (seatId: string) => void;
  maxSelectable?: number;
}

export interface SeatRow {
  label: string;
  seats: Seat[];
}

export interface Seat {
  id: string;
  label: string;
  status: 'available' | 'occupied' | 'selected' | 'reserved' | 'wheelchair';
  price?: number;
}
