import { Outlet, Link, useLocation } from 'react-router';
import { useState } from 'react';
import {
  PawPrint, LayoutDashboard, CalendarDays, Package,
  Users, Menu, X, ChevronLeft, Bell,
  Settings, ShoppingCart, Search, Zap
} from 'lucide-react';

type SidebarItem = {
  type: 'link';
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
} | {
  type: 'separator';
  label: string;
};

const sidebarItems: SidebarItem[] = [
  { type: 'link', to: '/manager', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { type: 'link', to: '/manager/pos', label: 'Thanh toán POS', icon: ShoppingCart },
  { type: 'link', to: '/manager/bookings', label: 'Lịch hẹn', icon: CalendarDays },
  { type: 'separator', label: 'CRM' },
  { type: 'link', to: '/manager/customers', label: 'Khách hàng', icon: Users },
  { type: 'link', to: '/manager/pets', label: 'Thú cưng', icon: PawPrint },
  { type: 'separator', label: 'Kho & Vận hành' },
  { type: 'link', to: '/manager/catalog', label: 'Sản phẩm & Dịch vụ', icon: Package },
  { type: 'separator', label: 'Tự động hóa' },
  { type: 'link', to: '/manager/reminders', label: 'Nhắc nhở', icon: Zap },
];

const mockNotifications = [
  { id: 1, text: 'Lịch hẹn mới từ Nguyễn Văn An - Lucky', time: '5 phút trước', read: false },
  { id: 2, text: 'Nhắc nhở: Tiêm phòng cho Mimi hôm nay', time: '30 phút trước', read: false },
  { id: 3, text: 'Thanh toán #T001 đã hoàn tất - 385,000đ', time: '1 giờ trước', read: true },
  { id: 4, text: 'Khách hàng Trần Thị Bình đánh giá 5 sao', time: '2 giờ trước', read: true },
];

function SidebarNav({ items, isActive, onClickLink }: {
  items: SidebarItem[];
  isActive: (to: string, exact?: boolean) => boolean;
  onClickLink?: () => void;
}) {
  return (
    <>
      {items.map((item, idx) => {
        if (item.type === 'separator') {
          return (
            <div key={`sep-${idx}`} className="pt-4 pb-1 px-4">
              <p className="text-[9px] text-[#7a756e]/70 uppercase tracking-[0.15em]" style={{ fontWeight: 600 }}>
                {item.label}
              </p>
              <div className="border-b border-[#2d2a26]/8 mt-1.5" />
            </div>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClickLink}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive(item.to, item.exact)
                ? 'bg-[#6b8f5e] text-white'
                : 'text-[#2d2a26] hover:bg-[#e8e4de]'
            }`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen flex bg-[#faf9f6]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#f5f0eb] border-r border-[#2d2a26]">
        <div className="p-5 border-b border-[#2d2a26]">
          <Link to="/manager" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#6b8f5e] flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Pet<span className="text-[#c67d5b]">Hub</span>
              </span>
              <p className="text-[10px] text-[#7a756e] -mt-1">Quản trị viên</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <SidebarNav items={sidebarItems} isActive={isActive} />
        </nav>

        <div className="px-3 pb-2">
          <Link
            to="/manager/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive('/manager/settings')
                ? 'bg-[#6b8f5e] text-white'
                : 'text-[#2d2a26] hover:bg-[#e8e4de]'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            Cài đặt
          </Link>
        </div>

        <div className="p-3 border-t border-[#2d2a26]/15">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#7a756e] hover:bg-[#e8e4de] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Về trang khách hàng
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 h-full bg-[#f5f0eb] border-r border-[#2d2a26] overflow-y-auto">
            <div className="p-5 flex items-center justify-between border-b border-[#2d2a26]">
              <span className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Pet<span className="text-[#c67d5b]">Hub</span>
              </span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="py-3 px-3 space-y-0.5">
              <SidebarNav items={sidebarItems} isActive={isActive} onClickLink={() => setSidebarOpen(false)} />
              <div className="pt-2">
                <Link
                  to="/manager/settings"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    isActive('/manager/settings') ? 'bg-[#6b8f5e] text-white' : 'text-[#2d2a26] hover:bg-[#e8e4de]'
                  }`}
                >
                  <Settings className="w-[18px] h-[18px]" />
                  Cài đặt
                </Link>
              </div>
            </nav>
            <div className="p-3 border-t border-[#2d2a26]/15">
              <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm text-[#7a756e]" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft className="w-4 h-4" /> Về trang khách hàng
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-[#2d2a26] bg-white flex items-center px-4 gap-3 sticky top-0 z-40">
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#faf9f6] border border-[#2d2a26]/15">
            <Search className="w-4 h-4 text-[#7a756e]" />
            <input
              placeholder="Tìm kiếm nhanh..."
              className="bg-transparent text-sm flex-1 outline-none placeholder-[#a09b94]"
            />
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl border border-[#2d2a26]/20 hover:bg-[#f0ede8] transition-all"
            >
              <Bell className="w-5 h-5 text-[#2d2a26]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e04444] text-white text-[9px] rounded-full flex items-center justify-center" style={{ fontWeight: 700, minWidth: '18px', height: '18px' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 w-80 bg-white border border-[#2d2a26] rounded-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-[#2d2a26]/10 flex items-center justify-between">
                    <h3 className="text-sm" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      Thông báo
                    </h3>
                    <span className="text-[10px] text-[#6b8f5e] px-2 py-0.5 rounded-full bg-[#6b8f5e]/10" style={{ fontWeight: 600 }}>
                      {unreadCount} mới
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {mockNotifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-[#2d2a26]/5 hover:bg-[#faf9f6] transition-colors cursor-pointer ${
                          !n.read ? 'bg-[#6b8f5e]/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <div className="w-2 h-2 rounded-full bg-[#6b8f5e] mt-1.5 flex-shrink-0" />}
                          <div className={!n.read ? '' : 'pl-4'}>
                            <p className="text-xs text-[#2d2a26]" style={!n.read ? { fontWeight: 500 } : {}}>
                              {n.text}
                            </p>
                            <p className="text-[10px] text-[#7a756e] mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-[#2d2a26]/10">
                    <button className="w-full py-2 text-xs text-[#6b8f5e] hover:bg-[#6b8f5e]/5 rounded-xl transition-colors" style={{ fontWeight: 500 }}>
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Admin Profile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#c67d5b] flex items-center justify-center border border-[#2d2a26]/20">
              <span className="text-white text-xs" style={{ fontWeight: 600 }}>PH</span>
            </div>
            <span className="text-sm hidden sm:block" style={{ fontWeight: 500 }}>Phạm Hương</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
