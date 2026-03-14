import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CalendarDays, Search } from 'lucide-react';
import type { ApiAppointment, AppointmentStatus } from '../types';
import { cancelAppointment, listAppointments, updateAppointmentStatus } from '../lib/pethub-api';
import { extractApiError } from '../lib/api-client';

type BookingFilter = 'all' | AppointmentStatus;

function getStatusColor(status: AppointmentStatus) {
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-300';
  if (status === 'confirmed') return 'bg-sky-50 text-sky-700 border-sky-300';
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  if (status === 'cancelled') return 'bg-red-50 text-red-600 border-red-300';
  return 'bg-white text-[#2d2a26] border-[#2d2a26]/20';
}

function getStatusLabel(status: AppointmentStatus) {
  if (status === 'pending') return 'Chờ xác nhận';
  if (status === 'confirmed') return 'Đã xác nhận';
  if (status === 'completed') return 'Hoàn thành';
  if (status === 'cancelled') return 'Đã hủy';
  return status;
}

function toDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function toTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function ManagerBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ApiAppointment[]>([]);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const statusFilters: Array<{ key: BookingFilter; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: bookings.length },
    { key: 'pending', label: 'Chờ duyệt', count: bookings.filter((booking) => booking.status === 'pending').length },
    { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter((booking) => booking.status === 'confirmed').length },
    { key: 'completed', label: 'Hoàn thành', count: bookings.filter((booking) => booking.status === 'completed').length },
    { key: 'cancelled', label: 'Đã hủy', count: bookings.filter((booking) => booking.status === 'cancelled').length },
  ];

  const patchStatus = async (id: string, status: AppointmentStatus) => {
    setWorkingId(id);
    setError('');
    setMessage('');
    try {
      await updateAppointmentStatus(id, status);
      await loadBookings();
      if (status === 'completed') {
        setMessage('Đã hoàn tất lịch hẹn. Có thể chuyển sang POS nếu chưa thanh toán.');
      }
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setWorkingId('');
    }
  };

  const cancel = async (id: string) => {
    setWorkingId(id);
    setError('');
    setMessage('');
    try {
      await cancelAppointment(id);
      await loadBookings();
      setMessage('Đã hủy lịch hẹn.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setWorkingId('');
    }
  };

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

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
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
          <table className='w-full text-sm'>
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
                const isWorking = workingId === booking.id;
                const isPaid = booking.paymentStatus === 'paid';
                return (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className='border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]'
                  >
                    <td className='py-3 px-3' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {toTimeLabel(booking.appointmentAt)}
                    </td>
                    <td className='py-3 px-3 text-[#7a756e]'>{toDateLabel(booking.appointmentAt)}</td>
                    <td className='py-3 px-3'>{booking.customer?.name ?? 'Khách hàng'}</td>
                    <td className='py-3 px-3 text-[#7a756e]'>{booking.customer?.phone ?? '--'}</td>
                    <td className='py-3 px-3'>{booking.pet?.name ?? 'Thú cưng'}</td>
                    <td className='py-3 px-3'>{booking.service?.name ?? 'Dịch vụ'}</td>
                    <td className='py-3 px-3'>
                      <span className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-[#f5f0eb] text-[#7a756e] border-[#2d2a26]/15'
                        }`}
                      >
                        {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='flex flex-wrap gap-1.5'>
                        {booking.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => void patchStatus(booking.id, 'confirmed')}
                              disabled={isWorking}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#6b8f5e]/30 bg-[#6b8f5e]/10 text-[#6b8f5e] disabled:opacity-60'
                            >
                              Xác nhận
                            </button>
                            <button
                              onClick={() => void cancel(booking.id)}
                              disabled={isWorking}
                              className='px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-600 disabled:opacity-60'
                            >
                              Hủy
                            </button>
                          </>
                        ) : null}

                        {booking.status === 'confirmed' ? (
                          <>
                            <button
                              onClick={() => void patchStatus(booking.id, 'completed')}
                              disabled={isWorking}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26]/20 bg-white text-[#2d2a26] disabled:opacity-60'
                            >
                              Hoàn tất khám
                            </button>
                            <button
                              onClick={() => void cancel(booking.id)}
                              disabled={isWorking}
                              className='px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-600 disabled:opacity-60'
                            >
                              Hủy
                            </button>
                          </>
                        ) : null}

                        {booking.status === 'completed' && !isPaid ? (
                          <button
                            onClick={() => navigate(`/manager/pos?appointmentId=${booking.id}`)}
                            className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26] bg-[#6b8f5e] text-white'
                            style={{ fontWeight: 600 }}
                          >
                            Chuyển sang POS
                          </button>
                        ) : null}

                        {booking.status === 'completed' && isPaid ? (
                          <span className='text-xs text-emerald-700' style={{ fontWeight: 600 }}>
                            Đã hoàn tất
                          </span>
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
          <div className='text-center py-12 text-[#7a756e]'>
            <p>Đang tải lịch hẹn...</p>
          </div>
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
