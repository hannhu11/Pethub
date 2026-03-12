import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  PawPrint,
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  SendHorizontal,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react';
import { useAuthSession } from '../auth-session';
import type { AuthRole, ForgotPasswordState } from '../types';
import { LEGAL_ROUTES } from '../constants/legal';
import loginVisual from '../../assets/images/auth/login-hero.jpg';
import registerVisual from '../../assets/images/auth/register-hero.jpg';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

function AuthShell({
  title,
  subtitle,
  quote,
  image,
  children,
}: {
  title: string;
  subtitle: string;
  quote: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-[#faf9f6]'>
      <div className='grid lg:grid-cols-2 min-h-screen'>
        <aside className='hidden lg:block relative border-r border-[#2d2a26]'>
          <img src={image} alt='PetHub visual' className='absolute inset-0 w-full h-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-br from-[#2d2a26]/35 via-[#6b8f5e]/18 to-[#c67d5b]/20' />
          <div className='absolute bottom-10 left-10 right-10 rounded-2xl border border-[#fbf9f6]/45 bg-black/28 p-7 backdrop-blur-[1px]'>
            <p className='text-[36px] leading-tight text-[#fbf9f6]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {quote}
            </p>
            <p className='text-sm mt-4 text-[#fbf9f6]/90'>PetHub Premium Veterinary SaaS</p>
          </div>
        </aside>

        <main className='px-6 py-8 sm:px-10 md:px-14 lg:px-16 flex items-center'>
          <div className='w-full max-w-md mx-auto'>
            <Link to='/' className='inline-flex items-center gap-2 text-sm text-[#7a756e] hover:text-[#2d2a26] transition-colors'>
              <ArrowLeft className='w-4 h-4' />
              Quay về trang chủ
            </Link>

            <div className='mt-6 mb-8'>
              <div className='flex items-center gap-2 mb-5'>
                <div className='w-11 h-11 rounded-2xl bg-[#6b8f5e] border border-[#2d2a26] flex items-center justify-center'>
                  <PawPrint className='w-6 h-6 text-white' />
                </div>
                <span className='text-3xl' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  Pet<span className='text-[#c67d5b]'>Hub</span>
                </span>
              </div>
              <h1 className='text-4xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{title}</h1>
              <p className='text-[#7a756e] mt-2'>{subtitle}</p>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function resolveDefaultPath(role: AuthRole) {
  return role === 'manager' ? '/manager' : '/customer/dashboard';
}

const defaultForgotState: ForgotPasswordState = {
  open: false,
  email: '',
  submitting: false,
  sent: false,
};

function LegalConsent({ mode }: { mode: 'login' | 'register' }) {
  return (
    <p className='text-xs leading-relaxed text-[#7a756e] mt-4'>
      Bằng việc {mode === 'login' ? 'đăng nhập' : 'đăng ký'}, bạn đồng ý với{' '}
      <Link to={LEGAL_ROUTES.terms} className='underline decoration-[#2d2a26] underline-offset-2 text-[#2d2a26]' style={{ fontWeight: 600 }}>
        Điều khoản sử dụng
      </Link>{' '}
      và{' '}
      <Link to={LEGAL_ROUTES.privacy} className='underline decoration-[#2d2a26] underline-offset-2 text-[#2d2a26]' style={{ fontWeight: 600 }}>
        Chính sách bảo mật
      </Link>
      .
    </p>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [forgot, setForgot] = useState<ForgotPasswordState>(defaultForgotState);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendResetPasswordEmail } = useAuthSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const authUser = await login({ email, password });
      const fromState = location.state as { from?: { pathname?: string } } | null;
      const fromPath = fromState?.from?.pathname;
      const redirectTo = resolveDefaultPath(authUser.role);

      if (fromPath && fromPath.startsWith(authUser.role === 'manager' ? '/manager' : '/customer')) {
        navigate(fromPath, { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Đăng nhập thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgot.email.trim()) {
      return;
    }
    setForgot((prev) => ({ ...prev, submitting: true }));
    try {
      await sendResetPasswordEmail(forgot.email.trim());
      setForgot((prev) => ({ ...prev, submitting: false, sent: true }));
    } catch (error) {
      setForgot((prev) => ({ ...prev, submitting: false }));
      setFormError(error instanceof Error ? error.message : 'Không gửi được email khôi phục.');
    }
  };

  const handleForgotResend = async () => {
    if (!forgot.email.trim()) {
      return;
    }
    setForgot((prev) => ({ ...prev, submitting: true }));
    try {
      await sendResetPasswordEmail(forgot.email.trim());
      setForgot((prev) => ({ ...prev, submitting: false, sent: true }));
    } catch (error) {
      setForgot((prev) => ({ ...prev, submitting: false }));
      setFormError(error instanceof Error ? error.message : 'Không gửi lại được email.');
    }
  };

  return (
    <AuthShell
      title='Chào mừng trở lại!'
      subtitle='Đăng nhập để quản lý lịch hẹn, hồ sơ và vận hành PetHub.'
      quote='Hơn cả một dịch vụ, chúng tôi chăm sóc những thành viên trong gia đình bạn.'
      image={loginVisual}
    >
      <form onSubmit={handleSubmit} className='space-y-5'>
        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Email</label>
          <div className='relative'>
            <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='your@email.com'
              autoComplete='email'
              required
              className='w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
            />
          </div>
        </div>

        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Mật khẩu</label>
          <div className='relative'>
            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='••••••••'
              autoComplete='current-password'
              required
              className='w-full pl-10 pr-12 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
            />
            <button type='button' onClick={() => setShowPass((v) => !v)} className='absolute right-3 top-1/2 -translate-y-1/2'>
              {showPass ? <EyeOff className='w-5 h-5 text-[#7a756e]' /> : <Eye className='w-5 h-5 text-[#7a756e]' />}
            </button>
          </div>
        </div>

        <div className='flex items-center justify-end text-sm'>
          <button
            type='button'
            onClick={() => setForgot({ ...defaultForgotState, open: true, email })}
            className='text-[#c67d5b] underline underline-offset-2 decoration-[#c67d5b]/50'
          >
            Quên mật khẩu?
          </button>
        </div>

        {formError ? (
          <div className='rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700'>{formError}</div>
        ) : null}

        <button
          type='submit'
          disabled={submitting}
          className='w-full py-3 bg-[#6b8f5e] text-white rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 active:translate-y-[2px] transition-transform disabled:opacity-70 disabled:cursor-not-allowed'
        >
          {submitting ? (
            <span className='inline-flex items-center gap-2'>
              <LoaderCircle className='w-4 h-4 animate-spin' />
              Đang đăng nhập...
            </span>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

      <LegalConsent mode='login' />

      <p className='text-sm text-[#7a756e] mt-6'>
        Chưa có tài khoản?{' '}
        <Link to='/register' className='text-[#6b8f5e]' style={{ fontWeight: 600 }}>
          Tạo tài khoản miễn phí
        </Link>
      </p>

      <Dialog
        open={forgot.open}
        onOpenChange={(open) => {
          if (!open) {
            setForgot(defaultForgotState);
            return;
          }
          setForgot((prev) => ({ ...prev, open: true }));
        }}
      >
        <DialogContent className='border-[#2d2a26] bg-[#faf9f6]'>
          <DialogHeader>
            <div className='inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full border border-[#2d2a26]/20 bg-[#6b8f5e]/10 text-[#2d2a26] text-xs'>
              <ShieldCheck className='w-3.5 h-3.5 text-[#6b8f5e]' />
              Bảo mật tài khoản
            </div>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>Khôi phục mật khẩu</DialogTitle>
            <DialogDescription>Nhập email để nhận liên kết đặt lại mật khẩu an toàn trong 15 phút.</DialogDescription>
          </DialogHeader>

          {!forgot.sent ? (
            <form onSubmit={handleForgotSubmit} className='space-y-4'>
              <label className='text-sm text-[#2d2a26] block'>Email đăng nhập</label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]' />
                <input
                  type='email'
                  required
                  value={forgot.email}
                  onChange={(e) => setForgot((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder='your@email.com'
                  className='w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
                />
              </div>
              <p className='text-xs text-[#7a756e]'>
                Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu qua email.
              </p>
              <DialogFooter>
                <button
                  type='submit'
                  disabled={forgot.submitting}
                  className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-[2px] transition-transform'
                >
                  <SendHorizontal className='w-4 h-4' />
                  {forgot.submitting ? 'Đang gửi...' : 'Gửi liên kết'}
                </button>
              </DialogFooter>
            </form>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900'>
                <p className='flex items-center gap-2' style={{ fontWeight: 600 }}>
                  <CheckCircle2 className='w-4 h-4' />
                  Liên kết đã được gửi thành công
                </p>
                <p className='mt-1'>Vui lòng kiểm tra hộp thư của <span style={{ fontWeight: 600 }}>{forgot.email}</span>.</p>
              </div>
              <div className='flex items-center justify-between'>
                <button
                  type='button'
                  onClick={handleForgotResend}
                  disabled={forgot.submitting}
                  className='text-sm text-[#6b8f5e] underline underline-offset-2 disabled:opacity-50'
                >
                  {forgot.submitting ? 'Đang gửi lại...' : 'Gửi lại liên kết'}
                </button>
                <button
                  type='button'
                  onClick={() => setForgot(defaultForgotState)}
                  className='px-4 py-2 text-sm rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-transform'
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuthSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const authUser = await register({
        email,
        password,
        name: name || email.split('@')[0] || 'PetHub User',
        phone,
      });
      navigate(resolveDefaultPath(authUser.role), { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Đăng ký thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title='Tạo tài khoản miễn phí'
      subtitle='Thiết lập tài khoản PetHub trong vài phút để bắt đầu số hóa vận hành.'
      quote='Nền tảng quản lý hiện đại cho pet store và phòng khám thú y chuyên nghiệp.'
      image={registerVisual}
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Họ và tên</label>
          <div className='relative'>
            <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              type='text'
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder='Nguyễn Văn A'
              className='w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
            />
          </div>
        </div>

        <div className='rounded-xl border border-[#2d2a26]/20 bg-[#6b8f5e]/10 px-3 py-2 text-xs text-[#2d2a26]'>
          <div className='inline-flex items-center gap-2' style={{ fontWeight: 600 }}>
            <Building2 className='w-4 h-4 text-[#6b8f5e]' />
            Tài khoản đăng ký mới mặc định là khách hàng.
          </div>
          <p className='mt-1 text-[#6f6961]'>
            Tài khoản quản lý được cấp riêng bởi admin hệ thống.
          </p>
        </div>

        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Số điện thoại</label>
          <input
            type='tel'
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder='0901234567'
            className='w-full px-4 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
          />
        </div>

        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Email</label>
          <div className='relative'>
            <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='your@email.com'
              autoComplete='email'
              required
              className='w-full pl-10 pr-4 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
            />
          </div>
        </div>

        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Mật khẩu</label>
          <div className='relative'>
            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Tối thiểu 8 ký tự'
              autoComplete='new-password'
              required
              className='w-full pl-10 pr-12 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
            />
            <button type='button' onClick={() => setShowPass((v) => !v)} className='absolute right-3 top-1/2 -translate-y-1/2'>
              {showPass ? <EyeOff className='w-5 h-5 text-[#7a756e]' /> : <Eye className='w-5 h-5 text-[#7a756e]' />}
            </button>
          </div>
        </div>

        <div>
          <label className='text-sm text-[#2d2a26] mb-2 block' style={{ fontWeight: 700 }}>Xác nhận mật khẩu</label>
          <div className='relative'>
            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a756e]' />
            <input
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder='Nhập lại mật khẩu'
              autoComplete='new-password'
              required
              className='w-full pl-10 pr-12 py-3 border border-[#2d2a26] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]'
            />
            <button type='button' onClick={() => setShowConfirmPass((v) => !v)} className='absolute right-3 top-1/2 -translate-y-1/2'>
              {showConfirmPass ? <EyeOff className='w-5 h-5 text-[#7a756e]' /> : <Eye className='w-5 h-5 text-[#7a756e]' />}
            </button>
          </div>
        </div>

        {formError ? (
          <div className='rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700'>{formError}</div>
        ) : null}

        <button
          type='submit'
          disabled={submitting}
          className='w-full py-3 bg-[#6b8f5e] text-white rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 active:translate-y-[2px] transition-transform disabled:opacity-70 disabled:cursor-not-allowed'
        >
          {submitting ? (
            <span className='inline-flex items-center gap-2'>
              <LoaderCircle className='w-4 h-4 animate-spin' />
              Đang tạo tài khoản...
            </span>
          ) : (
            'Tạo tài khoản'
          )}
        </button>
      </form>

      <LegalConsent mode='register' />

      <p className='text-sm text-[#7a756e] mt-6'>
        Đã có tài khoản?{' '}
        <Link to='/login' className='text-[#6b8f5e]' style={{ fontWeight: 600 }}>
          Đăng nhập ngay
        </Link>
      </p>
    </AuthShell>
  );
}
