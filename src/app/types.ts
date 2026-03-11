export type AuthRole = 'customer' | 'manager';

export type RouteAccess = 'public' | 'customer' | 'manager';

export interface SessionState {
  isAuthenticated: boolean;
  role: AuthRole | null;
  userName: string;
}

export interface BookingDraft {
  serviceId?: string;
  petId?: string;
  date?: string;
  time?: string;
  note?: string;
}

export interface ForgotPasswordState {
  open: boolean;
  email: string;
  submitting: boolean;
  sent: boolean;
}

export interface CancelDialogState {
  open: boolean;
  appointmentId: string | null;
}
