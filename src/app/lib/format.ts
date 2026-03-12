import type { AppointmentStatus } from '../types';

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
];

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function getStatusLabel(status: AppointmentStatus | string): string {
  switch (status) {
    case 'pending':
      return 'Chờ xác nhận';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function getStatusColor(status: AppointmentStatus | string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-300';
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-300';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-300';
  }
}

export function toDateLabel(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }
  return parsed.toLocaleDateString('vi-VN', { timeZone: VN_TIMEZONE });
}

export function toTimeLabel(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }
  return parsed.toLocaleTimeString('vi-VN', {
    timeZone: VN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toDateInputValue(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export function combineDateAndTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function isUpcoming(appointmentAt: string): boolean {
  return new Date(appointmentAt).getTime() >= Date.now();
}
