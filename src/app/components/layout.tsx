import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import {
  PawPrint,
  Menu,
  X,
  Home,
  Info,
  BadgeDollarSign,
  LogIn,
  CalendarDays,
  Stethoscope,
  User,
  ChevronDown,
  BookOpenText,
  Phone,
  LifeBuoy,
  Shield,
} from 'lucide-react';
import { useAuthSession } from '../auth-session';

function SiteFooter() {
  return (
    <>
      <div className='relative h-16 overflow-hidden'>
        <svg viewBox='0 0 1440 60' className='absolute bottom-0 w-full' preserveAspectRatio='none'>
          <path d='M0,20 C240,60 480,0 720,30 C960,60 1200,10 1440,40 L1440,60 L0,60 Z' fill='#2d2a26' />
        </svg>
      </div>

      <footer className='bg-[#2d2a26] text-white py-12 border-t border-[#6b8f5e]/30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <PawPrint className='w-6 h-6 text-[#6b8f5e]' />
                <span className='text-lg' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  Pet<span className='text-[#c67d5b]'>Hub</span>
                </span>
              </div>
              <p className='text-sm text-gray-400'>
                Giải pháp quản lý Pet Shop & phòng khám thú y toàn diện, hiện đại và nhân văn.
              </p>
            </div>

            <div>
              <h4 className='text-sm mb-4 text-[#c67d5b]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Công ty</h4>
              <div className='space-y-2 text-sm text-gray-400'>
                <Link to='/about' className='flex items-center gap-2 hover:text-white transition-colors'>
                  <Info className='w-4 h-4' /> Về chúng tôi
                </Link>
                <Link to='/blog' className='flex items-center gap-2 hover:text-white transition-colors'>
                  <BookOpenText className='w-4 h-4' /> Blog
                </Link>
                <Link to='/contact' className='flex items-center gap-2 hover:text-white transition-colors'>
                  <Phone className='w-4 h-4' /> Liên hệ
                </Link>
              </div>
            </div>

            <div>
              <h4 className='text-sm mb-4 text-[#c67d5b]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Hỗ trợ</h4>
              <div className='space-y-2 text-sm text-gray-400'>
                <Link to='/help' className='flex items-center gap-2 hover:text-white transition-colors'>
                  <LifeBuoy className='w-4 h-4' /> Trung tâm trợ giúp
                </Link>
                <Link to='/terms' className='flex items-center gap-2 hover:text-white transition-colors'>
                  <Info className='w-4 h-4' /> Điều khoản
                </Link>
                <Link to='/privacy' className='flex items-center gap-2 hover:text-white transition-colors'>
                  <Shield className='w-4 h-4' /> Bảo mật
                </Link>
              </div>
            </div>

            <div>
              <h4 className='text-sm mb-4 text-[#c67d5b]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Kết nối</h4>
              <div className='space-y-2 text-sm text-gray-400'>
                <p>Hotline: 1900-PETHUB</p>
                <p>Email: support@pethub.vn</p>
                <p>TP. Hồ Chí Minh, Việt Nam</p>
              </div>
            </div>
          </div>
          <div className='mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500'>
            &copy; 2026 PetHub. Thiết kế với tình yêu dành cho thú cưng.
          </div>
        </div>
      </footer>
    </>
  );
}

function BrandLogo() {
  return (
    <>
      <div className='w-10 h-10 rounded-2xl bg-[#6b8f5e] flex items-center justify-center'>
        <PawPrint className='w-6 h-6 text-white' />
      </div>
      <span className='text-xl' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
        Pet<span className='text-[#c67d5b]'>Hub</span>
      </span>
    </>
  );
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { session } = useAuthSession();
  const dashboardPath = session.role === 'manager' ? '/manager' : '/customer/dashboard';

  const navLinks = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/pricing', label: 'Bảng giá', icon: BadgeDollarSign },
    { to: '/about', label: 'About Us', icon: Info },
    ...(session.isAuthenticated ? [] : [{ to: '/login', label: 'Đăng nhập', icon: LogIn }]),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className='min-h-screen flex flex-col bg-[#faf9f6]'>
      <div className='h-1 bg-[#6b8f5e]' />

      <nav className='border-b border-[#2d2a26] bg-[#faf9f6] sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link to='/' className='flex items-center gap-2'>
              <BrandLogo />
            </Link>

            <div className='hidden md:flex items-center gap-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 ${
                    isActive(link.to) ? 'bg-[#6b8f5e] text-white' : 'text-[#2d2a26] hover:bg-[#f0ede8]'
                  }`}
                >
                  <link.icon className='w-4 h-4' />
                  <span className='text-sm'>{link.label}</span>
                </Link>
              ))}
            </div>

            {session.isAuthenticated ? (
              <div className='hidden md:flex items-center gap-2'>
                <div className='px-3 py-1.5 rounded-xl border border-[#2d2a26] bg-white text-sm text-[#2d2a26]'>
                  {session.userName || 'Tài khoản PetHub'}
                </div>
                <Link
                  to={dashboardPath}
                  className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all text-sm'
                >
                  Vào bảng điều khiển
                </Link>
              </div>
            ) : null}

            <button className='md:hidden p-2' onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className='md:hidden border-t border-[#2d2a26] bg-white'>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 ${isActive(link.to) ? 'bg-[#6b8f5e] text-white' : 'hover:bg-[#f0ede8]'}`}
              >
                <link.icon className='w-5 h-5' />
                {link.label}
              </Link>
            ))}
            {session.isAuthenticated ? (
              <Link
                to={dashboardPath}
                onClick={() => setMenuOpen(false)}
                className='flex items-center justify-center gap-3 px-6 py-3 bg-[#6b8f5e] text-white hover:opacity-90 transition-opacity'
              >
                Vào bảng điều khiển
              </Link>
            ) : null}
          </div>
        )}
      </nav>

      <main className='flex-1'>
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}

