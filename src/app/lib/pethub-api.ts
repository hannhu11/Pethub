import { apiClient } from './api-client';
import type {
  ApiAppointment,
  ApiCustomer,
  ApiPet,
  ApiService,
  AppointmentStatus,
  AuthUser,
  CustomerSegment,
  OnboardingState,
} from '../types';

type SyncFirebasePayload = {
  idToken: string;
  name?: string;
  phone?: string;
  clinicSlug?: string;
};

type UpsertPetPayload = {
  customerId?: string;
  imageUrl?: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  dateOfBirth?: string;
  weightKg?: number;
  coatColor?: string;
  bloodType?: string;
  neutered?: 'yes' | 'no' | 'none';
  microchipId?: string;
  specialNotes?: string;
};

type CreateAppointmentPayload = {
  customerId?: string;
  petId: string;
  serviceId: string;
  appointmentAt: string;
  note?: string;
};

export interface AuthSessionPayload {
  user: AuthUser;
  onboarding: OnboardingState;
}

export interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number | string;
  stock: number;
  isActive: boolean;
}

export interface PosCheckoutItemPayload {
  itemType: 'service' | 'product';
  serviceId?: string;
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface PosCheckoutPayload {
  appointmentId?: string;
  customerId: string;
  petId?: string;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'payos' | 'momo' | 'zalopay';
  items: PosCheckoutItemPayload[];
  taxPercent?: number;
}

export interface PosCheckoutResponse {
  invoiceId: string;
  invoiceNo: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentAction: {
    provider: 'payos';
    orderCode: string;
    amount: number;
    checkoutUrl: string;
    qrCode: string | null;
    metadata?: Record<string, unknown>;
  } | null;
  totals: {
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    grandTotal: number;
  };
}

export interface AnalyticsOverviewResponse {
  range: {
    from: string | null;
    to: string | null;
  };
  totals: {
    totalLtv: number;
    totalCustomers: number;
    paidRevenue: number;
    paidInvoices: number;
    completedUnpaidAppointments: number;
  };
  topServiceRevenue: {
    serviceId: string;
    serviceName: string;
    revenue: number;
  } | null;
}

export interface AnalyticsLtvSummaryResponse {
  totalLtv: number;
  totalCustomers: number;
  items: Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    segment: CustomerSegment;
    totalSpent: number | string;
    totalVisits: number;
    lastVisitAt: string | null;
  }>;
}

export interface InvoiceDetailsResponse {
  invoice: {
    id: string;
    invoiceNo: string;
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    grandTotal: number | string;
    customerId: string;
  };
}

export interface ApiMedicalRecord {
  id: string;
  appointmentId: string | null;
  doctorName: string | null;
  diagnosis: string;
  treatment: string;
  notes: string | null;
  nextVisitAt: string | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDigitalCard {
  generatedAt: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    weightKg: number | string | null;
    coatColor: string | null;
    bloodType: string | null;
    neutered: string | null;
    microchipId: string | null;
    specialNotes: string | null;
    imageUrl: string | null;
    lastCheckupAt: string | null;
  };
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    segment: CustomerSegment;
    totalSpent: number | string;
    totalVisits: number;
    lastVisitAt: string | null;
  };
  medical: {
    total: number;
    latest: ApiMedicalRecord | null;
    items: ApiMedicalRecord[];
  };
  version: {
    lastRegeneratedAt: string | null;
  };
}

export async function syncFirebaseUser(payload: SyncFirebasePayload): Promise<AuthSessionPayload> {
  const { data } = await apiClient.post<AuthSessionPayload>('/auth/sync-firebase', payload);
  return data;
}

export async function getAuthMe(): Promise<AuthSessionPayload> {
  const { data } = await apiClient.get<AuthSessionPayload>('/auth/me');
  return data;
}

