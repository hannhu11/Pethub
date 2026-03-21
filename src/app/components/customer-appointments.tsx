import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, Clock3, PawPrint, PlusCircle, Stethoscope } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { ApiAppointment, ApiPet, ApiService, BookingDraft, CancelDialogState } from '../types';
import { cancelAppointment, createAppointment, listAppointments, listCatalogServices, listPets } from '../lib/pethub-api';
import { extractApiError } from '../lib/api-client';
import { useAuthSession } from '../auth-session';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const timeSlots = [
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
];

function formatCurrency(value: number | string) {
  return `${Math.round(Number(value ?? 0)).toLocaleString('vi-VN')} ₫`;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function isActiveAppointment(status: ApiAppointment['status']) {
  return status === 'pending' || status === 'confirmed';
}

function statusLabel(status: ApiAppointment['status']) {
  if (status === 'pending') return 'Chờ xác nhận';
  if (status === 'confirmed') return 'Đã xác nhận';
  if (status === 'completed') return 'Hoàn thành';
  if (status === 'cancelled') return 'Đã hủy';
  return status;
}

function statusClass(status: ApiAppointment['status']) {
  if (status === 'pending') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (status === 'confirmed') return 'border-sky-300 bg-sky-50 text-sky-700';
  if (status === 'completed') return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'border-red-300 bg-red-50 text-red-700';
  return 'border-[#592518]/20 bg-white text-[#592518]';
}

function dedupeAppointments(items: ApiAppointment[]) {
  const byId = new Map<string, ApiAppointment>();
  for (const item of items) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime(),
  );
}