export function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuthSession();

  const navLinks = [
    { to: '/customer/dashboard', label: 'Trang chủ', icon: Home },
    { to: '/customer/services', label: 'Dịch vụ', icon: Stethoscope },
    { to: '/customer/my-pets', label: 'Thú cưng', icon: PawPrint },
    { to: '/customer/appointments', label: 'Lịch hẹn', icon: CalendarDays },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className='min-h-screen flex flex-col bg-[#faf9f6]'>
      <div className='h-1 bg-[#6b8f5e]' />

      <nav className='border-b border-[#2d2a26] bg-[#faf9f6] sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link to='/customer/dashboard' className='flex items-center gap-2'>
              <BrandLogo />
            </Link>

            <div className='hidden md:flex items-center gap-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 ${
                    isActive(link.to) ? 'bg-[#6b8f5e] text-white' : 'text-[#2d2a26] hover:bg-[#f0ede8]'
                  }`}
                >
                  <link.icon className='w-4 h-4' />
                  <span className='text-sm'>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className='hidden md:flex items-center gap-3'>
              <div className='relative'>
                <button
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className='flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 transition-all bg-white'
                >
                  <div className='w-7 h-7 rounded-full bg-[#6b8f5e] flex items-center justify-center'>
                    <User className='w-4 h-4 text-white' />
                  </div>
                  <span className='text-sm'>{session.userName || 'Người dùng PetHub'}</span>
                  <ChevronDown className='w-4 h-4' />
                </button>
                {userMenuOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-white border border-[#2d2a26] rounded-xl overflow-hidden z-50'>
                    <Link
                      to='/customer/profile'
                      className='block px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors'
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      to='/customer/my-pets'
                      className='block px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors'
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Thú cưng của tôi
                    </Link>
                    <hr className='border-[#2d2a26]/20' />
                    <button
                      className='w-full text-left px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors text-[#c44040]'
                      onClick={() => {
                        void handleLogout();
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button className='md:hidden p-2' onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className='md:hidden border-t border-[#2d2a26] bg-white'>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 ${isActive(link.to) ? 'bg-[#6b8f5e] text-white' : 'hover:bg-[#f0ede8]'}`}
              >
                <link.icon className='w-5 h-5' />
                {link.label}
              </Link>
            ))}
            <hr className='border-[#2d2a26]/20' />
            <Link to='/customer/profile' onClick={() => setMenuOpen(false)} className='flex items-center gap-3 px-6 py-3 hover:bg-[#f0ede8]'>
              <User className='w-5 h-5' />
              Hồ sơ cá nhân
            </Link>
            <button
              className='w-full text-left px-6 py-3 hover:bg-[#f0ede8] text-[#c44040]'
              onClick={() => {
                void handleLogout();
              }}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </nav>

      <main className='flex-1'>
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
