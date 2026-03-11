import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Search, Plus, Minus, Trash2, Banknote, QrCode, CreditCard, Printer, User, PawPrint, Receipt } from 'lucide-react';
import { formatCurrency, mockAppointments, mockPets, mockUsers } from './data';
import { createInvoiceId, getAppointmentCheckoutState, saveInvoice, markAppointmentPaid } from './manager-checkout-store';
import type { InvoiceLineItem, InvoiceRecord } from '../types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

type TabType = 'services' | 'pharmacy' | 'retail';
type PaymentMethod = 'cash' | 'transfer' | 'card';

const catalogTabs: { id: TabType; label: string }[] = [
  { id: 'services', label: 'Dịch vụ' },
  { id: 'pharmacy', label: 'Thuốc & Vitamin' },
  { id: 'retail', label: 'Thức ăn & Phụ kiện' },
];

const catalogItems: Record<TabType, { id: string; name: string; price: number; type: 'service' | 'product' }[]> = {
  services: [
    { id: 's1', name: 'Khám tổng quát', price: 200000, type: 'service' },
    { id: 's2', name: 'Tắm & Spa', price: 150000, type: 'service' },
    { id: 's3', name: 'Cắt tỉa lông', price: 250000, type: 'service' },
    { id: 's4', name: 'Tiêm phòng', price: 300000, type: 'service' },
    { id: 's5', name: 'Khám chuyên khoa', price: 500000, type: 'service' },
    { id: 's6', name: 'Lưu chuồng (1 ngày)', price: 180000, type: 'service' },
  ],
  pharmacy: [
    { id: 'p1', name: 'Thuốc tẩy giun Drontal', price: 85000, type: 'product' },
    { id: 'p2', name: 'Kháng sinh Amoxicillin', price: 120000, type: 'product' },
    { id: 'p6', name: 'Dầu cá Omega-3', price: 250000, type: 'product' },
  ],
  retail: [
    { id: 'p3', name: 'Hạt Royal Canin 2kg', price: 350000, type: 'product' },
    { id: 'p4', name: 'Pate Whiskas hộp', price: 35000, type: 'product' },
    { id: 'p5', name: 'Vòng cổ chống ve', price: 180000, type: 'product' },
  ],
};

const TAX_RATE = 0.08;

function currentTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function ManagerPOSPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPet, setSelectedPet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [prefilledAppointmentId, setPrefilledAppointmentId] = useState<string | null>(null);

  const appointmentId = searchParams.get('appointmentId');
  const sourceAppointment = useMemo(
    () => (appointmentId ? mockAppointments.find((appointment) => appointment.id === appointmentId) : undefined),
    [appointmentId],
  );
  const checkoutState = sourceAppointment ? getAppointmentCheckoutState(sourceAppointment.id) : null;

  const allItems = Object.values(catalogItems).flat();
  const currentItems = searchQuery
    ? allItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : catalogItems[activeTab];

  const addToCart = (item: (typeof allItems)[number]) => {
    setCart((previous) => {
      const existing = previous.find((entry) => entry.id === item.id);
      if (existing) {
        return previous.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      }

      return [...previous, { id: item.id, name: item.name, price: item.price, quantity: 1, type: item.type }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((previous) => {
      if (delta < 0) {
        return previous
          .map((entry) => (entry.id === id ? { ...entry, quantity: Math.max(0, entry.quantity + delta) } : entry))
          .filter((entry) => entry.quantity > 0);
      }

      return previous.map((entry) => (entry.id === id ? { ...entry, quantity: entry.quantity + delta } : entry));
    });
  };

  const removeFromCart = (id: string) => {
    setCart((previous) => previous.filter((entry) => entry.id !== id));
  };

  useEffect(() => {
    if (!sourceAppointment || prefilledAppointmentId === sourceAppointment.id) return;

    setSelectedCustomer(sourceAppointment.userId);
    setSelectedPet(sourceAppointment.petId);
    setCart((previous) => {
      const hasService = previous.some((item) => item.id === sourceAppointment.serviceId);
      if (hasService) {
        return previous;
      }

      return [
        ...previous,
        {
          id: sourceAppointment.serviceId,
          name: sourceAppointment.serviceName,
          price: sourceAppointment.servicePrice,
          quantity: 1,
          type: 'service',
        },
      ];
    });
    setPrefilledAppointmentId(sourceAppointment.id);
  }, [prefilledAppointmentId, sourceAppointment]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const customers = mockUsers.filter((user) => user.role === 'customer');
  const customerPets = selectedCustomer ? mockPets.filter((pet) => pet.ownerId === selectedCustomer) : [];

  const openExistingInvoice = () => {
    if (checkoutState?.invoiceId) {
      navigate(`/manager/invoice/${checkoutState.invoiceId}`);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !selectedCustomer) return;

    const normalizedItems: InvoiceLineItem[] = cart.map((item) => ({
      name: item.name,
      type: item.type,
      qty: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    }));

    const invoice: InvoiceRecord = {
      id: createInvoiceId(),
      appointmentId: sourceAppointment?.id,
      customerId: selectedCustomer,
      petId: selectedPet || sourceAppointment?.petId,
      items: normalizedItems,
      subtotal,
      tax,
      grandTotal: total,
      paymentMethod,
      createdAt: currentTimestamp(),
    };

    saveInvoice(invoice);
    if (sourceAppointment?.id) {
      markAppointmentPaid(sourceAppointment.id, invoice.id);
    }

    navigate(`/manager/invoice/${invoice.id}`);
  };

  return (
    <div className='space-y-4'>
      <div>
        <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Thanh toán POS
        </h1>
        <p className='text-sm text-[#7a756e]'>Điểm thanh toán duy nhất cho dịch vụ và sản phẩm.</p>
      </div>

      {sourceAppointment ? (
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2'>
          <div>
            <p className='text-xs text-[#7a756e]'>Phiên từ lịch hẹn</p>
            <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>
              {sourceAppointment.userName} • {sourceAppointment.petName} • {sourceAppointment.serviceName}
            </p>
          </div>
          {checkoutState?.paid ? (
            <button
              type='button'
              onClick={openExistingInvoice}
              className='px-3 py-2 rounded-xl border border-[#2d2a26]/20 bg-[#f0ede8] text-[#2d2a26] text-xs'
              style={{ fontWeight: 600 }}
            >
              Đã thanh toán - Xem hóa đơn
            </button>
          ) : (
            <span className='px-3 py-2 rounded-xl border border-[#6b8f5e]/30 bg-[#6b8f5e]/10 text-[#6b8f5e] text-xs' style={{ fontWeight: 600 }}>
              Chờ hoàn tất thanh toán
            </span>
          )}
        </div>
      ) : null}

      <div className='flex flex-col lg:flex-row gap-5 lg:items-start'>
        <div className='lg:w-[65%] space-y-4'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder='Tìm dịch vụ, sản phẩm hoặc mã barcode...'
              className='w-full pl-12 pr-10 py-3.5 border border-[#2d2a26] rounded-2xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]'
            />
          </div>

          {!searchQuery && (
            <div className='flex gap-2 flex-wrap'>
              {catalogTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all border ${
                    activeTab === tab.id
                      ? 'bg-[#2d2a26] text-white border-[#2d2a26]'
                      : 'bg-white text-[#2d2a26] border-[#2d2a26]/20 hover:bg-[#f0ede8]'
                  }`}
                  style={activeTab === tab.id ? { fontWeight: 600 } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {currentItems.map((item, index) => {
              const inCart = cart.find((entry) => entry.id === item.id);
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => addToCart(item)}
                  className={`relative bg-white border rounded-2xl p-4 text-left transition-all cursor-pointer ${
                    inCart ? 'border-[#6b8f5e] border-2' : 'border-[#2d2a26] hover:-translate-y-0.5'
                  }`}
                >
                  {inCart ? (
                    <div className='absolute -top-2 -right-2 w-6 h-6 bg-[#6b8f5e] text-white rounded-full flex items-center justify-center text-[10px]' style={{ fontWeight: 700 }}>
                      {inCart.quantity}
                    </div>
                  ) : null}
                  <p className='text-sm text-[#2d2a26] mb-2' style={{ fontWeight: 600 }}>
                    {item.name}
                  </p>
                  <p className='text-lg text-[#6b8f5e]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                    {formatCurrency(item.price)}
                  </p>
                  <span className='mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full border border-[#2d2a26]/20 text-[#7a756e]'>
                    {item.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className='lg:w-[35%]'>
          <div className='bg-white border-2 border-[#2d2a26] rounded-2xl sticky top-20 overflow-hidden'>
            <div className='bg-[#2d2a26] text-white p-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Receipt className='w-5 h-5' />
                <h2 className='text-sm' style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  HÓA ĐƠN
                </h2>
              </div>
              {totalItems > 0 ? <span className='text-xs bg-white/20 px-2 py-0.5 rounded-full'>{totalItems} mục</span> : null}
            </div>

            <div className='p-4 border-b border-[#2d2a26]/10 space-y-2.5'>
              <div>
                <label className='text-[10px] text-[#7a756e] mb-1 flex items-center gap-1 uppercase tracking-wider' style={{ fontWeight: 600 }}>
                  <User className='w-3 h-3' />
                  Khách hàng
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(event) => {
                    setSelectedCustomer(event.target.value);
                    setSelectedPet('');
                  }}
                  className='w-full p-2.5 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none'
                >
                  <option value=''>Chọn khách hàng...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && customerPets.length > 0 ? (
                <div>
                  <label className='text-[10px] text-[#7a756e] mb-1 flex items-center gap-1 uppercase tracking-wider' style={{ fontWeight: 600 }}>
                    <PawPrint className='w-3 h-3' />
                    Thú cưng
                  </label>
                  <select
                    value={selectedPet}
                    onChange={(event) => setSelectedPet(event.target.value)}
                    className='w-full p-2.5 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none'
                  >
                    <option value=''>Chọn thú cưng...</option>
                    {customerPets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.breed})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div className='max-h-[280px] overflow-y-auto'>
              {cart.length === 0 ? (
                <div className='py-12 text-center text-[#7a756e]'>
                  <div className='w-16 h-16 rounded-full bg-[#f0ede8] flex items-center justify-center mx-auto mb-3'>
                    <Receipt className='w-7 h-7 text-[#7a756e]/40' />
                  </div>
                  <p className='text-sm' style={{ fontWeight: 500 }}>
                    Chưa có mục nào
                  </p>
                </div>
              ) : (
                <div>
                  {cart.map((item, index) => (
                    <div key={item.id} className={`p-3.5 flex items-center gap-3 ${index < cart.length - 1 ? 'border-b border-[#2d2a26]/8' : ''}`}>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm truncate' style={{ fontWeight: 500 }}>
                          {item.name}
                        </p>
                        <p className='text-xs text-[#7a756e]'>{formatCurrency(item.price)} / đơn vị</p>
                      </div>
                      <div className='flex items-center'>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className='w-8 h-8 rounded-lg border border-[#2d2a26] flex items-center justify-center hover:bg-[#f0ede8] transition-colors'
                        >
                          <Minus className='w-3 h-3' />
                        </button>
                        <span className='w-9 text-center text-sm' style={{ fontWeight: 700 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className='w-8 h-8 rounded-lg border border-[#2d2a26] flex items-center justify-center hover:bg-[#f0ede8] transition-colors'
                        >
                          <Plus className='w-3 h-3' />
                        </button>
                      </div>
                      <p className='text-sm w-24 text-right' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button onClick={() => removeFromCart(item.id)} className='p-1.5 hover:bg-red-50 rounded-lg transition-colors'>
                        <Trash2 className='w-3.5 h-3.5 text-red-400' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 ? (
              <>
                <div className='border-t-2 border-[#2d2a26] border-dashed'>
                  <div className='p-4 space-y-1.5'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-[#7a756e]'>Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-[#7a756e]'>VAT (8%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  </div>
                  <div className='mx-4 border-t border-[#2d2a26] py-4'>
                    <div className='flex items-end justify-between'>
                      <span className='text-[10px] text-[#7a756e] uppercase tracking-wider' style={{ fontWeight: 600 }}>
                        Tổng cộng
                      </span>
                      <span className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='px-4 pb-3'>
                  <p className='text-[10px] text-[#7a756e] mb-2 uppercase tracking-wider' style={{ fontWeight: 600 }}>
                    Thanh toán
                  </p>
                  <div className='grid grid-cols-3 gap-2'>
                    {[
                      { id: 'cash' as const, label: 'Tiền mặt', icon: Banknote },
                      { id: 'transfer' as const, label: 'QR Bank', icon: QrCode },
                      { id: 'card' as const, label: 'Thẻ', icon: CreditCard },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs transition-all ${
                          paymentMethod === method.id
                            ? 'border-[#2d2a26] bg-[#2d2a26] text-white'
                            : 'border-[#2d2a26]/20 text-[#7a756e] hover:border-[#2d2a26]/40'
                        }`}
                        style={paymentMethod === method.id ? { fontWeight: 600 } : {}}
                      >
                        <method.icon className='w-5 h-5' />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='p-4 pt-1'>
                  <button
                    onClick={handleCheckout}
                    className='w-full py-4 rounded-xl text-sm border-2 border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer'
                    style={{ fontWeight: 700, letterSpacing: '0.03em' }}
                  >
                    <Printer className='w-5 h-5' />
                    HOÀN TẤT & IN HÓA ĐƠN
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