export function CustomerAppointmentsPage() {
  const { session } = useAuthSession();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [draft, setDraft] = useState<BookingDraft>({
    date: toDateInputValue(new Date()),
  });
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState>({ open: false, appointmentId: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const serviceIdFromQuery = searchParams.get('serviceId')?.trim() || '';

  const loadData = async () => {
    const [appointmentResult, serviceResult, petResult] = await Promise.allSettled([
      listAppointments(),
      listCatalogServices(),
      listPets(),
    ]);

    if (appointmentResult.status === 'fulfilled') {
      setAppointments(dedupeAppointments(appointmentResult.value));
    }
    if (serviceResult.status === 'fulfilled') {
      setServices(serviceResult.value);
    }
    if (petResult.status === 'fulfilled') {
      setPets(petResult.value);
    }

    const firstError =
      appointmentResult.status === 'rejected'
        ? appointmentResult.reason
        : serviceResult.status === 'rejected'
          ? serviceResult.reason
          : petResult.status === 'rejected'
            ? petResult.reason
            : null;
    if (firstError) {
      throw firstError;
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      setAppointments([]);
      try {
        await loadData();
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [session.user?.userId]);

  useEffect(() => {
    if (!serviceIdFromQuery || services.length === 0) {
      return;
    }

    if (!services.some((service) => service.id === serviceIdFromQuery)) {
      return;
    }

    setDraft((prev) => (prev.serviceId ? prev : { ...prev, serviceId: serviceIdFromQuery }));
  }, [serviceIdFromQuery, services]);

  const selectedService = services.find((item) => item.id === draft.serviceId);
  const selectedPet = pets.find((item) => item.id === draft.petId);
  const hasServices = services.length > 0;
  const hasPets = pets.length > 0;
  const canSubmit = Boolean(hasServices && hasPets && draft.serviceId && draft.petId && draft.date && draft.time);

  const filteredAppointments = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime(),
    );

    if (filter === 'all') {
      return sorted;
    }
    if (filter === 'upcoming') {
      return sorted.filter((item) => isActiveAppointment(item.status));
    }
    return sorted.filter((item) => !isActiveAppointment(item.status));
  }, [appointments, filter]);

  const appointmentToCancel = useMemo(
    () => appointments.find((item) => item.id === cancelDialog.appointmentId),
    [appointments, cancelDialog.appointmentId],
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Vui lòng chọn đầy đủ dịch vụ, thú cưng, ngày và giờ hẹn.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const iso = new Date(`${draft.date}T${draft.time}:00`).toISOString();
      const created = await createAppointment({
        petId: draft.petId!,
        serviceId: draft.serviceId!,
        appointmentAt: iso,
        note: draft.note?.trim() || undefined,
      });
      setAppointments((prev) => dedupeAppointments([created, ...prev]));
      void loadData().catch(() => undefined);
      setMessage('Đặt lịch thành công.');
      setDraft({ date: toDateInputValue(new Date()) });
      setFilter('upcoming');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelDialog.appointmentId) {
      return;
    }

    try {
      await cancelAppointment(cancelDialog.appointmentId);
      void loadData().catch(() => undefined);
      setMessage('Đã hủy lịch hẹn.');
      setCancelDialog({ open: false, appointmentId: null });
    } catch (apiError) {
      setError(extractApiError(apiError));
    }
  };

  return (
    <div className='py-12'>
      <div className='max-w-6xl mx-auto px-4'>
        <h1 className='text-3xl text-[#592518] mb-6' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Lịch hẹn của tôi
        </h1>

        {error ? <div className='mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
        {message ? (
          <div className='mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
        ) : null}

        <section className='bg-white border border-[#592518] rounded-2xl p-5 md:p-6 mb-8'>
          <div className='flex items-center gap-2 mb-4'>
            <PlusCircle className='w-5 h-5 text-[#d56756]' />
            <h2 className='text-xl text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Đặt lịch mới
            </h2>
          </div>

          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm text-[#592518] mb-2 flex items-center gap-2'>
                <Stethoscope className='w-4 h-4 text-[#d56756]' />
                Dịch vụ
              </label>
              <div className='relative'>
                <select
                  value={draft.serviceId || ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, serviceId: event.target.value }))}
                  disabled={!hasServices}
                  className='w-full appearance-none p-3 pr-10 border border-[#592518] rounded-xl bg-[#faf8f5]'
                >
                  <option value=''>-- Chọn dịch vụ --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({formatCurrency(service.price)})
                    </option>
                  ))}
                </select>
                <ChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#592518]/70' />
              </div>
              {!loading && !hasServices ? (
                <p className='mt-2 text-xs text-[#8b6a61]'>Phòng khám chưa cập nhật dịch vụ. Vui lòng thử lại sau.</p>
              ) : null}
            </div>

            <div>
              <label className='text-sm text-[#592518] mb-2 flex items-center gap-2'>
                <PawPrint className='w-4 h-4 text-[#d56756]' />
                Thú cưng
              </label>
              <div className='relative'>
                <select
                  value={draft.petId || ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, petId: event.target.value }))}
                  disabled={!hasPets}
                  className='w-full appearance-none p-3 pr-10 border border-[#592518] rounded-xl bg-[#faf8f5]'
                >
                  <option value=''>-- Chọn thú cưng --</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed || pet.species})
                    </option>
                  ))}
                </select>
                <ChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#592518]/70' />
              </div>
              {!loading && !hasPets ? (
                <p className='mt-2 text-xs text-[#8b6a61]'>
                  Bạn chưa có thú cưng nào. Vui lòng liên hệ quản trị viên để thêm hồ sơ thú cưng trước khi đặt lịch.
                </p>
              ) : null}
            </div>

            <div>
              <label className='text-sm text-[#592518] mb-2 flex items-center gap-2'>
                <CalendarDays className='w-4 h-4 text-[#d56756]' />
                Ngày hẹn
              </label>
              <input
                type='date'
                value={draft.date || toDateInputValue(new Date())}
                min={toDateInputValue(new Date())}
                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                className='w-full p-3 border border-[#592518] rounded-xl bg-[#faf8f5]'
              />
            </div>

            <div>
              <label className='text-sm text-[#592518] mb-2 flex items-center gap-2'>
                <Clock3 className='w-4 h-4 text-[#d56756]' />
                Khung giờ
              </label>
              <div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type='button'
                    onClick={() => setDraft((prev) => ({ ...prev, time: slot }))}
                    className={`py-2 rounded-xl text-sm border ${
                      draft.time === slot
                        ? 'bg-[#d56756] text-white border-[#d56756]'
                        : 'bg-white border-[#592518]/25'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='mt-4'>
            <label className='text-sm text-[#592518] mb-2 block'>Ghi chú</label>
            <textarea
              rows={3}
              value={draft.note || ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
              placeholder='Mô tả triệu chứng hoặc yêu cầu đặc biệt...'
              className='w-full p-3 border border-[#592518] rounded-xl bg-[#faf8f5] resize-none'
            />
          </div>

          <div className='mt-5 p-4 rounded-xl border border-[#592518]/20 bg-[#f4ece4] text-sm'>
            <div className='flex justify-between gap-4'>
              <span className='text-[#8b6a61]'>Dịch vụ</span>
              <span>{selectedService?.name || 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#8b6a61]'>Thú cưng</span>
              <span>{selectedPet?.name || 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#8b6a61]'>Thời gian</span>
              <span>{draft.date && draft.time ? `${draft.date} ${draft.time}` : 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#8b6a61]'>Chi phí dự kiến</span>
              <span className='text-[#d56756]' style={{ fontWeight: 700 }}>
                {selectedService ? formatCurrency(selectedService.price) : '--'}
              </span>
            </div>
          </div>

          <div className='mt-4'>
            <button
              type='button'
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || submitting}
              className='px-6 py-3 rounded-xl bg-[#d56756] text-white border border-[#592518] disabled:opacity-50'
            >
              {submitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
            </button>
          </div>
        </section>

        <section className='bg-white border border-[#592518] rounded-2xl p-5 md:p-6'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-4'>
            <h2 className='text-xl text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Danh sách lịch hẹn
            </h2>
            <div className='flex items-center gap-2'>
              {[
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'past', label: 'Past' },
                { key: 'all', label: 'Tất cả' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as 'upcoming' | 'past' | 'all')}
                  className={`px-3 py-2 text-sm rounded-xl border ${
                    filter === item.key ? 'bg-[#d56756] text-white border-[#d56756]' : 'bg-white border-[#592518]/25'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full min-w-[840px] text-sm'>
              <thead>
                <tr className='border-b border-[#592518]'>
                  <th className='text-left py-3 px-2 text-[#8b6a61]'>Ngày</th>
                  <th className='text-left py-3 px-2 text-[#8b6a61]'>Giờ</th>
                  <th className='text-left py-3 px-2 text-[#8b6a61]'>Dịch vụ</th>
                  <th className='text-left py-3 px-2 text-[#8b6a61]'>Thú cưng</th>
                  <th className='text-left py-3 px-2 text-[#8b6a61]'>Trạng thái</th>
                  <th className='text-right py-3 px-2 text-[#8b6a61]'>Chi phí</th>
                  <th className='text-right py-3 px-2 text-[#8b6a61]'>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((item) => {
                  const canCancel = item.status === 'pending';
                  return (
                    <tr key={item.id} className='border-b border-[#592518]/10'>
                      <td className='py-3 px-2'>{formatDate(item.appointmentAt)}</td>
                      <td className='py-3 px-2' style={{ fontWeight: 600 }}>
                        {formatTime(item.appointmentAt)}
                      </td>
                      <td className='py-3 px-2'>{item.service?.name || 'Dịch vụ'}</td>
                      <td className='py-3 px-2'>{item.pet?.name || 'Thú cưng'}</td>
                      <td className='py-3 px-2'>
                        <span className={`inline-flex px-3 py-1 rounded-xl border text-xs ${statusClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className='py-3 px-2 text-right text-[#d56756]' style={{ fontWeight: 700 }}>
                        {formatCurrency(item.service?.price ?? 0)}
                      </td>
                      <td className='py-3 px-2 text-right'>
                        {canCancel ? (
                          <button
                            onClick={() => setCancelDialog({ open: true, appointmentId: item.id })}
                            className='px-3 py-1.5 text-xs rounded-xl border border-red-900 text-red-900 hover:bg-red-50'
                          >
                            Hủy lịch hẹn
                          </button>
                        ) : (
                          <span className='text-xs text-[#8b6a61]'>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading ? <p className='text-sm text-[#8b6a61] py-6'>Đang tải lịch hẹn...</p> : null}
          {!loading && filteredAppointments.length === 0 ? (
            <p className='text-sm text-[#8b6a61] py-6'>Không có lịch hẹn phù hợp bộ lọc hiện tại.</p>
          ) : null}
        </section>
      </div>

      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, appointmentId: null })}>
        <AlertDialogContent className='border-[#592518] bg-[#faf8f5]'>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Xác nhận hủy lịch hẹn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Lịch hẹn của bạn sẽ bị hủy khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {appointmentToCancel ? (
            <div className='p-3 rounded-xl border border-[#592518]/20 bg-[#f4ece4] text-sm'>
              <p>
                <span className='text-[#8b6a61]'>Dịch vụ:</span> {appointmentToCancel.service?.name || 'Dịch vụ'}
              </p>
              <p>
                <span className='text-[#8b6a61]'>Ngày:</span> {formatDate(appointmentToCancel.appointmentAt)}
              </p>
              <p>
                <span className='text-[#8b6a61]'>Giờ:</span> {formatTime(appointmentToCancel.appointmentAt)}
              </p>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel className='border-[#592518] text-[#592518]'>Không, giữ lại</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmCancel()} className='bg-red-600 hover:bg-red-700 text-white border border-red-700'>
              Có, Hủy lịch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
