import { useCallback, useEffect, useRef, useState } from 'react';
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
  Receipt,
  Search,
  Zap,
  UserCircle2,
  LogOut,
  Building2,
  Stethoscope,
  Inbox,
} from 'lucide-react';
import { useAuthSession } from '../auth-session';
import { BrandLockup } from './brand-lockup';
import {
  getClinicSettings,
  getProfileSettings,
  hydrateManagerSettings,
  subscribeManagerSettingsUpdates,
} from './manager-settings-store';
import { ChatbotWidget } from './chatbot-widget';
import {
  listNotifications,
  listCustomers,
  listPets,
  listAppointments,
  markNotificationAsRead,
  getManagerSettings,
  type ApiNotification,
} from '../lib/pethub-api';
import type { ApiAppointment, ApiCustomer, ApiPet } from '../types';
import { extractApiError } from '../lib/api-client';
import { connectRealtimeSocket } from '../lib/realtime';
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
  { type: 'link', to: '/manager/revenue-ledger', label: 'Đối soát doanh thu', icon: Receipt },
  { type: 'link', to: '/manager/bookings', label: 'Lịch hẹn', icon: CalendarDays },
  { type: 'separator', label: 'CRM' },
  { type: 'link', to: '/manager/customers', label: 'Khách hàng', icon: Users },
  { type: 'link', to: '/manager/pets', label: 'Thú cưng', icon: PawPrint },
  { type: 'separator', label: 'Kho & Vận hành' },
  { type: 'link', to: '/manager/catalog', label: 'Sản phẩm & Dịch vụ', icon: Package },
  { type: 'separator', label: 'Tự động hóa' },
  { type: 'link', to: '/manager/reminders', label: 'Nhắc nhở', icon: Zap },
];

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN');
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'PH';
}


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
              <p className='text-[9px] text-[#8b6a61]/70 uppercase tracking-[0.15em]' style={{ fontWeight: 600 }}>
                {item.label}
              </p>
              <div className='border-b border-[#592518]/8 mt-1.5' />
            </div>
          );
        }

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClickLink}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive(item.to, item.exact) ? 'bg-[#d56756] text-white' : 'text-[#592518] hover:bg-[#efe3d7]'
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
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickSearchData, setQuickSearchData] = useState<{
    pets: ApiPet[];
    customers: ApiCustomer[];
    appointments: ApiAppointment[];
  }>({
    pets: [],
    customers: [],
    appointments: [],
  });
  const [managerProfile, setManagerProfile] = useState(getProfileSettings());
  const [clinic, setClinic] = useState(getClinicSettings());
  const [, setLoadError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, session } = useAuthSession();
  const notificationsInFlightRef = useRef(false);
  const quickSearchInFlightRef = useRef(false);

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

  const loadNotifications = useCallback(async (silent = false) => {
    if (notificationsInFlightRef.current) {
      return;
    }
    notificationsInFlightRef.current = true;
    if (!silent) {
      setLoadError('');
    }
    try {
      const data = await listNotifications('all');
      setNotifications(data.items.slice(0, 20));
      setUnreadCount(data.unread);
      if (!silent) {
        setLoadError('');
      }
    } catch (apiError) {
      if (!silent) {
        setLoadError(extractApiError(apiError));
      }
    } finally {
      notificationsInFlightRef.current = false;
    }
  }, []);

  const loadQuickSearchData = useCallback(async () => {
    if (quickSearchInFlightRef.current) {
      return;
    }
    if (
      quickSearchData.customers.length > 0 ||
      quickSearchData.pets.length > 0 ||
      quickSearchData.appointments.length > 0
    ) {
      return;
    }

    quickSearchInFlightRef.current = true;
    try {
      const [customers, pets, appointments] = await Promise.all([
        listCustomers(),
        listPets(),
        listAppointments(),
      ]);

      setQuickSearchData({
        customers: customers.slice(0, 12),
        pets: pets.slice(0, 12),
        appointments: appointments.slice(0, 12),
      });
    } catch {
      // Keep command palette usable even if quick-search data is temporarily unavailable.
    } finally {
      quickSearchInFlightRef.current = false;
    }
  }, [quickSearchData.appointments.length, quickSearchData.customers.length, quickSearchData.pets.length]);

  useEffect(() => {
    let mounted = true;
    const run = async (silent = false) => {
      if (!mounted) {
        return;
      }
      await loadNotifications(silent);
    };

    void run(false);
    const timer = window.setInterval(() => {
      void run(true);
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [loadNotifications, session.user?.userId]);

  useEffect(() => {
    if (!commandOpen) {
      return;
    }
    void loadQuickSearchData();
  }, [commandOpen, loadQuickSearchData]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await getManagerSettings();
        if (!mounted) {
          return;
        }
        const hasPremiumMarker = Boolean(
          data.subscription?.planCode?.toLowerCase().includes('premium') ||
            data.subscription?.planName?.toLowerCase().includes('premium'),
        );
        const isPremiumPlan = Boolean(
          data.subscription?.isActive &&
            (hasPremiumMarker || (!data.subscription?.planCode && !data.subscription?.planName)),
        );
        hydrateManagerSettings({
          profile: {
            name: data.profile.name,
            email: data.profile.email,
            phone: data.profile.phone,
            role: data.profile.role === 'manager' ? 'Quản trị viên' : 'Khách hàng',
          },
          clinic: {
            name: data.clinic?.clinicName ?? '',
            taxId: data.clinic?.taxId ?? '',
            phone: data.clinic?.phone ?? '',
            address: data.clinic?.address ?? '',
            invoiceNote: data.clinic?.invoiceNote ?? '',
          },
          subscription: {
            plan: isPremiumPlan ? 'premium' : 'basic',
            amount: Number(data.subscription?.amount ?? 249000),
            currency: 'VND',
            billingCycle: 'monthly',
            paymentMethod: null,
            activatedAt: data.billing?.startedAt
              ? new Date(data.billing.startedAt).toLocaleDateString('vi-VN')
              : undefined,
            expiresAt: data.billing?.expiresAt
              ? new Date(data.billing.expiresAt).toLocaleDateString('vi-VN')
              : undefined,
            remainingDays:
              typeof data.billing?.remainingDays === 'number'
                ? Math.max(0, Math.ceil(data.billing.remainingDays))
                : null,
            petCount: Number(data.usage?.petCount ?? 0),
          },
        });
      } catch {
        // Keep UI usable with current session fallback even if settings endpoint is temporarily unavailable.
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [session.user?.userId]);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    const setupRealtime = async () => {
      let socket = null;
      try {
        socket = await connectRealtimeSocket();
      } catch {
        return;
      }
      if (!active || !socket) {
        return;
      }

      const refresh = () => {
        void loadNotifications(true);
      };

      socket.on('notification.created', refresh);
      socket.on('notification.read', refresh);
      socket.on('appointment.updated', refresh);
      socket.on('invoice.payment.updated', refresh);
      socket.on('reminder.updated', refresh);

      cleanup = () => {
        socket.off('notification.created', refresh);
        socket.off('notification.read', refresh);
        socket.off('appointment.updated', refresh);
        socket.off('invoice.payment.updated', refresh);
        socket.off('reminder.updated', refresh);
        socket.disconnect();
      };
    };

    void setupRealtime();
    return () => {
      active = false;
      cleanup?.();
    };
  }, [loadNotifications, session.user?.userId]);

  useEffect(() => {
    return subscribeManagerSettingsUpdates(() => {
      setManagerProfile(getProfileSettings());
      setClinic(getClinicSettings());
    });
  }, []);

  useEffect(() => {
    if (!session.user) {
      return;
    }
    setManagerProfile((previous) => ({
      ...previous,
      name: session.user?.name ?? previous.name,
      email: session.user?.email ?? previous.email,
      phone: session.user?.phone ?? previous.phone,
      role: session.user?.role === 'manager' ? 'Quản trị viên' : previous.role,
    }));
  }, [session.user?.email, session.user?.name, session.user?.phone, session.user?.role]);

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const goToProfileSettings = () => {
    navigate('/manager/settings?tab=profile');
  };

  const doLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleCommandNavigate = (to: string) => {
    setCommandOpen(false);
    navigate(to);
  };

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!notification.read) {
      try {
        const data = await markNotificationAsRead(notification.id);
        setUnreadCount(data.unread);
      } catch {
        // Keep navigation even when mark-read fails.
      }
    }
    setNotifOpen(false);
    navigate(notification.linkTo || '/manager');
  };

  return (
    <div className='min-h-screen flex bg-[#faf8f5]'>
      <aside className='hidden lg:flex flex-col w-64 bg-[#f6eee7] border-r border-[#592518] print:hidden'>
        <div className='p-5 border-b border-[#592518]'>
          <Link to='/manager' className='flex flex-col items-start gap-1'>
            <BrandLockup imageClassName='h-10' />
            <p className='text-[10px] text-[#8b6a61]'>Quản trị viên</p>
          </Link>
        </div>

        <nav className='flex-1 py-3 px-3 space-y-0.5 overflow-y-auto'>
          <SidebarNav items={sidebarItems} isActive={isActive} />
        </nav>

        <div className='px-3 pb-2'>
          <Link
            to='/manager/settings'
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive('/manager/settings') ? 'bg-[#d56756] text-white' : 'text-[#592518] hover:bg-[#efe3d7]'
            }`}
          >
            <Settings className='w-[18px] h-[18px]' />
            Cài đặt
          </Link>
        </div>

        <div className='p-3 border-t border-[#592518]/15 space-y-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#592518]/20 bg-white hover:-translate-y-0.5 transition-all text-left'>
                <div className='w-8 h-8 rounded-full bg-[#c75b4c] flex items-center justify-center border border-[#592518]/20'>
                  <span className='text-white text-xs' style={{ fontWeight: 600 }}>{initialsFromName(managerProfile.name)}</span>
                </div>
                <div className='min-w-0'>
                  <p className='text-sm truncate' style={{ fontWeight: 600 }}>{managerProfile.name}</p>
                  <p className='text-xs text-[#8b6a61] truncate'>{clinic.name}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='border-[#592518] w-56'>
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
              <DropdownMenuItem variant='destructive' onClick={() => void doLogout()}>
                <LogOut className='w-4 h-4' />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type='button'
            onClick={() => void doLogout()}
            className='w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all'
          >
            <LogOut className='w-4 h-4' />
            Đăng xuất
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className='fixed inset-0 z-50 lg:hidden print:hidden'>
          <div className='absolute inset-0 bg-black/30' onClick={() => setSidebarOpen(false)} />
          <aside className='relative w-64 h-full bg-[#f6eee7] border-r border-[#592518] overflow-y-auto'>
            <div className='p-5 flex items-center justify-between border-b border-[#592518]'>
              <BrandLockup imageClassName='h-9' />
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
                    isActive('/manager/settings') ? 'bg-[#d56756] text-white' : 'text-[#592518] hover:bg-[#efe3d7]'
                  }`}
                >
                  <Settings className='w-[18px] h-[18px]' />
                  Cài đặt
                </Link>
              </div>
            </nav>

            <div className='p-3 border-t border-[#592518]/15 space-y-2'>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  goToProfileSettings();
                }}
                className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#592518]/20 bg-white text-left'
              >
                <div className='w-8 h-8 rounded-full bg-[#c75b4c] flex items-center justify-center border border-[#592518]/20'>
                  <span className='text-white text-xs' style={{ fontWeight: 600 }}>{initialsFromName(managerProfile.name)}</span>
                </div>
                <div>
                  <p className='text-sm' style={{ fontWeight: 600 }}>{managerProfile.name}</p>
                  <p className='text-xs text-[#8b6a61]'>{clinic.name}</p>
                </div>
              </button>
              <button
                className='w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50'
                onClick={() => void doLogout()}
              >
                <LogOut className='w-4 h-4' /> Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className='flex-1 flex flex-col min-h-screen'>
        <header className='h-14 border-b border-[#592518] bg-white flex items-center px-4 sticky top-0 z-40 print:hidden'>
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            <button className='lg:hidden p-1' onClick={() => setSidebarOpen(true)}>
              <Menu className='w-5 h-5' />
            </button>

            <button
              type='button'
              onClick={() => setCommandOpen(true)}
              className='hidden sm:flex w-full max-w-xl items-center gap-2 px-3 py-1.5 rounded-xl bg-[#faf8f5] border border-[#592518]/15 hover:border-[#d56756]/50 transition-colors text-left'
            >
              <Search className='w-4 h-4 text-[#8b6a61]' />
              <span className='text-sm text-[#a09b94] flex-1'>Tìm kiếm nhanh...</span>
              <kbd className='text-[10px] text-[#8b6a61] border border-[#592518]/20 rounded px-1.5 py-0.5'>Ctrl K</kbd>
            </button>
          </div>

          <div className='ml-auto flex items-center gap-2'>
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className='relative p-1.5 rounded-xl border border-[#592518]/20 hover:bg-[#f4ece4] transition-all'
                >
                  <Bell className='w-5 h-5 text-[#592518]' />
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
            <PopoverContent align='end' className='w-[22rem] p-0 border-[#592518] bg-white'>
              <div className='p-3 border-b border-[#592518]/10 flex items-center justify-between'>
                <h3 className='text-sm' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  Thông báo
                </h3>
                <span className='text-[10px] text-[#d56756] px-2 py-0.5 rounded-full bg-[#d56756]/10' style={{ fontWeight: 600 }}>
                  {unreadCount} mới
                </span>
              </div>
              <div className='max-h-72 overflow-y-auto'>
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => void handleNotificationClick(item)}
                    className={`w-full text-left px-4 py-3 border-b border-[#592518]/5 hover:bg-[#faf8f5] transition-colors ${
                      !item.read ? 'bg-[#d56756]/5' : ''
                    }`}
                  >
                    <div className='flex items-start gap-2'>
                      {!item.read && <div className='w-2 h-2 rounded-full bg-[#d56756] mt-1.5 flex-shrink-0' />}
                      <div className={!item.read ? '' : 'pl-4'}>
                        <p className='text-xs text-[#592518]' style={!item.read ? { fontWeight: 500 } : {}}>
                          {item.title}
                        </p>
                        <p className='text-[10px] text-[#8b6a61] mt-0.5'>{formatTimestamp(item.createdAt)}</p>
                        <p className='text-[10px] text-[#9b948b] mt-0.5'>{item.body}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className='p-2 border-t border-[#592518]/10'>
                <button
                  type='button'
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/manager/notifications');
                  }}
                  className='w-full py-2 text-xs text-[#d56756] hover:bg-[#d56756]/5 rounded-xl transition-colors'
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
              className='flex items-center gap-2 px-2 py-1 rounded-xl border border-[#592518]/15 hover:bg-[#f4ece4] transition-all'
            >
              <div className='w-7 h-7 rounded-full bg-[#c75b4c] flex items-center justify-center border border-[#592518]/20'>
                <span className='text-white text-xs' style={{ fontWeight: 600 }}>{initialsFromName(managerProfile.name)}</span>
              </div>
              <span className='text-sm hidden md:block max-w-[9rem] truncate' style={{ fontWeight: 600 }}>
                {managerProfile.name}
              </span>
            </button>
          </div>
        </header>

        <main className='flex-1 p-4 md:p-6 overflow-auto print:p-0 print:m-0 print:overflow-visible print:bg-white'>
          <Outlet />
        </main>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title='Tìm kiếm nhanh' description='Tìm thú cưng, khách hàng, lịch hẹn hoặc thao tác hệ thống'>
        <CommandInput placeholder='Gõ tên thú cưng, khách hàng, hoặc hành động...' />
        <CommandList>
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>

          <CommandGroup heading='Thao tác nhanh'>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/pets?action=quick-add')}>
              <PawPrint className='w-4 h-4 text-[#d56756]' />
              Quick Add Walk-in
              <CommandShortcut>New</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/bookings')}>
              <CalendarDays className='w-4 h-4 text-[#c75b4c]' />
              Quản lý lịch hẹn
            </CommandItem>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/settings?tab=profile')}>
              <Settings className='w-4 h-4 text-[#592518]' />
              Hồ sơ quản lý
            </CommandItem>
            <CommandItem onSelect={() => handleCommandNavigate('/manager/notifications')}>
              <Inbox className='w-4 h-4 text-[#d56756]' />
              Trung tâm thông báo
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='Thú cưng'>
            {quickSearchData.pets.map((pet) => (
              <CommandItem key={pet.id} onSelect={() => handleCommandNavigate('/manager/pets')}>
                <PawPrint className='w-4 h-4 text-[#d56756]' />
                {pet.name} • {pet.breed || pet.species}
                <CommandShortcut>{pet.id}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='Khách hàng'>
            {quickSearchData.customers.map((customer) => (
              <CommandItem key={customer.id} onSelect={() => handleCommandNavigate('/manager/customers')}>
                <Users className='w-4 h-4 text-[#592518]' />
                {customer.name}
                <CommandShortcut>{customer.phone}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='Lịch hẹn gần nhất'>
            {quickSearchData.appointments.map((booking) => (
              <CommandItem key={booking.id} onSelect={() => handleCommandNavigate('/manager/bookings')}>
                <Stethoscope className='w-4 h-4 text-[#c75b4c]' />
                {(booking.pet?.name || 'Thú cưng')} • {(booking.service?.name || 'Dịch vụ')}
                <CommandShortcut>{new Date(booking.appointmentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <ChatbotWidget />
    </div>
  );
}
