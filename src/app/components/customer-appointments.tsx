import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, PawPrint, PlusCircle, Stethoscope } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { ApiAppointment, ApiPet, ApiService, BookingDraft, CancelDialogState } from '../types';
import { cancelAppointment, createAppointment, listAppointments, listCatalogServices, listPets } from '../lib/pethub-api';
import { extractApiError } from '../lib/api-client';
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

function isUpcoming(iso: string) {
  return new Date(iso).getTime() >= Date.now();
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
  return 'border-[#2d2a26]/20 bg-white text-[#2d2a26]';
}

export function CustomerAppointmentsPage() {
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
    const [appointmentData, serviceData, petData] = await Promise.all([
      listAppointments(),
      listCatalogServices(),
      listPets(),
    ]);
    setAppointments(appointmentData);
    setServices(serviceData);
    setPets(petData);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
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
  }, []);

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
    if (filter === 'all') {
      return appointments;
    }
    if (filter === 'upcoming') {
      return appointments.filter((item) => isUpcoming(item.appointmentAt));
    }
    return appointments.filter((item) => !isUpcoming(item.appointmentAt));
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
      await createAppointment({
        petId: draft.petId!,
        serviceId: draft.serviceId!,
        appointmentAt: iso,
        note: draft.note?.trim() || undefined,
      });
      await loadData();
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
      await loadData();
      setMessage('Đã hủy lịch hẹn.');
      setCancelDialog({ open: false, appointmentId: null });
    } catch (apiError) {
      setError(extractApiError(apiError));
    }
  };

  return (
    <div className='py-12'>
      <div className='max-w-6xl mx-auto px-4'>
        <h1 className='text-3xl text-[#2d2a26] mb-6' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Lịch hẹn của tôi
        </h1>

        {error ? <div className='mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
        {message ? (
          <div className='mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
        ) : null}

        <section className='bg-white border border-[#2d2a26] rounded-2xl p-5 md:p-6 mb-8'>
          <div className='flex items-center gap-2 mb-4'>
            <PlusCircle className='w-5 h-5 text-[#6b8f5e]' />
            <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Đặt lịch mới
            </h2>
          </div>

          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <Stethoscope className='w-4 h-4 text-[#6b8f5e]' />
                Dịch vụ
              </label>
              <select
                value={draft.serviceId || ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, serviceId: event.target.value }))}
                disabled={!hasServices}
                className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6]'
              >
                <option value=''>-- Chọn dịch vụ --</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({formatCurrency(service.price)})
                  </option>
                ))}
              </select>
              {!loading && !hasServices ? (
                <p className='mt-2 text-xs text-[#7a756e]'>Phòng khám chưa cập nhật dịch vụ. Vui lòng thử lại sau.</p>
              ) : null}
            </div>

            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <PawPrint className='w-4 h-4 text-[#6b8f5e]' />
                Thú cưng
              </label>
              <select
                value={draft.petId || ''}
                onChange={(event) => setDraft((prev) => ({ ...prev, petId: event.target.value }))}
                disabled={!hasPets}
                className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6]'
              >
                <option value=''>-- Chọn thú cưng --</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.breed || pet.species})
                  </option>
                ))}
              </select>
              {!loading && !hasPets ? (
                <p className='mt-2 text-xs text-[#7a756e]'>
                  Bạn chưa có thú cưng nào. Vui lòng thêm tại mục <a href='/customer/my-pets' className='underline text-[#6b8f5e]'>Thú cưng của tôi</a>.
                </p>
              ) : null}
            </div>

            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <CalendarDays className='w-4 h-4 text-[#6b8f5e]' />
                Ngày hẹn
              </label>
              <input
                type='date'
                value={draft.date || toDateInputValue(new Date())}
                min={toDateInputValue(new Date())}
                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6]'
              />
            </div>

            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <Clock3 className='w-4 h-4 text-[#6b8f5e]' />
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
                        ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]'
                        : 'bg-white border-[#2d2a26]/25'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='mt-4'>
            <label className='text-sm text-[#2d2a26] mb-2 block'>Ghi chú</label>
            <textarea
              rows={3}
              value={draft.note || ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
              placeholder='Mô tả triệu chứng hoặc yêu cầu đặc biệt...'
              className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] resize-none'
            />
          </div>

          <div className='mt-5 p-4 rounded-xl border border-[#2d2a26]/20 bg-[#f0ede8] text-sm'>
            <div className='flex justify-between gap-4'>
              <span className='text-[#7a756e]'>Dịch vụ</span>
              <span>{selectedService?.name || 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#7a756e]'>Thú cưng</span>
              <span>{selectedPet?.name || 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#7a756e]'>Thời gian</span>
              <span>{draft.date && draft.time ? `${draft.date} ${draft.time}` : 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#7a756e]'>Chi phí dự kiến</span>
              <span className='text-[#6b8f5e]' style={{ fontWeight: 700 }}>
                {selectedService ? formatCurrency(selectedService.price) : '--'}
              </span>
            </div>
          </div>

          <div className='mt-4'>
            <button
              type='button'
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || submitting}
              className='px-6 py-3 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] disabled:opacity-50'
            >
              {submitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
            </button>
          </div>
        </section>

        <section className='bg-white border border-[#2d2a26] rounded-2xl p-5 md:p-6'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-4'>
            <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
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
                    filter === item.key ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]' : 'bg-white border-[#2d2a26]/25'
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
                <tr className='border-b border-[#2d2a26]'>
                  <th className='text-left py-3 px-2 text-[#7a756e]'>Ngày</th>
                  <th className='text-left py-3 px-2 text-[#7a756e]'>Giờ</th>
                  <th className='text-left py-3 px-2 text-[#7a756e]'>Dịch vụ</th>
                  <th className='text-left py-3 px-2 text-[#7a756e]'>Thú cưng</th>
                  <th className='text-left py-3 px-2 text-[#7a756e]'>Trạng thái</th>
                  <th className='text-right py-3 px-2 text-[#7a756e]'>Chi phí</th>
                  <th className='text-right py-3 px-2 text-[#7a756e]'>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((item) => {
                  const canCancel = (item.status === 'pending' || item.status === 'confirmed') && isUpcoming(item.appointmentAt);
                  return (
                    <tr key={item.id} className='border-b border-[#2d2a26]/10'>
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
                      <td className='py-3 px-2 text-right text-[#6b8f5e]' style={{ fontWeight: 700 }}>
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
                          <span className='text-xs text-[#7a756e]'>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading ? <p className='text-sm text-[#7a756e] py-6'>Đang tải lịch hẹn...</p> : null}
          {!loading && filteredAppointments.length === 0 ? (
            <p className='text-sm text-[#7a756e] py-6'>Không có lịch hẹn phù hợp bộ lọc hiện tại.</p>
          ) : null}
        </section>
      </div>

      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, appointmentId: null })}>
        <AlertDialogContent className='border-[#2d2a26] bg-[#faf9f6]'>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Xác nhận hủy lịch hẹn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Lịch hẹn của bạn sẽ bị hủy khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {appointmentToCancel ? (
            <div className='p-3 rounded-xl border border-[#2d2a26]/20 bg-[#f0ede8] text-sm'>
              <p>
                <span className='text-[#7a756e]'>Dịch vụ:</span> {appointmentToCancel.service?.name || 'Dịch vụ'}
              </p>
              <p>
                <span className='text-[#7a756e]'>Ngày:</span> {formatDate(appointmentToCancel.appointmentAt)}
              </p>
              <p>
                <span className='text-[#7a756e]'>Giờ:</span> {formatTime(appointmentToCancel.appointmentAt)}
              </p>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel className='border-[#2d2a26] text-[#2d2a26]'>Không, giữ lại</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmCancel()} className='bg-red-600 hover:bg-red-700 text-white border border-red-700'>
              Có, Hủy lịch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
