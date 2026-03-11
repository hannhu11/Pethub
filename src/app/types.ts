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

export type CustomerSegment = 'vip' | 'loyal' | 'new' | 'regular';

export type NeuteredStatus = 'yes' | 'no' | 'none';

export type BloodType = 'A' | 'B' | 'AB' | 'DEA 1.1+' | 'DEA 1.1-' | 'none';

export interface PetProfileDraft {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  existingOwner: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petGender: string;
  petDob: string;
  petWeight: string;
  color: string;
  bloodType: BloodType;
  neutered: NeuteredStatus;
  microchipId: string;
  imageFile?: File | null;
  imagePreview?: string;
}

export interface DigitalCardModalState {
  open: boolean;
  petId: string | null;
  source: 'customers' | 'pets';
}

export interface ProductRevenueDatum {
  productName: string;
  revenue: number;
  quantity: number;
}
