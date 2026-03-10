import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import {
  PawPrint, Menu, X, Home, Stethoscope, User, CalendarDays,
  LogIn, LayoutDashboard, ChevronDown
} from 'lucide-react';

export function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = true; // mock

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/services', label: 'Dịch vụ', icon: Stethoscope },
    { to: '/my-pets', label: 'Thú cưng', icon: PawPrint },
    { to: '/my-bookings', label: 'Lịch hẹn', icon: CalendarDays },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* Wavy top accent */}
      <div className="h-1 bg-[#6b8f5e]" />

      {/* Navbar */}
      <nav className="border-b border-[#2d2a26] bg-[#faf9f6] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-[#6b8f5e] flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Pet<span className="text-[#c67d5b]">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 ${
                    isActive(link.to)
                      ? 'bg-[#6b8f5e] text-white'
                      : 'text-[#2d2a26] hover:bg-[#f0ede8]'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="text-sm">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 transition-all bg-white"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6b8f5e] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">Nguyễn Văn An</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#2d2a26] rounded-xl overflow-hidden z-50">
                      <Link to="/profile" className="block px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors" onClick={() => setUserMenuOpen(false)}>
                        Hồ sơ cá nhân
                      </Link>
                      <Link to="/my-pets" className="block px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors" onClick={() => setUserMenuOpen(false)}>
                        Thú cưng của tôi
                      </Link>
                      <hr className="border-[#2d2a26]/20" />
                      <Link to="/manager" className="block px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors text-[#6b8f5e]" onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          Quản trị viên
                        </div>
                      </Link>
                      <hr className="border-[#2d2a26]/20" />
                      <button className="w-full text-left px-4 py-3 text-sm hover:bg-[#f0ede8] transition-colors text-[#c44040]" onClick={() => { setUserMenuOpen(false); navigate('/login'); }}>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm">Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#2d2a26] bg-white">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 ${isActive(link.to) ? 'bg-[#6b8f5e] text-white' : 'hover:bg-[#f0ede8]'}`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            <hr className="border-[#2d2a26]/20" />
            <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 hover:bg-[#f0ede8]">
              <User className="w-5 h-5" />
              Hồ sơ cá nhân
            </Link>
            <Link to="/manager" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 hover:bg-[#f0ede8] text-[#6b8f5e]">
              <LayoutDashboard className="w-5 h-5" />
              Quản trị viên
            </Link>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Wavy divider before footer */}
      <div className="relative h-16 overflow-hidden">
        <svg viewBox="0 0 1440 60" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,20 C240,60 480,0 720,30 C960,60 1200,10 1440,40 L1440,60 L0,60 Z" fill="#2d2a26" />
        </svg>
      </div>

      {/* Footer */}
      <footer className="bg-[#2d2a26] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PawPrint className="w-6 h-6 text-[#6b8f5e]" />
                <span className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  Pet<span className="text-[#c67d5b]">Hub</span>
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Nền tảng quản lý dịch vụ thú cưng hàng đầu Việt Nam. Số hóa toàn bộ vòng đời chăm sóc thú cưng.
              </p>
            </div>
            <div>
              <h4 className="text-sm mb-4 text-[#c67d5b]" style={{ fontFamily: "'Playfair Display', serif" }}>Liên kết</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <button onClick={() => scrollToSection('about-section')} className="block hover:text-white transition-colors text-left">Về chúng tôi</button>
                <Link to="/services" className="block hover:text-white transition-colors">Dịch vụ</Link>
                <button onClick={() => scrollToSection('pricing-section')} className="block hover:text-white transition-colors text-left">Bảng giá</button>
                <button onClick={() => scrollToSection('contact-section')} className="block hover:text-white transition-colors text-left">Liên hệ</button>
              </div>
            </div>
            <div>
              <h4 className="text-sm mb-4 text-[#c67d5b]" style={{ fontFamily: "'Playfair Display', serif" }}>Liên hệ</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Hotline: 1900-PETHUB</p>
                <p>Email: hello@pethub.vn</p>
                <p>TP. Hồ Chí Minh, Việt Nam</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
            &copy; 2026 PetHub. Thiết kế với tình yêu dành cho thú cưng.
          </div>
        </div>
      </footer>
    </div>
  );
}