export async function completeOnboarding(payload: {
  name: string;
  phone: string;
  clinicSlug?: string;
}): Promise<AuthSessionPayload> {
  const { data } = await apiClient.post<AuthSessionPayload>('/auth/onboarding/complete', payload);
  return data;
}

export async function listCatalogServices(): Promise<ApiService[]> {
  const { data } = await apiClient.get<ApiService[]>('/catalog/services');
  return data;
}

export async function listCatalogProducts(): Promise<ApiProduct[]> {
  const { data } = await apiClient.get<ApiProduct[]>('/catalog/products');
  return data;
}

export async function listCustomers(segment?: CustomerSegment): Promise<ApiCustomer[]> {
  const { data } = await apiClient.get<ApiCustomer[]>('/customers', {
    params: segment ? { segment } : undefined,
  });
  return data;
}

export async function getCustomerById(id: string): Promise<ApiCustomer> {
  const { data } = await apiClient.get<ApiCustomer>(`/customers/${id}`);
  return data;
}

export async function listPets(customerId?: string): Promise<ApiPet[]> {
  const { data } = await apiClient.get<ApiPet[]>('/pets', {
    params: customerId ? { customerId } : undefined,
  });
  return data;
}

export async function getPetById(id: string): Promise<ApiPet> {
  const { data } = await apiClient.get<ApiPet>(`/pets/${id}`);
  return data;
}

export async function listMedicalRecords(petId: string): Promise<ApiMedicalRecord[]> {
  const { data } = await apiClient.get<ApiMedicalRecord[]>(`/pets/${petId}/medical-records`);
  return data;
}

export async function getPetDigitalCard(petId: string): Promise<ApiDigitalCard> {
  const { data } = await apiClient.get<ApiDigitalCard>(`/pets/${petId}/digital-card`);
  return data;
}

export async function createPet(payload: UpsertPetPayload): Promise<ApiPet> {
  const { data } = await apiClient.post<ApiPet>('/pets', payload);
  return data;
}

export async function updatePet(id: string, payload: UpsertPetPayload): Promise<ApiPet> {
  const { data } = await apiClient.put<ApiPet>(`/pets/${id}`, payload);
  return data;
}

export async function listAppointments(status?: AppointmentStatus): Promise<ApiAppointment[]> {
  const { data } = await apiClient.get<ApiAppointment[]>('/appointments', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<ApiAppointment> {
  const { data } = await apiClient.post<ApiAppointment>('/appointments', payload);
  return data;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<{ appointment: ApiAppointment; requiresPosCheckout: boolean }> {
  const { data } = await apiClient.patch<{ appointment: ApiAppointment; requiresPosCheckout: boolean }>(
    `/appointments/${appointmentId}/status`,
    { status },
  );
  return data;
}

export async function cancelAppointment(appointmentId: string): Promise<ApiAppointment> {
  const { data } = await apiClient.patch<{ appointment: ApiAppointment }>(
    `/appointments/${appointmentId}/cancel`,
  );
  return data.appointment;
}

export async function checkoutPos(payload: PosCheckoutPayload): Promise<PosCheckoutResponse> {
  const { data } = await apiClient.post<PosCheckoutResponse>('/pos/checkout', payload);
  return data;
}

export async function getAnalyticsOverview(query?: {
  from?: string;
  to?: string;
}): Promise<AnalyticsOverviewResponse> {
  const { data } = await apiClient.get<AnalyticsOverviewResponse>('/analytics/overview', {
    params: query,
  });
  return data;
}

export async function getAnalyticsCustomerLtvSummary(): Promise<AnalyticsLtvSummaryResponse> {
  const { data } = await apiClient.get<AnalyticsLtvSummaryResponse>('/analytics/customers/ltv-summary');
  return data;
}

export async function getInvoiceById(id: string): Promise<InvoiceDetailsResponse> {
  const { data } = await apiClient.get<InvoiceDetailsResponse>(`/invoices/${id}`);
  return data;
}
