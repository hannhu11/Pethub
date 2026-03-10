import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search, Plus, Minus, Trash2, Banknote, QrCode, CreditCard,
  Printer, Check, X, User, PawPrint, Receipt
} from 'lucide-react';
import { mockServices, mockProducts, mockPets, mockUsers, formatCurrency } from './data';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

type TabType = 'services' | 'pharmacy' | 'retail';

const catalogTabs: { id: TabType; label: string; emoji: string }[] = [
  { id: 'services', label: 'Dịch vụ', emoji: '🩺' },
  { id: 'pharmacy', label: 'Thuốc & Vitamin', emoji: '💊' },
  { id: 'retail', label: 'Thức ăn & Phụ kiện', emoji: '🦴' },
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
    { id: 'p3', name: 'Royal Canin 2kg', price: 350000, type: 'product' },
    { id: 'p4', name: 'Pate Whiskas hộp', price: 35000, type: 'product' },
    { id: 'p5', name: 'Vòng cổ chống ve', price: 180000, type: 'product' },
  ],
};

const TAX_RATE = 0.08;

export function ManagerPOSPage() {
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPet, setSelectedPet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [showSuccess, setShowSuccess] = useState(false);

  const allItems = Object.values(catalogItems).flat();
  const currentItems = searchQuery
    ? allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : catalogItems[activeTab];

  const addToCart = (item: typeof allItems[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, type: item.type }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        }
        return c;
      });
      return delta < 0 ? updated.filter(c => c.quantity > 0 || c.id !== id) : updated;
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  const handleComplete = () => {
    if (cart.length === 0) return;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setSelectedCustomer('');
      setSelectedPet('');
    }, 3000);
  };

  const customers = mockUsers.filter(u => u.role === 'customer');
  const customerPets = selectedCustomer ? mockPets.filter(p => p.ownerId === selectedCustomer) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Thanh toán POS
        </h1>
        <p className="text-sm text-[#7a756e]">Point of Sale — Tạo hóa đơn nhanh</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:items-start">
        {/* LEFT: Catalog (65%) */}
        <div className="lg:w-[65%] space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm dịch vụ, sản phẩm hoặc mã barcode..."
              className="w-full pl-12 pr-10 py-3.5 border border-[#2d2a26] rounded-2xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#7a756e]" />
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          {!searchQuery && (
            <div className="flex gap-2">
              {catalogTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all border ${
                    activeTab === tab.id
                      ? 'bg-[#2d2a26] text-white border-[#2d2a26]'
                      : 'bg-white text-[#2d2a26] border-[#2d2a26]/20 hover:bg-[#f0ede8]'
                  }`}
                  style={activeTab === tab.id ? { fontWeight: 600 } : {}}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Item Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentItems.map((item, i) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => addToCart(item)}
                  className={`relative bg-white border rounded-2xl p-4 text-left transition-all cursor-pointer group ${
                    inCart ? 'border-[#6b8f5e] border-2' : 'border-[#2d2a26] hover:-translate-y-0.5'
                  }`}
                >
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#6b8f5e] text-white rounded-full flex items-center justify-center text-[10px]" style={{ fontWeight: 700 }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <p className="text-sm text-[#2d2a26] mb-2" style={{ fontWeight: 600 }}>
                    {item.name}
                  </p>
                  <p className="text-lg text-[#6b8f5e]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                    {formatCurrency(item.price)}
                  </p>
                  <div className="mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      item.type === 'service'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`} style={{ fontWeight: 500 }}>
                      {item.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Invoice/Ticket (35%) */}
        <div className="lg:w-[35%]">
          <div className="bg-white border-2 border-[#2d2a26] rounded-2xl sticky top-20 overflow-hidden">
            {/* Ticket Header */}
            <div className="bg-[#2d2a26] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h2 className="text-sm" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>HOÁ ĐƠN</h2>
              </div>
              {totalItems > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{totalItems} mục</span>
              )}
            </div>

            {/* Customer/Pet Select */}
            <div className="p-4 border-b border-[#2d2a26]/10 space-y-2.5">
              <div>
                <label className="text-[10px] text-[#7a756e] mb-1 flex items-center gap-1 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  <User className="w-3 h-3" /> Khách hàng
                </label>
                <select
                  value={selectedCustomer}
                  onChange={e => { setSelectedCustomer(e.target.value); setSelectedPet(''); }}
                  className="w-full p-2.5 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none"
                >
                  <option value="">Chọn khách hàng...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>
              {selectedCustomer && customerPets.length > 0 && (
                <div>
                  <label className="text-[10px] text-[#7a756e] mb-1 flex items-center gap-1 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                    <PawPrint className="w-3 h-3" /> Thú cưng
                  </label>
                  <select
                    value={selectedPet}
                    onChange={e => setSelectedPet(e.target.value)}
                    className="w-full p-2.5 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none"
                  >
                    <option value="">Chọn thú cưng...</option>
                    {customerPets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="max-h-[280px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-[#7a756e]">
                  <div className="w-16 h-16 rounded-full bg-[#f0ede8] flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-7 h-7 text-[#7a756e]/40" />
                  </div>
                  <p className="text-sm" style={{ fontWeight: 500 }}>Chưa có mục nào</p>
                  <p className="text-xs text-[#a09b94] mt-1">Chọn dịch vụ/sản phẩm từ danh mục</p>
                </div>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-center gap-3 ${
                        idx < cart.length - 1 ? 'border-b border-[#2d2a26]/8' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ fontWeight: 500 }}>{item.name}</p>
                        <p className="text-xs text-[#7a756e]">{formatCurrency(item.price)} / đơn vị</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg border border-[#2d2a26] flex items-center justify-center hover:bg-[#f0ede8] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-9 text-center text-sm" style={{ fontWeight: 700 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg border border-[#2d2a26] flex items-center justify-center hover:bg-[#f0ede8] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm w-24 text-right" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals + Payment */}
            {cart.length > 0 && (
              <>
                {/* Totals */}
                <div className="border-t-2 border-[#2d2a26] border-dashed">
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#7a756e]">Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#7a756e]">VAT (8%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  </div>
                  <div className="mx-4 border-t border-[#2d2a26] py-4">
                    <div className="flex items-end justify-between">
                      <span className="text-[10px] text-[#7a756e] uppercase tracking-wider" style={{ fontWeight: 600 }}>Tổng cộng</span>
                      <span className="text-3xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-[#7a756e] mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>Thanh toán</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Tiền mặt', icon: Banknote },
                      { id: 'transfer', label: 'QR Bank', icon: QrCode },
                      { id: 'card', label: 'Thẻ', icon: CreditCard },
                    ].map(method => (
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
                        <method.icon className="w-5 h-5" />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="p-4 pt-1">
                  <button
                    onClick={handleComplete}
                    disabled={showSuccess}
                    className={`w-full py-4 rounded-xl text-sm border-2 border-[#2d2a26] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      showSuccess
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[#6b8f5e] text-white hover:-translate-y-1 active:translate-y-0'
                    }`}
                    style={{ fontWeight: 700, letterSpacing: '0.03em' }}
                  >
                    {showSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        THANH TOÁN THÀNH CÔNG
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        HOÀN TẤT & IN HOÁ ĐƠN
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
