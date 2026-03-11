import type { AppointmentCheckoutState, InvoiceRecord } from '../types';

const CHECKOUT_STORAGE_KEY = 'pethub-manager-appointment-checkout-v1';
const INVOICE_STORAGE_KEY = 'pethub-manager-invoices-v1';
const UPDATE_EVENT = 'pethub-manager-checkout-updated';

type CheckoutMap = Record<string, AppointmentCheckoutState>;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function notifyUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function getCheckoutMap(): CheckoutMap {
  return readJson<CheckoutMap>(CHECKOUT_STORAGE_KEY, {});
}

export function getAppointmentCheckoutState(appointmentId: string): AppointmentCheckoutState {
  const map = getCheckoutMap();
  return map[appointmentId] ?? { appointmentId, paid: false };
}

export function markAppointmentPaid(appointmentId: string, invoiceId: string) {
  const map = getCheckoutMap();
  map[appointmentId] = {
    appointmentId,
    paid: true,
    invoiceId,
  };
  writeJson(CHECKOUT_STORAGE_KEY, map);
  notifyUpdate();
}

export function getInvoices(): InvoiceRecord[] {
  return readJson<InvoiceRecord[]>(INVOICE_STORAGE_KEY, []);
}

export function getInvoiceById(invoiceId: string) {
  return getInvoices().find((invoice) => invoice.id === invoiceId);
}

export function saveInvoice(invoice: InvoiceRecord) {
  const invoices = getInvoices();
  writeJson(INVOICE_STORAGE_KEY, [invoice, ...invoices.filter((item) => item.id !== invoice.id)]);
  notifyUpdate();
}

export function createInvoiceId() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `INV-${datePart}-${randomPart}`;
}

export function subscribeCheckoutUpdates(callback: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const onUpdate = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === CHECKOUT_STORAGE_KEY || event.key === INVOICE_STORAGE_KEY) {
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

