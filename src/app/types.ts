export type AuthRole = 'customer' | 'manager';

export type RouteAccess = 'public' | 'customer' | 'manager';

export interface AuthUser {
  userId: string;
  clinicId?: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: AuthRole;
  phone?: string;
}

export interface SessionState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isAuthenticated: boolean;
  role: AuthRole | null;
  userName: string;
  user: AuthUser | null;
  error: string | null;
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

export type CustomerSegment = 'vip' | 'loyal' | 'regular' | 'new';

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
  specialNotes: string;
  imageFile?: File | null;
  imagePreview?: string;
}

export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';

export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'vaccine' | 'checkup' | 'grooming' | 'medication';
  channelDefaults: Array<'email' | 'sms'>;
  messageTemplate: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  to: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export interface ClinicSettings {
  name: string;
  taxId: string;
  phone: string;
  address: string;
  invoiceNote: string;
}

export interface SensitiveSaveConfirmState {
  open: boolean;
  target: 'profile' | 'clinic' | null;
  password: string;
  submitting: boolean;
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

export interface InvoiceLineItem {
  name: string;
  type: 'service' | 'product';
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  appointmentId?: string;
  customerId: string;
  petId?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'transfer' | 'card';
  createdAt: string;
}

export interface AppointmentCheckoutState {
  appointmentId: string;
  paid: boolean;
  invoiceId?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface ApiService {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | string;
  isActive: boolean;
}

export interface ApiCustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface ApiPet {
  id: string;
  customerId: string;
  imageUrl: string | null;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  weightKg: number | string | null;
  coatColor: string | null;
  bloodType: string | null;
  neutered: 'yes' | 'no' | 'none' | null;
  microchipId: string | null;
  specialNotes: string | null;
  lastCheckupAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: ApiCustomerSummary | null;
}

export interface ApiAppointment {
  id: string;
  customerId: string;
  petId: string;
  serviceId: string;
  managerId: string | null;
  appointmentAt: string;
  note: string | null;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: ApiCustomerSummary | null;
  pet?: ApiPet | null;
  service?: ApiService | null;
}

export interface ApiCustomer {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  segment: CustomerSegment;
  totalSpent: number | string;
  totalVisits: number;
  lastVisitAt: string | null;
  createdAt: string;
  updatedAt: string;
  pets?: ApiPet[];
  appointments?: ApiAppointment[];
}

export interface PetCardView {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  dob: string;
  weight: string;
  color: string;
  microchipId: string;
  bloodType: string;
  neutered: boolean | null;
  specialNotes?: string;
  image: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  lastCheckup: string;
}
