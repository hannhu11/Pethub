import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  PawPrint,
  LayoutDashboard,
  CalendarDays,
  Package,
  Users,
  Menu,
  X,
  Bell,
  Settings,
  ShoppingCart,
  Search,
  Zap,
  UserCircle2,
  LogOut,
  Building2,
  Stethoscope,
  Inbox,
} from 'lucide-react';
import { useAuthSession } from '../auth-session';
import { mockAppointments, mockPets, mockUsers } from './data';
import { getClinicSettings, getProfileSettings, subscribeManagerSettingsUpdates } from './manager-settings-store';
import {
  getNotifications,
  markNotificationAsRead,
  subscribeNotificationUpdates,
} from './manager-notifications-store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type SidebarItem =
  | {
      type: 'link';
      to: string;
      label: string;
      icon: typeof LayoutDashboard;
      exact?: boolean;
    }
  | {
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


function SidebarNav({
  items,
  isActive,
  onClickLink,
}: {
  items: SidebarItem[];
  isActive: (to: string, exact?: boolean) => boolean;
  onClickLink?: () => void;
}) {
  return (
    <>
      {items.map((item, idx) => {
        if (item.type === 'separator') {
          return (
            <div key={`sep-${idx}`} className='pt-4 pb-1 px-4'>
              <p className='text-[9px] text-[#7a756e]/70 uppercase tracking-[0.15em]' style={{ fontWeight: 600 }}>
                {item.label}
              </p>
              <div className='border-b border-[#2d2a26]/8 mt-1.5' />
            </div>
          );
        }

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClickLink}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive(item.to, item.exact) ? 'bg-[#6b8f5e] text-white' : 'text-[#2d2a26] hover:bg-[#e8e4de]'
            }`}
          >
            <item.icon className='w-[18px] h-[18px]' />
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
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifications, setNotifications] = useState(getNotifications());
  const [managerProfile, setManagerProfile] = useState(getProfileSettings());
  const [clinic, setClinic] = useState(getClinicSettings());
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthSession();

  const unreadCount = notifications.filter((item) => !item.read).length;

  const quickSearchData = useMemo(
    () => ({
      pets: mockPets.slice(0, 6),
      customers: mockUsers.filter((u) => u.role === 'customer').slice(0, 6),
      appointments: mockAppointments.slice(0, 6),
    }),
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isHotKey = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (!isHotKey) {
        return;
      }
      event.preventDefault();
      setCommandOpen((open) => !open);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    return subscribeNotificationUpdates(() => {
      setNotifications(getNotifications());
    });
  }, []);

  useEffect(() => {
    return subscribeManagerSettingsUpdates(() => {
      setManagerProfile(getProfileSettings());
      setClinic(getClinicSettings());
    });
  }, []);

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const goToProfileSettings = () => {
    navigate('/manager/settings?tab=profile');
  };

  const doLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleCommandNavigate = (to: string) => {
    setCommandOpen(false);
    navigate(to);
  };

  const handleNotificationClick = (id: number, to: string) => {
    markNotificationAsRead(id);
    setNotifOpen(false);
    navigate(to);
  };

  return (
    <div className='min-h-screen flex bg-[#faf9f6]'>
      <aside className='hidden lg:flex flex-col w-64 bg-[#f5f0eb] border-r border-[#2d2a26]'>
        <div className='p-5 border-b border-[#2d2a26]'>
          <Link to='/manager' className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-xl bg-[#6b8f5e] flex items-center justify-center'>
              <PawPrint className='w-5 h-5 text-white' />
            </div>
            <div>
              <span className='text-lg' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Pet<span className='text-[#c67d5b]'>Hub</span>
              </span>
              <p className='text-[10px] text-[#7a756e] -mt-1'>Quản trị viên</p>
            </div>
          </Link>
        </div>

        <nav className='flex-1 py-3 px-3 space-y-0.5 overflow-y-auto'>
          <SidebarNav items={sidebarItems} isActive={isActive} />
        </nav>

        <div className='px-3 pb-2'>
          <Link
            to='/manager/settings'
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive('/manager/settings') ? 'bg-[#6b8f5e] text-white' : 'text-[#2d2a26] hover:bg-[#e8e4de]'
            }`}
          >
            <Settings className='w-[18px] h-[18px]' />
            Cài đặt
          </Link>
        </div>

        <div className='p-3 border-t border-[#2d2a26]/15 space-y-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#2d2a26]/20 bg-white hover:-translate-y-0.5 transition-all text-left'>
                <div className='w-8 h-8 rounded-full bg-[#c67d5b] flex items-center justify-center border border-[#2d2a26]/20'>
                  <span className='text-white text-xs' style={{ fontWeight: 600 }}>PH</span>
                </div>
                <div className='min-w-0'>
                  <p className='text-sm truncate' style={{ fontWeight: 600 }}>{managerProfile.name}</p>
                  <p className='text-xs text-[#7a756e] truncate'>{clinic.name}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='border-[#2d2a26] w-56'>
              <DropdownMenuLabel>Tài khoản quản lý</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={goToProfileSettings}>
                <UserCircle2 className='w-4 h-4' />
                Hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/manager/settings?tab=clinic')}>
                <Building2 className='w-4 h-4' />
                Thông tin phòng khám
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive' onClick={doLogout}>
                <LogOut className='w-4 h-4' />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type='button'
            onClick={doLogout}
            className='w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all'
          >
            <LogOut className='w-4 h-4' />
            Đăng xuất
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          <div className='absolute inset-0 bg-black/30' onClick={() => setSidebarOpen(false)} />
          <aside className='relative w-64 h-full bg-[#f5f0eb] border-r border-[#2d2a26] overflow-y-auto'>
            <div className='p-5 flex items-center justify-between border-b border-[#2d2a26]'>
              <span className='text-lg' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Pet<span className='text-[#c67d5b]'>Hub</span>
              </span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className='w-5 h-5' />
              </button>
            </div>

            <nav className='py-3 px-3 space-y-0.5'>
              <SidebarNav items={sidebarItems} isActive={isActive} onClickLink={() => setSidebarOpen(false)} />
              <div className='pt-2'>
                <Link
                  to='/manager/settings'
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    isActive('/manager/settings') ? 'bg-[#6b8f5e] text-white' : 'text-[#2d2a26] hover:bg-[#e8e4de]'
                  }`}
                >
                  <Settings className='w-[18px] h-[18px]' />
                  Cài đặt
                </Link>
              </div>
            </nav>

            <div className='p-3 border-t border-[#2d2a26]/15 space-y-2'>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  goToProfileSettings();
                }}
                className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#2d2a26]/20 bg-white text-left'
              >
                <div className='w-8 h-8 rounded-full bg-[#c67d5b] flex items-center justify-center border border-[#2d2a26]/20'>
                  <span className='text-white text-xs' style={{ fontWeight: 600 }}>PH</span>
                </div>
                <div>
                  <p className='text-sm' style={{ fontWeight: 600 }}>{managerProfile.name}</p>
                  <p className='text-xs text-[#7a756e]'>{clinic.name}</p>
                </div>
              </button>
              <button
                className='w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50'
                onClick={doLogout}
              >
                <LogOut className='w-4 h-4' /> Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className='flex-1 flex flex-col min-h-screen'>
        <header className='h-14 border-b border-[#2d2a26] bg-white flex items-center px-4 sticky top-0 z-40'>
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            <button className='lg:hidden p-1' onClick={() => setSidebarOpen(true)}>
              <Menu className='w-5 h-5' />
            </button>

            <button
              type='button'
              onClick={() => setCommandOpen(true)}
              className='hidden sm:flex w-full max-w-xl items-center gap-2 px-3 py-1.5 rounded-xl bg-[#faf9f6] border border-[#2d2a26]/15 hover:border-[#6b8f5e]/50 transition-colors text-left'
            >
              <Search className='w-4 h-4 text-[#7a756e]' />
              <span className='text-sm text-[#a09b94] flex-1'>Tìm kiếm nhanh...</span>
              <kbd className='text-[10px] text-[#7a756e] border border-[#2d2a26]/20 rounded px-1.5 py-0.5'>Ctrl K</kbd>
            </button>
          </div>

          <div className='ml-auto flex items-center gap-2'>
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className='relative p-1.5 rounded-xl border border-[#2d2a26]/20 hover:bg-[#f0ede8] transition-all'
                >
                  <Bell className='w-5 h-5 text-[#2d2a26]' />
                  {unreadCount > 0 && (
                    <span
                      className='absolute -top-1 -right-1 bg-[#e04444] text-white text-[9px] rounded-full flex items-center justify-center'
                      style={{ fontWeight: 700, minWidth: '18px', height: '18px' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
            <PopoverContent align='end' className='w-[22rem] p-0 border-[#2d2a26] bg-white'>
              <div className='p-3 border-b border-[#2d2a26]/10 flex items-center justify-between'>
                <h3 className='text-sm' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  Thông báo
                </h3>
                <span className='text-[10px] text-[#6b8f5e] px-2 py-0.5 rounded-full bg-[#6b8f5e]/10' style={{ fontWeight: 600 }}>
                  {unreadCount} mới
                </span>
              </div>
              <div className='max-h-72 overflow-y-auto'>
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => handleNotificationClick(item.id, item.to)}
                    className={`w-full text-left px-4 py-3 border-b border-[#2d2a26]/5 hover:bg-[#faf9f6] transition-colors ${
                      !item.read ? 'bg-[#6b8f5e]/5' : ''
                    }`}
                  >
                    <div className='flex items-start gap-2'>
                      {!item.read && <div className='w-2 h-2 rounded-full bg-[#6b8f5e] mt-1.5 flex-shrink-0' />}
                      <div className={!item.read ? '' : 'pl-4'}>
                        <p className='text-xs text-[#2d2a26]' style={!item.read ? { fontWeight: 500 } : {}}>
                          {item.title}
                        </p>
                        <p className='text-[10px] text-[#7a756e] mt-0.5'>{item.createdAt}</p>
                        <p className='text-[10px] text-[#9b948b] mt-0.5'>{item.body}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className='p-2 border-t border-[#2d2a26]/10'>
                <button
                  type='button'
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/manager/notifications');
                  }}
                  className='w-full py-2 text-xs text-[#6b8f5e] hover:bg-[#6b8f5e]/5 rounded-xl transition-colors'
                  style={{ fontWeight: 500 }}
                >
                  Xem tất cả thông báo
                </button>
              </div>
            </PopoverContent>
            </Popover>

            <button
              type='button'
              onClick={goToProfileSettings}
              className='flex items-center gap-2 px-2 py-1 rounded-xl border border-[#2d2a26]/15 hover:bg-[#f0ede8] transition-all'
            >
              <div className='w-7 h-7 rounded-full bg-[#c67d5b] flex items-center justify-center border border-[#2d2a26]/20'>
                <span className='text-white text-xs' style={{ fontWeight: 600 }}>PH</span>
              </div>
              <span className='text-sm hidden md:block max-w-[9rem] truncate' style={{ fontWeight: 600 }}>
                {managerProfile.name}
              </span>
            </button>
          </div>
        </header>

        <main className='flex-1 p-4 md:p-6 overflow-auto'>
          <Outlet />
        </main>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title='Tìm kiếm nhanh' description='Tìm thú cưng, khách hàng, lịch hẹn hoặc thao tác hệ thống'>
        <CommandInput placeholder='Gõ tên thú cưng, khách hàng, hoặc hành động...' />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>

          <CommandGroup heading='Thao tác nhanh'>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/pets?action=quick-add')}>
              <PawPrint className='w-4 h-4 text-[#6b8f5e]' />
              Quick Add Walk-in
              <CommandShortcut>New</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/bookings')}>
              <CalendarDays className='w-4 h-4 text-[#c67d5b]' />
              Quản lý lịch hẹn
            </CommandItem>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/settings?tab=profile')}>
              <Settings className='w-4 h-4 text-[#2d2a26]' />
              Hồ sơ quản lý
            </CommandItem>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/notifications')}>
              <Inbox className='w-4 h-4 text-[#6b8f5e]' />
              Trung tâm thông báo
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='Thú cưng'>
            {quickSearchData.pets.map((pet) => (
              <CommandItem key={pet.id} onSelect={() => handleCommandNavigate('/manager/pets')}>
                <PawPrint className='w-4 h-4 text-[#6b8f5e]' />
                {pet.name} • {pet.breed}
                <CommandShortcut>{pet.id}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='Khách hàng'>
            {quickSearchData.customers.map((customer) => (
              <CommandItem key={customer.id} onSelect={() => handleCommandNavigate('/manager/customers')}>
                <Users className='w-4 h-4 text-[#2d2a26]' />
                {customer.name}
                <CommandShortcut>{customer.phone}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='Lịch hẹn gần nhất'>
            {quickSearchData.appointments.map((booking) => (
              <CommandItem key={booking.id} onSelect={() => handleCommandNavigate('/manager/bookings')}>
                <Stethoscope className='w-4 h-4 text-[#c67d5b]' />
                {booking.petName} • {booking.serviceName}
                <CommandShortcut>{booking.time}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
