import type { ReminderStatus, ReminderTemplate } from '../types';

const REMINDER_STORAGE_KEY = 'pethub-manager-reminders-v2';
const UPDATE_EVENT = 'pethub-manager-reminders-updated';

export type ReminderType = 'vaccine' | 'checkup' | 'grooming' | 'medication';

export interface ManagerReminder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  petId: string;
  petName: string;
  type: ReminderType;
  typeName: string;
  status: ReminderStatus;
  scheduledDate: string;
  sentDate?: string;
  channel: 'email' | 'sms';
  message: string;
}

const defaultReminders: ManagerReminder[] = [
  {
    id: 'r1',
    customerId: 'u1',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    petId: 'PH-2026-001',
    petName: 'Lucky',
    type: 'vaccine',
    typeName: 'Tiêm vaccine dại',
    status: 'sent',
    scheduledDate: '2026-03-05',
    sentDate: '2026-03-05',
    channel: 'email',
    message: 'Kính gửi Nguyễn Văn An, bé Lucky đã đến lịch tiêm vaccine dại.',
  },
  {
    id: 'r2',
    customerId: 'u1',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    petId: 'PH-2026-002',
    petName: 'Mimi',
    type: 'checkup',
    typeName: 'Tái khám định kỳ',
    status: 'scheduled',
    scheduledDate: '2026-03-12',
    channel: 'email',
    message: 'Kính gửi Nguyễn Văn An, bé Mimi sắp đến lịch tái khám định kỳ.',
  },
  {
    id: 'r3',
    customerId: 'u2',
    customerName: 'Trần Thị Bình',
    customerPhone: '0912345678',
    petId: 'PH-2026-003',
    petName: 'Bông',
    type: 'grooming',
    typeName: 'Cắt tỉa lông định kỳ',
    status: 'sent',
    scheduledDate: '2026-03-08',
    sentDate: '2026-03-08',
    channel: 'sms',
    message: 'PetHub nhắc lịch grooming cho bé Bông hôm nay.',
  },
  {
    id: 'r4',
    customerId: 'u3',
    customerName: 'Lê Minh Đức',
    customerPhone: '0923456789',
    petId: 'PH-2026-004',
    petName: 'Snowball',
    type: 'vaccine',
    typeName: 'Tiêm phòng 5 bệnh',
    status: 'scheduled',
    scheduledDate: '2026-03-15',
    channel: 'email',
    message: 'Kính gửi Lê Minh Đức, bé Snowball đến hạn tiêm phòng 5 bệnh.',
  },
  {
    id: 'r5',
    customerId: 'u2',
    customerName: 'Trần Thị Bình',
    customerPhone: '0912345678',
    petId: 'PH-2026-003',
    petName: 'Bông',
    type: 'checkup',
    typeName: 'Tái khám tiêu hóa',
    status: 'failed',
    scheduledDate: '2026-03-07',
    channel: 'email',
    message: 'Kính gửi Trần Thị Bình, bé Bông cần tái khám tiêu hóa.',
  },
  {
    id: 'r6',
    customerId: 'u1',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    petId: 'PH-2026-001',
    petName: 'Lucky',
    type: 'medication',
    typeName: 'Nhắc uống thuốc',
    status: 'cancelled',
    scheduledDate: '2026-03-09',
    channel: 'sms',
    message: 'PetHub nhắc uống thuốc cho bé Lucky theo chỉ định bác sĩ.',
  },
];

export const reminderTemplates: ReminderTemplate[] = [
  {
    id: 'tpl-vaccine',
    name: 'Nhắc tiêm phòng',
    type: 'vaccine',
    channelDefaults: ['email', 'sms'],
    messageTemplate:
      'Kính gửi [Customer Name], bé [Pet Name] đã đến lịch tiêm phòng. Vui lòng đặt lịch tại PetHub để được hỗ trợ kịp thời.',
  },
  {
    id: 'tpl-checkup',
    name: 'Nhắc tái khám',
    type: 'checkup',
    channelDefaults: ['email'],
    messageTemplate:
      'Kính gửi [Customer Name], bé [Pet Name] sắp đến lịch tái khám định kỳ. PetHub khuyến nghị đặt lịch trong tuần này.',
  },
  {
    id: 'tpl-grooming',
    name: 'Theo dõi grooming',
    type: 'grooming',
    channelDefaults: ['sms'],
    messageTemplate:
      'PetHub xin nhắc [Customer Name]: bé [Pet Name] đã đến kỳ grooming để giữ lông và da khỏe mạnh.',
  },
];

function isBrowser() {
  return typeof window !== 'undefined';
}

function readReminders() {
  if (!isBrowser()) return defaultReminders;
  try {
    const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return defaultReminders;
    const parsed = JSON.parse(raw) as ManagerReminder[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultReminders;
    }
    return parsed;
  } catch {
    return defaultReminders;
  }
}

function writeReminders(reminders: ManagerReminder[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
}

function notifyUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function getManagerReminders() {
  return readReminders();
}

export function saveManagerReminders(reminders: ManagerReminder[]) {
  writeReminders(reminders);
  notifyUpdate();
}

export function updateReminderStatus(reminderId: string, status: ReminderStatus) {
  const now = new Date().toISOString().slice(0, 10);
  const next = readReminders().map((item) =>
    item.id === reminderId
      ? {
          ...item,
          status,
          sentDate: status === 'sent' ? now : item.sentDate,
        }
      : item,
  );
  saveManagerReminders(next);
}

export function createReminder(reminder: Omit<ManagerReminder, 'id'>) {
  const record: ManagerReminder = {
    ...reminder,
    id: `r${Date.now()}`,
  };
  const next = [record, ...readReminders()];
  saveManagerReminders(next);
  return record;
}

export function markReminderCancelled(reminderId: string) {
  updateReminderStatus(reminderId, 'cancelled');
}

export function subscribeReminderUpdates(callback: () => void) {
  if (!isBrowser()) return () => {};

  const onUpdate = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === REMINDER_STORAGE_KEY) {
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

