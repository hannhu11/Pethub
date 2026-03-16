import type { ClinicSettings } from '../types';

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
  paymentMethod: 'payos' | 'vietqr' | 'momo' | 'zalopay' | 'card' | null;
  activatedAt?: string;
  petCount: number;
}

interface ManagerSettingsState {
  profile: ManagerProfileSettings;
  clinic: ClinicSettings;
  subscription: ManagerSubscriptionSettings;
}

const defaultSettings: ManagerSettingsState = {
  profile: {
    name: '',
    email: '',
    phone: '',
    role: 'Quản trị viên',
  },
  clinic: {
    name: 'Phòng khám',
    taxId: '',
    phone: '',
    address: '',
    invoiceNote: '',
  },
  subscription: {
    plan: 'basic',
    amount: 249000,
    currency: 'VND',
    billingCycle: 'monthly',
    paymentMethod: null,
    petCount: 0,
  },
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function createDefaultSettings(): ManagerSettingsState {
  return {
    profile: { ...defaultSettings.profile },
    clinic: { ...defaultSettings.clinic },
    subscription: { ...defaultSettings.subscription },
  };
}

let settingsState: ManagerSettingsState = createDefaultSettings();

function readSettingsState(): ManagerSettingsState {
  return settingsState;
}

function writeSettingsState(next: ManagerSettingsState) {
  settingsState = next;
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

export function hydrateManagerSettings(partial: Partial<ManagerSettingsState>) {
  const current = readSettingsState();
  writeSettingsState({
    profile: {
      ...current.profile,
      ...(partial.profile ?? {}),
    },
    clinic: {
      ...current.clinic,
      ...(partial.clinic ?? {}),
    },
    subscription: {
      ...current.subscription,
      ...(partial.subscription ?? {}),
    },
  });
  notifyUpdate();
}

export function resetManagerSettingsStore() {
  writeSettingsState(createDefaultSettings());
  notifyUpdate();
}

export function subscribeManagerSettingsUpdates(callback: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const onUpdate = () => callback();
  window.addEventListener(UPDATE_EVENT, onUpdate);

  return () => {
    window.removeEventListener(UPDATE_EVENT, onUpdate);
  };
}
