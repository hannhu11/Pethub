import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CalendarDays, Clock3, PawPrint, Stethoscope, PlusCircle } from 'lucide-react';
import type { ApiAppointment, ApiPet, ApiService, BookingDraft, CancelDialogState } from '../types';
import { extractApiError } from '../lib/api-client';
import {
  TIME_SLOTS,
  combineDateAndTime,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
  isUpcoming,
  toDateInputValue,
  toDateLabel,
  toTimeLabel,
} from '../lib/format';
import { cancelAppointment, createAppointment, listAppointments, listCatalogServices, listPets } from '../lib/pethub-api';
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

const today = toDateInputValue(new Date());

export function CustomerAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialServiceId = searchParams.get('serviceId') || undefined;

  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [draft, setDraft] = useState<BookingDraft>({
    serviceId: initialServiceId,
    date: today,
  });
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState>({ open: false, appointmentId: null });

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [appointmentData, petData, serviceData] = await Promise.all([
          listAppointments(),
          listPets(),
          listCatalogServices(),
        ]);
        if (!mounted) {
          return;
        }
        setAppointments(appointmentData);
        setPets(petData);
        setServices(serviceData);
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

  const selectedService = services.find((service) => service.id === draft.serviceId);
  const selectedPet = pets.find((pet) => pet.id === draft.petId);

  const filteredAppointments = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime(),
    );
    if (filter === 'all') {
      return sorted;
    }

    if (filter === 'upcoming') {
      return sorted.filter((item) => isUpcoming(item.appointmentAt));
    }

    return sorted.filter((item) => !isUpcoming(item.appointmentAt));
  }, [appointments, filter]);

  const appointmentToCancel = useMemo(
    () => appointments.find((item) => item.id === cancelDialog.appointmentId),
    [appointments, cancelDialog.appointmentId],
  );

  const resetDraft = () => {
    setDraft({ date: today });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('serviceId');
    setSearchParams(nextParams, { replace: true });
  };

  const canSubmit = Boolean(draft.serviceId && draft.petId && draft.date && draft.time);

  const handleSubmit = async () => {
    if (!canSubmit || !selectedService || !selectedPet || !draft.date || !draft.time) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const created = await createAppointment({
        petId: selectedPet.id,
        serviceId: selectedService.id,
        appointmentAt: combineDateAndTime(draft.date, draft.time),
        note: draft.note?.trim() || undefined,
      });
      setAppointments((prev) => [created, ...prev]);
      resetDraft();
      setFilter('upcoming');
      setSuccess('Đặt lịch thành công. Lịch hẹn đã được lưu vào hệ thống.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelDialog = (appointmentId: string) => {
    setCancelDialog({ open: true, appointmentId });
  };

  const closeCancelDialog = () => {
    setCancelDialog({ open: false, appointmentId: null });
  };

  const confirmCancel = async () => {
    if (!cancelDialog.appointmentId) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const updated = await cancelAppointment(cancelDialog.appointmentId);
      setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSuccess('Đã hủy lịch hẹn.');
      closeCancelDialog();
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

        {error ? (
          <div className='rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 mb-6'>{error}</div>
        ) : null}
        {success ? (
          <div className='rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700 mb-6'>{success}</div>
        ) : null}

        <section className='bg-white border border-[#2d2a26] rounded-2xl p-5 md:p-6 mb-8'>
          <div className='flex items-center gap-2 mb-4'>
            <PlusCircle className='w-5 h-5 text-[#6b8f5e]' />
            <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Đặt lịch mới
            </h2>
          </div>

          {loading ? (
            <p className='text-sm text-[#7a756e]'>Đang tải danh sách dịch vụ và thú cưng...</p>
          ) : null}

          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <Stethoscope className='w-4 h-4 text-[#6b8f5e]' />
                Dịch vụ
              </label>
              <select
                value={draft.serviceId || ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, serviceId: e.target.value || undefined }))}
                className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
              >
                <option value=''>-- Chọn dịch vụ --</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({formatCurrency(service.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <PawPrint className='w-4 h-4 text-[#6b8f5e]' />
                Thú cưng
              </label>
              <select
                value={draft.petId || ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, petId: e.target.value || undefined }))}
                className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
              >
                <option value=''>-- Chọn thú cưng --</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.breed || 'Chưa cập nhật giống'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <CalendarDays className='w-4 h-4 text-[#6b8f5e]' />
                Ngày hẹn
              </label>
              <input
                type='date'
                value={draft.date || today}
                min={today}
                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
              />
            </div>

            <div>
              <label className='text-sm text-[#2d2a26] mb-2 flex items-center gap-2'>
                <Clock3 className='w-4 h-4 text-[#6b8f5e]' />
                Khung giờ (30 phút)
              </label>
              <div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = draft.time === slot;
                  return (
                    <button
                      key={slot}
                      type='button'
                      onClick={() => setDraft((prev) => ({ ...prev, time: slot }))}
                      className={`py-2 rounded-xl text-sm border transition-all ${
                        isSelected
                          ? 'bg-[#6b8f5e] text-white border-[#6b8f5e] -translate-y-0.5'
                          : 'bg-white border-[#2d2a26]/25 hover:-translate-y-0.5'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='mt-4'>
            <label className='text-sm text-[#2d2a26] mb-2 block'>Ghi chú</label>
            <textarea
              rows={3}
              value={draft.note || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
              placeholder='Mô tả triệu chứng hoặc yêu cầu đặc biệt...'
              className='w-full p-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e] resize-none'
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
              <span>{draft.date && draft.time ? `${draft.date} - ${draft.time}` : 'Chưa chọn'}</span>
            </div>
            <div className='flex justify-between gap-4 mt-1'>
              <span className='text-[#7a756e]'>Chi phí dự kiến</span>
              <span className='text-[#6b8f5e]' style={{ fontWeight: 700 }}>
                {selectedService ? formatCurrency(selectedService.price) : '--'}
              </span>
            </div>
          </div>

          <div className='mt-4 flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className='px-6 py-3 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-[2px] transition-transform'
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
            </button>
            <button
              type='button'
              onClick={resetDraft}
              className='px-6 py-3 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all'
            >
              Làm mới
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
                  className={`px-3 py-2 text-sm rounded-xl border transition-all ${
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
                  const canCancel =
                    isUpcoming(item.appointmentAt) &&
                    (item.status === 'pending' || item.status === 'confirmed');

                  return (
                    <tr key={item.id} className='border-b border-[#2d2a26]/10'>
                      <td className='py-3 px-2'>{toDateLabel(item.appointmentAt)}</td>
                      <td className='py-3 px-2' style={{ fontWeight: 600 }}>{toTimeLabel(item.appointmentAt)}</td>
                      <td className='py-3 px-2'>{item.service?.name || 'Dịch vụ'}</td>
                      <td className='py-3 px-2'>{item.pet?.name || 'Thú cưng'}</td>
                      <td className='py-3 px-2'>
                        <span className={`inline-flex px-3 py-1 rounded-xl border text-xs ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className='py-3 px-2 text-right text-[#6b8f5e]' style={{ fontWeight: 700 }}>
                        {formatCurrency(item.service?.price)}
                      </td>
                      <td className='py-3 px-2 text-right'>
                        {canCancel ? (
                          <button
                            onClick={() => openCancelDialog(item.id)}
                            className='px-3 py-1.5 text-xs rounded-xl border border-red-900 text-red-900 hover:bg-red-50 transition-colors'
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

          {!loading && filteredAppointments.length === 0 ? (
            <p className='text-sm text-[#7a756e] py-6'>Không có lịch hẹn phù hợp bộ lọc hiện tại.</p>
          ) : null}
        </section>
      </div>

      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => !open && closeCancelDialog()}>
        <AlertDialogContent className='border-[#2d2a26] bg-[#faf9f6]'>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Xác nhận hủy lịch hẹn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Lịch hẹn của bạn sẽ bị hủy bỏ khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {appointmentToCancel && (
            <div className='p-3 rounded-xl border border-[#2d2a26]/20 bg-[#f0ede8] text-sm'>
              <p><span className='text-[#7a756e]'>Dịch vụ:</span> {appointmentToCancel.service?.name || 'Dịch vụ'}</p>
              <p><span className='text-[#7a756e]'>Ngày:</span> {toDateLabel(appointmentToCancel.appointmentAt)}</p>
              <p><span className='text-[#7a756e]'>Giờ:</span> {toTimeLabel(appointmentToCancel.appointmentAt)}</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className='border-[#2d2a26] text-[#2d2a26]'>Không, giữ lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className='bg-red-600 hover:bg-red-700 text-white border border-red-700'
            >
              Có, Hủy lịch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
