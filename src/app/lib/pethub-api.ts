import { apiClient } from './api-client';
import type {
  ApiAppointment,
  ApiCustomer,
  ApiPet,
  ApiService,
  AppointmentStatus,
  AuthUser,
  CustomerSegment,
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

export async function syncFirebaseUser(payload: SyncFirebasePayload): Promise<AuthUser> {
  const { data } = await apiClient.post<{ user: AuthUser }>('/auth/sync-firebase', payload);
  return data.user;
}

export async function getAuthMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

export async function listCatalogServices(): Promise<ApiService[]> {
  const { data } = await apiClient.get<ApiService[]>('/catalog/services');
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
