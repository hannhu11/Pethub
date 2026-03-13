import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CalendarDays, Search } from 'lucide-react';
import { mockAppointments, getStatusColor, getStatusLabel, type Appointment } from './data';
import { getAppointmentCheckoutState, subscribeCheckoutUpdates } from './manager-checkout-store';

type BookingFilter = 'all' | Appointment['status'];

export function ManagerBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Appointment[]>(mockAppointments);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [search, setSearch] = useState('');
  const [checkoutTick, setCheckoutTick] = useState(0);

  useEffect(() => subscribeCheckoutUpdates(() => setCheckoutTick((value) => value + 1)), []);

  const filtered = bookings.filter((booking) => {
    if (filter !== 'all' && booking.status !== filter) return false;

    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      booking.userName.toLowerCase().includes(keyword) ||
      booking.petName.toLowerCase().includes(keyword) ||
      booking.serviceName.toLowerCase().includes(keyword) ||
      booking.userPhone.includes(keyword)
    );
  });

  const updateStatus = (id: string, status: Appointment['status']) => {
    setBookings((previous) => previous.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
  };

  const openCheckout = (appointmentId: string) => {
    navigate(`/manager/pos?appointmentId=${appointmentId}`);
  };

  const viewInvoice = (invoiceId: string) => {
    navigate(`/manager/invoice/${invoiceId}`);
  };

  const statusFilters: Array<{ key: BookingFilter; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: bookings.length },
    { key: 'pending', label: 'Chờ duyệt', count: bookings.filter((booking) => booking.status === 'pending').length },
    { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter((booking) => booking.status === 'confirmed').length },
    { key: 'completed', label: 'Hoàn thành', count: bookings.filter((booking) => booking.status === 'completed').length },
    { key: 'cancelled', label: 'Đã hủy', count: bookings.filter((booking) => booking.status === 'cancelled').length },
  ];

  // Re-read checkout state every render tick to reflect updates from POS/invoice flow.
  const checkoutStateOf = (appointmentId: string) => {
    void checkoutTick;
    return getAppointmentCheckoutState(appointmentId);
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
                const checkoutState = checkoutStateOf(booking.id);
                const paidLabel = checkoutState.paid ? 'Đã thanh toán' : 'Chưa thanh toán';

                return (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className='border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]'
                  >
                    <td className='py-3 px-3' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {booking.time}
                    </td>
                    <td className='py-3 px-3 text-[#7a756e]'>{booking.date}</td>
                    <td className='py-3 px-3'>{booking.userName}</td>
                    <td className='py-3 px-3 text-[#7a756e]'>{booking.userPhone}</td>
                    <td className='py-3 px-3'>{booking.petName}</td>
                    <td className='py-3 px-3'>{booking.serviceName}</td>
                    <td className='py-3 px-3'>
                      <span className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${
                          checkoutState.paid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-[#f5f0eb] text-[#7a756e] border-[#2d2a26]/15'
                        }`}
                      >
                        {paidLabel}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='flex flex-wrap gap-1.5'>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#6b8f5e]/30 bg-[#6b8f5e]/10 text-[#6b8f5e] hover:bg-[#6b8f5e]/20 transition-colors'
                            >
                              Xác nhận
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              className='px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors'
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'completed')}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26]/20 bg-white text-[#2d2a26] hover:bg-[#f0ede8] transition-colors'
                            >
                              Hoàn tất khám
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              className='px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors'
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {booking.status === 'completed' && !checkoutState.paid && (
                          <button
                            onClick={() => openCheckout(booking.id)}
                            className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all'
                            style={{ fontWeight: 600 }}
                          >
                            Chuyển sang POS
                          </button>
                        )}

                        {booking.status === 'completed' && checkoutState.paid && checkoutState.invoiceId && (
                          <button
                            onClick={() => viewInvoice(checkoutState.invoiceId!)}
                            className='px-2.5 py-1 rounded-lg text-xs border border-[#2d2a26]/20 bg-white text-[#2d2a26] hover:bg-[#f0ede8] transition-colors'
                          >
                            Xem hóa đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className='text-center py-12 text-[#7a756e]'>
            <CalendarDays className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Không có lịch hẹn phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}

