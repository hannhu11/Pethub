import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PawPrint, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#6b8f5e] flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Đăng nhập PetHub
          </h1>
          <p className="text-sm text-[#7a756e] mt-2">Chào mừng bạn trở lại!</p>
        </div>

        <div className="bg-white border border-[#2d2a26] rounded-2xl p-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#2d2a26] mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#2d2a26] mb-1 block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-12 py-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]"
                />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff className="w-5 h-5 text-[#7a756e]" /> : <Eye className="w-5 h-5 text-[#7a756e]" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#2d2a26] accent-[#6b8f5e]" />
                <span className="text-[#7a756e]">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-[#6b8f5e] hover:underline">Quên mật khẩu?</a>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26]"
            >
              Đăng nhập
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2d2a26]/20" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-[#7a756e]">hoặc</span>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-white text-[#2d2a26] border border-[#2d2a26] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Đăng nhập với Google
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#7a756e] mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-[#6b8f5e] hover:underline" style={{ fontWeight: 600 }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#c67d5b] flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Tạo tài khoản PetHub
          </h1>
          <p className="text-sm text-[#7a756e] mt-2">Đăng ký miễn phí trong 30 giây!</p>
        </div>

        <div className="bg-white border border-[#2d2a26] rounded-2xl p-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#2d2a26] mb-1 block">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
                <input type="text" placeholder="Nguyễn Văn An" className="w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#2d2a26] mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
                <input type="email" placeholder="email@example.com" className="w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#2d2a26] mb-1 block">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
                <input type="tel" placeholder="0901234567" className="w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#2d2a26] mb-1 block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]" />
                <input type={showPass ? 'text' : 'password'} placeholder="Tối thiểu 8 ký tự" className="w-full pl-10 pr-12 py-3 border border-[#2d2a26] rounded-xl bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff className="w-5 h-5 text-[#7a756e]" /> : <Eye className="w-5 h-5 text-[#7a756e]" />}
                </button>
              </div>
            </div>
            <button onClick={() => navigate('/')} className="w-full py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
              Đăng ký
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#7a756e] mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#6b8f5e] hover:underline" style={{ fontWeight: 600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
