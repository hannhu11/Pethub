import type { NotificationItem } from '../types';

const NOTIFICATION_STORAGE_KEY = 'pethub-manager-notifications-v1';
const UPDATE_EVENT = 'pethub-manager-notifications-updated';

const defaultNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Lịch hẹn mới',
    body: 'Nguyễn Văn An vừa đặt lịch cho Lucky.',
    to: '/manager/bookings',
    createdAt: '5 phút trước',
    read: false,
  },
  {
    id: 2,
    title: 'Nhắc nhở tiêm phòng',
    body: 'Mimi đến hạn vaccine hôm nay.',
    to: '/manager/reminders',
    createdAt: '30 phút trước',
    read: false,
  },
  {
    id: 3,
    title: 'Thanh toán hoàn tất',
    body: 'Hóa đơn #INV-20260311-102 đã được thanh toán.',
    to: '/manager/pos',
    createdAt: '1 giờ trước',
    read: true,
    readAt: '2026-03-11T08:00:00.000Z',
  },
  {
    id: 4,
    title: 'Đánh giá mới',
    body: 'Trần Thị Bình gửi đánh giá 5 sao.',
    to: '/manager/customers',
    createdAt: '2 giờ trước',
    read: true,
    readAt: '2026-03-11T07:00:00.000Z',
  },
];

function isBrowser() {
  return typeof window !== 'undefined';
}

function readNotifications() {
  if (!isBrowser()) return defaultNotifications;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return defaultNotifications;
    const parsed = JSON.parse(raw) as Array<NotificationItem & { text?: string; time?: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultNotifications;
    }
    return parsed.map((item, index) => ({
      id: item.id ?? defaultNotifications[index]?.id ?? index + 1,
      title: item.title ?? item.text ?? defaultNotifications[index]?.title ?? 'Thông báo',
      body: item.body ?? defaultNotifications[index]?.body ?? '',
      to: item.to ?? '/manager',
      createdAt: item.createdAt ?? item.time ?? 'Vừa xong',
      read: Boolean(item.read),
      readAt: item.readAt,
    }));
  } catch {
    return defaultNotifications;
  }
}

function writeNotifications(notifications: NotificationItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
}

function notifyUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function getNotifications() {
  return readNotifications();
}

export function getUnreadNotificationCount() {
  return readNotifications().filter((item) => !item.read).length;
}

export function markNotificationAsRead(notificationId: number) {
  const next = readNotifications().map((item) =>
    item.id === notificationId && !item.read
      ? {
          ...item,
          read: true,
          readAt: new Date().toISOString(),
        }
      : item,
  );
  writeNotifications(next);
  notifyUpdate();
}

export function markAllNotificationsAsRead() {
  const now = new Date().toISOString();
  const next = readNotifications().map((item) =>
    item.read
      ? item
      : {
          ...item,
          read: true,
          readAt: now,
        },
  );
  writeNotifications(next);
  notifyUpdate();
}

export function subscribeNotificationUpdates(callback: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const onUpdate = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === NOTIFICATION_STORAGE_KEY) {
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
