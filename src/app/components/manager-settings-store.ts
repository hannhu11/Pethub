import type { ClinicSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'pethub-manager-settings-v1';
const UPDATE_EVENT = 'pethub-manager-settings-updated';

export interface ManagerProfileSettings {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface ManagerSubscriptionSettings {
  plan: 'basic' | 'premium';
  amount: number;
  currency: 'VND';
  billingCycle: 'monthly';
  paymentMethod: 'vietqr' | 'momo' | 'zalopay' | 'card' | null;
  activatedAt?: string;
}

interface ManagerSettingsState {
  profile: ManagerProfileSettings;
  clinic: ClinicSettings;
  subscription: ManagerSubscriptionSettings;
}

const defaultSettings: ManagerSettingsState = {
  profile: {
    name: 'Phạm Hương',
    email: 'huong.pham@email.com',
    phone: '0934567890',
    role: 'Quản trị viên',
  },
  clinic: {
    name: 'PetHub Clinic',
    taxId: '0123456789',
    phone: '028-1234-5678',
    address: '123 Nguyễn Huệ, Q.1, TP.HCM',
    invoiceNote: 'Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub!',
  },
  subscription: {
    plan: 'basic',
    amount: 249000,
    currency: 'VND',
    billingCycle: 'monthly',
    paymentMethod: null,
  },
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function readSettingsState(): ManagerSettingsState {
  if (!isBrowser()) return defaultSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<ManagerSettingsState>;
    return {
      profile: {
        ...defaultSettings.profile,
        ...(parsed.profile ?? {}),
      },
      clinic: {
        ...defaultSettings.clinic,
        ...(parsed.clinic ?? {}),
      },
      subscription: {
        ...defaultSettings.subscription,
        ...(parsed.subscription ?? {}),
      },
    };
  } catch {
    return defaultSettings;
  }
}

function writeSettingsState(settings: ManagerSettingsState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function notifyUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function getManagerSettings() {
  return readSettingsState();
}

export function getProfileSettings() {
  return readSettingsState().profile;
}

export function getClinicSettings() {
  return readSettingsState().clinic;
}

export function getSubscriptionSettings() {
  return readSettingsState().subscription;
}

export function saveProfileSettings(profile: ManagerProfileSettings) {
  const current = readSettingsState();
  writeSettingsState({
    ...current,
    profile,
  });
  notifyUpdate();
}

export function saveClinicSettings(clinic: ClinicSettings) {
  const current = readSettingsState();
  writeSettingsState({
    ...current,
    clinic,
  });
  notifyUpdate();
}

export function saveSubscriptionSettings(subscription: ManagerSubscriptionSettings) {
  const current = readSettingsState();
  writeSettingsState({
    ...current,
    subscription,
  });
  notifyUpdate();
}

export function subscribeManagerSettingsUpdates(callback: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const onUpdate = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(UPDATE_EVENT, onUpdate);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, onUpdate);
    window.removeEventListener('storage', onStorage);
  };
}
