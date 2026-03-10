import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays, Search, ChevronDown, Check, X as XIcon,
  Clock, Phone, PawPrint, DollarSign, Plus, Minus
} from 'lucide-react';
import {
  mockAppointments, mockProducts, formatCurrency,
  getStatusColor, getStatusLabel, type Appointment
} from './data';

export function ManagerBookingsPage() {
  const [bookings, setBookings] = useState<Appointment[]>(mockAppointments);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; qty: number }[]>([]);

  const filtered = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.userName.toLowerCase().includes(search.toLowerCase()) && !b.petName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = (id: string, status: Appointment['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleConfirm = (id: string) => updateStatus(id, 'confirmed');
  const handleCancel = (id: string) => updateStatus(id, 'cancelled');
  const handleOpenPayment = (id: string) => {
    setPaymentModal(id);
    setSelectedProducts([]);
  };

  const handleCompletePayment = () => {
    if (paymentModal) {
      updateStatus(paymentModal, 'completed');
      setPaymentModal(null);
      setSelectedProducts([]);
    }
  };

  const addProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === productId);
      if (existing) return prev.map(p => p.id === productId ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { id: productId, qty: 1 }];
    });
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === productId);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter(p => p.id !== productId);
      return prev.map(p => p.id === productId ? { ...p, qty: p.qty - 1 } : p);
    });
  };

  const paymentBooking = bookings.find(b => b.id === paymentModal);
  const productTotal = selectedProducts.reduce((sum, sp) => {
    const prod = mockProducts.find(p => p.id === sp.id);
    return sum + (prod ? prod.price * sp.qty : 0);
  }, 0);
  const grandTotal = (paymentBooking?.servicePrice || 0) + productTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Quản lý lịch hẹn
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 border border-[#2d2a26] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6b8f5e] w-64"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả', count: bookings.length },
          { key: 'pending', label: 'Chờ duyệt', count: bookings.filter(b => b.status === 'pending').length },
          { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'confirmed').length },
          { key: 'completed', label: 'Hoàn thành', count: bookings.filter(b => b.status === 'completed').length },
          { key: 'cancelled', label: 'Đã hủy', count: bookings.filter(b => b.status === 'cancelled').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm border transition-all hover:-translate-y-0.5 ${
              filter === f.key ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]' : 'bg-white text-[#2d2a26] border-[#2d2a26]/30'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d2a26]">
                {['Giờ', 'Ngày', 'Khách hàng', 'SĐT', 'Thú cưng', 'Dịch vụ', 'Giá', 'Trạng thái', 'Hành động'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs text-[#7a756e]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]"
                >
                  <td className="py-3 px-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{b.time}</td>
                  <td className="py-3 px-3 text-[#7a756e]">{b.date}</td>
                  <td className="py-3 px-3">{b.userName}</td>
                  <td className="py-3 px-3 text-[#7a756e]">{b.userPhone}</td>
                  <td className="py-3 px-3">{b.petName}</td>
                  <td className="py-3 px-3">{b.serviceName}</td>
                  <td className="py-3 px-3 text-[#6b8f5e]" style={{ fontWeight: 600 }}>{formatCurrency(b.servicePrice)}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(b.status)}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => handleConfirm(b.id)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Xác nhận">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleCancel(b.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Hủy">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => handleOpenPayment(b.id)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 text-xs" title="Thanh toán">
                          <DollarSign className="w-4 h-4" /> Thanh toán
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#7a756e]">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không có lịch hẹn nào</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && paymentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setPaymentModal(null)}>
          <div className="bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#2d2a26]/20">
              <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                Xác nhận thanh toán
              </h2>
              <button onClick={() => setPaymentModal(null)} className="p-1 hover:bg-[#f0ede8] rounded-lg">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Booking info */}
              <div className="p-4 bg-[#f0ede8] rounded-xl space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#7a756e]">Khách hàng:</span><span>{paymentBooking.userName}</span></div>
                <div className="flex justify-between"><span className="text-[#7a756e]">Thú cưng:</span><span>{paymentBooking.petName}</span></div>
                <div className="flex justify-between"><span className="text-[#7a756e]">Ngày giờ:</span><span>{paymentBooking.date} - {paymentBooking.time}</span></div>
              </div>

              {/* Service */}
              <div>
                <h4 className="text-sm mb-2" style={{ fontWeight: 600 }}>Dịch vụ đã sử dụng</h4>
                <div className="p-3 bg-white border border-[#2d2a26]/20 rounded-xl flex justify-between text-sm">
                  <span>{paymentBooking.serviceName}</span>
                  <span className="text-[#6b8f5e]" style={{ fontWeight: 600 }}>{formatCurrency(paymentBooking.servicePrice)}</span>
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="text-sm mb-2" style={{ fontWeight: 600 }}>Thêm sản phẩm</h4>
                <div className="space-y-2">
                  {mockProducts.map(p => {
                    const sp = selectedProducts.find(s => s.id === p.id);
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-white border border-[#2d2a26]/20 rounded-xl text-sm">
                        <div className="flex-1">
                          <p>{p.name}</p>
                          <p className="text-xs text-[#7a756e]">{formatCurrency(p.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeProduct(p.id)} className="w-7 h-7 rounded-lg border border-[#2d2a26]/30 flex items-center justify-center hover:bg-[#f0ede8]">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm" style={{ fontWeight: 600 }}>{sp?.qty || 0}</span>
                          <button onClick={() => addProduct(p.id)} className="w-7 h-7 rounded-lg border border-[#2d2a26]/30 flex items-center justify-center hover:bg-[#f0ede8]">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-[#6b8f5e]/10 rounded-xl border border-[#6b8f5e]/30">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Dịch vụ:</span><span>{formatCurrency(paymentBooking.servicePrice)}</span></div>
                  {selectedProducts.length > 0 && (
                    <div className="flex justify-between"><span>Sản phẩm:</span><span>{formatCurrency(productTotal)}</span></div>
                  )}
                  <hr className="border-[#6b8f5e]/20" />
                  <div className="flex justify-between text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                    <span>Tổng cộng:</span>
                    <span className="text-[#6b8f5e]">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompletePayment}
                className="w-full py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 active:translate-y-0 transition-all border border-[#2d2a26]"
              >
                Xác nhận đã thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}