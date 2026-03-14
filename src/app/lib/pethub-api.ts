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
  ReminderStatus,
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
  returnUrl?: string;
  cancelUrl?: string;
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

export interface PosPrefillResponse {
  appointment: ApiAppointment | null;
  suggestedItems?: Array<{
    itemType: 'service' | 'product';
    serviceId?: string;
    productId?: string;
    name: string;
    qty: number;
    unitPrice: number;
  }>;
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
  monthlyRevenue: Array<{
    key: string;
    month: string;
    paidRevenue: number;
    paidInvoices: number;
  }>;
  serviceRevenue: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
  }>;
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
    issuedAt: string;
    paymentMethod: 'cash' | 'transfer' | 'card' | 'payos' | 'momo' | 'zalopay';
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    subtotal: number | string;
    taxPercent: number | string;
    taxAmount: number | string;
    grandTotal: number | string;
    customerId: string;
    customer: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    };
    appointment: {
      id: string;
      pet: {
        id: string;
        name: string;
        species: string;
        breed: string | null;
      } | null;
    } | null;
    items: Array<{
      id: string;
      itemType: 'service' | 'product';
      name: string;
      qty: number;
      unitPrice: number | string;
      total: number | string;
    }>;
  };
  paymentAction: {
    provider: 'payos';
    orderCode: string;
    amount: number;
    checkoutUrl: string;
    qrCode: string | null;
  } | null;
  clinic: {
    clinicName: string;
    phone: string;
    address: string;
    invoiceNote: string | null;
  } | null;
}

export interface UpsertCatalogServicePayload {
  code: string;
  name: string;
  description?: string;
  durationMin: number;
  price: number;
}

export interface UpsertCatalogProductPayload {
  sku: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  stock: number;
}

export interface ApiReminder {
  id: string;
  clinicId: string;
  customerId: string;
  petId: string;
  channel: 'email' | 'sms';
  templateName: string | null;
  message: string;
  scheduledAt: string | null;
  sentAt: string | null;
  failedReason: string | null;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
  };
}

export interface ApiReminderMetrics {
  sent: number;
  failed: number;
  scheduled: number;
  cancelled: number;
  successRate: number;
}

export interface ApiRemindersListResponse {
  items: ApiReminder[];
  metrics: ApiReminderMetrics;
}

export interface CreateReminderFromTemplatePayload {
  templateId?: string;
  templateName?: string;
  customerId: string;
  petId: string;
  channel: 'email' | 'sms';
  scheduleAt?: string;
  sendNow?: boolean;
  overrideMessage?: string;
}

export interface ApiNotification {
  id: string;
  clinicId: string;
  userId: string | null;
  customerId: string | null;
  target: 'customer' | 'manager' | 'all';
  title: string;
  body: string;
  linkTo: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ApiNotificationsListResponse {
  items: ApiNotification[];
  unread: number;
  filter: 'all' | 'unread' | 'read';
}

export interface ApiNotificationSettings {
  emailBooking: boolean;
  emailReminder: boolean;
  smsBooking: boolean;
  smsReminder: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  updatedAt: string | null;
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

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
}

export interface UpsertMedicalRecordPayload {
  appointmentId?: string;
  doctorName?: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  nextVisitAt?: string;
  recordedAt?: string;
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

export async function upsertCatalogService(payload: UpsertCatalogServicePayload): Promise<ApiService> {
  const { data } = await apiClient.post<ApiService>('/catalog/services', payload);
  return data;
}

export async function upsertCatalogProduct(payload: UpsertCatalogProductPayload): Promise<ApiProduct> {
  const { data } = await apiClient.post<ApiProduct>('/catalog/products', payload);
  return data;
}

export async function listCustomers(segment?: CustomerSegment): Promise<ApiCustomer[]> {
  const { data } = await apiClient.get<ApiCustomer[]>('/customers', {
    params: segment ? { segment } : undefined,
  });
  return data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<ApiCustomer> {
  const { data } = await apiClient.post<ApiCustomer>('/customers', payload);
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

export async function createMedicalRecord(
  petId: string,
  payload: UpsertMedicalRecordPayload,
): Promise<ApiMedicalRecord> {
  const { data } = await apiClient.post<ApiMedicalRecord>(`/pets/${petId}/medical-records`, payload);
  return data;
}

export async function updateMedicalRecord(
  petId: string,
  recordId: string,
  payload: UpsertMedicalRecordPayload,
): Promise<ApiMedicalRecord> {
  const { data } = await apiClient.put<ApiMedicalRecord>(`/pets/${petId}/medical-records/${recordId}`, payload);
  return data;
}

export async function deleteMedicalRecord(
  petId: string,
  recordId: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/pets/${petId}/medical-records/${recordId}`);
  return data;
}

export async function getPetDigitalCard(petId: string): Promise<ApiDigitalCard> {
  const { data } = await apiClient.get<ApiDigitalCard>(`/pets/${petId}/digital-card`);
  return data;
}

export async function regeneratePetDigitalCard(
  petId: string,
  note?: string,
): Promise<ApiDigitalCard> {
  const { data } = await apiClient.post<ApiDigitalCard>(`/pets/${petId}/digital-card/regenerate`, {
    note,
  });
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

export async function getPosPrefill(appointmentId: string): Promise<PosPrefillResponse> {
  const { data } = await apiClient.get<PosPrefillResponse>('/pos/prefill', {
    params: { appointmentId },
  });
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

export async function listManagerReminders(status?: ReminderStatus): Promise<ApiRemindersListResponse> {
  const { data } = await apiClient.get<ApiRemindersListResponse>('/reminders', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function createReminderFromTemplate(
  payload: CreateReminderFromTemplatePayload,
): Promise<{ reminder: ApiReminder }> {
  const { data } = await apiClient.post<{ reminder: ApiReminder }>('/reminders/from-template', payload);
  return data;
}

export async function cancelReminder(id: string): Promise<{ reminder: ApiReminder }> {
  const { data } = await apiClient.patch<{ reminder: ApiReminder }>(`/reminders/${id}/cancel`);
  return data;
}

export async function listNotifications(
  filter: 'all' | 'unread' | 'read' = 'all',
): Promise<ApiNotificationsListResponse> {
  const { data } = await apiClient.get<ApiNotificationsListResponse>('/notifications', {
    params: { filter },
  });
  return data;
}

export async function markNotificationAsRead(id: string): Promise<{ item: ApiNotification; unread: number }> {
  const { data } = await apiClient.patch<{ item: ApiNotification; unread: number }>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllNotificationsAsRead(): Promise<{ updated: number; unread: number }> {
  const { data } = await apiClient.patch<{ updated: number; unread: number }>(
    '/notifications/read-all',
  );
  return data;
}

export async function getNotificationSettings(): Promise<{ notifications: ApiNotificationSettings }> {
  const { data } = await apiClient.get<{ notifications: ApiNotificationSettings }>(
    '/settings/notifications',
  );
  return data;
}

export async function updateNotificationSettings(payload: {
  emailBooking?: boolean;
  emailReminder?: boolean;
  smsBooking?: boolean;
  smsReminder?: boolean;
  dailyReport?: boolean;
  weeklyReport?: boolean;
}): Promise<{ notifications: ApiNotificationSettings }> {
  const { data } = await apiClient.put<{ notifications: ApiNotificationSettings }>(
    '/settings/notifications',
    payload,
  );
  return data;
}
