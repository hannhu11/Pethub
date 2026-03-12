import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CalendarDays, Search } from 'lucide-react';
import type { ApiAppointment, AppointmentStatus } from '../types';
import { extractApiError } from '../lib/api-client';
import { getStatusColor, getStatusLabel, toDateLabel, toTimeLabel } from '../lib/format';
import { cancelAppointment, listAppointments, updateAppointmentStatus } from '../lib/pethub-api';

type BookingFilter = 'all' | AppointmentStatus;

export function ManagerBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBookings = useMemo(
    () => async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listAppointments();
        setBookings(data);
      } catch (apiError) {
        setError(extractApiError(apiError));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filtered = bookings.filter((booking) => {
    if (filter !== 'all' && booking.status !== filter) return false;

    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      booking.customer?.name?.toLowerCase().includes(keyword) ||
      booking.pet?.name?.toLowerCase().includes(keyword) ||
      booking.service?.name?.toLowerCase().includes(keyword) ||
      booking.customer?.phone?.includes(keyword)
    );
  });

  const applyUpdatedAppointment = (appointment: ApiAppointment) => {
    setBookings((previous) =>
      previous.map((booking) => (booking.id === appointment.id ? appointment : booking)),
    );
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setError('');
    setSuccess('');
    setUpdatingId(id);
    try {
      const response = await updateAppointmentStatus(id, status);
      applyUpdatedAppointment(response.appointment);
      setSuccess('Cập nhật trạng thái lịch hẹn thành công.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelByManager = async (id: string) => {
    setError('');
    setSuccess('');
    setUpdatingId(id);
    try {
      const updated = await cancelAppointment(id);
      applyUpdatedAppointment(updated);
      setSuccess('Đã hủy lịch hẹn.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setUpdatingId(null);
    }
  };

  const openCheckout = (appointmentId: string) => {
    navigate(`/manager/pos?appointmentId=${appointmentId}`);
  };

  const statusFilters: Array<{ key: BookingFilter; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: bookings.length },
    { key: 'pending', label: 'Chờ duyệt', count: bookings.filter((booking) => booking.status === 'pending').length },
    { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter((booking) => booking.status === 'confirmed').length },
    { key: 'completed', label: 'Hoàn thành', count: bookings.filter((booking) => booking.status === 'completed').length },
    { key: 'cancelled', label: 'Đã hủy', count: bookings.filter((booking) => booking.status === 'cancelled').length },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Quản lý lịch hẹn
        </h1>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]' />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Tìm khách hàng, thú cưng, dịch vụ...'
            className='pl-9 pr-4 py-2 border border-[#2d2a26] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6b8f5e] w-72'
          />
        </div>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div>
      ) : null}
      {success ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{success}</div>
      ) : null}

      <div className='flex flex-wrap gap-2'>
        {statusFilters.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-4 py-2 rounded-xl text-sm border transition-all hover:-translate-y-0.5 ${
              filter === item.key ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]' : 'bg-white text-[#2d2a26] border-[#2d2a26]/30'
            }`}
            style={filter === item.key ? { fontWeight: 600 } : {}}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm min-w-[980px]'>
            <thead>
              <tr className='border-b border-[#2d2a26]'>
                {['Giờ', 'Ngày', 'Khách hàng', 'SĐT', 'Thú cưng', 'Dịch vụ', 'Trạng thái', 'Thanh toán', 'Hành động'].map((header) => (
                  <th key={header} className='text-left py-3 px-3 text-xs text-[#7a756e] whitespace-nowrap'>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking, index) => {
                const busy = updatingId === booking.id;
                const paymentLabel =
                  booking.paymentStatus === 'paid'
                    ? 'Đã thanh toán'
                    : booking.paymentStatus === 'refunded'
                      ? 'Đã hoàn tiền'
                      : 'Chưa thanh toán';

                return (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className='border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]'
                  >
                    <td className='py-3 px-3' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {toTimeLabel(booking.appointmentAt)}
                    </td>
                    <td className='py-3 px-3 text-[#7a756e]'>{toDateLabel(booking.appointmentAt)}</td>
                    <td className='py-3 px-3'>{booking.customer?.name || 'Khách hàng'}</td>
                    <td className='py-3 px-3 text-[#7a756e]'>{booking.customer?.phone || '--'}</td>
                    <td className='py-3 px-3'>{booking.pet?.name || 'Thú cưng'}</td>
                    <td className='py-3 px-3'>{booking.service?.name || 'Dịch vụ'}</td>
                    <td className='py-3 px-3'>
                      <span className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-[#f5f0eb] text-[#7a756e] border-[#2d2a26]/15'
                        }`}
                      >
                        {paymentLabel}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='flex flex-wrap gap-1.5'>
                        {booking.status === 'pending' ? (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => void updateStatus(booking.id, 'confirmed')}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#6b8f5e]/30 bg-[#6b8f5e]/10 text-[#6b8f5e] hover:bg-[#6b8f5e]/20 transition-colors disabled:opacity-50'
                            >
                              Xác nhận
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => void cancelByManager(booking.id)}
                              className='px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50'
                            >
                              Hủy
                            </button>
                          </>
                        ) : null}

                        {booking.status === 'confirmed' ? (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => void updateStatus(booking.id, 'completed')}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26]/20 bg-white text-[#2d2a26] hover:bg-[#f0ede8] transition-colors disabled:opacity-50'
                            >
                              Hoàn tất khám
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => void cancelByManager(booking.id)}
                              className='px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50'
                            >
                              Hủy
                            </button>
                          </>
                        ) : null}

                        {booking.status === 'completed' && booking.paymentStatus !== 'paid' ? (
                          <button
                            onClick={() => openCheckout(booking.id)}
                            className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all'
                            style={{ fontWeight: 600 }}
                          >
                            Chuyển sang POS
                          </button>
                        ) : null}

                        {booking.status === 'cancelled' || (booking.status === 'completed' && booking.paymentStatus === 'paid') ? (
                          <span className='text-xs text-[#7a756e]'>-</span>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading ? (
          <div className='text-center py-8 text-sm text-[#7a756e]'>Đang tải lịch hẹn...</div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className='text-center py-12 text-[#7a756e]'>
            <CalendarDays className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Không có lịch hẹn phù hợp</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
