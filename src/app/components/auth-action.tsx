import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  MailCheck,
  PawPrint,
  ShieldCheck,
} from 'lucide-react';
import { applyActionCode, confirmPasswordReset } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
import { toFriendlyAuthError } from '../lib/auth-errors';
import loginVisual from '../../assets/images/auth/login-hero.jpg';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

type AuthActionMode = 'verifyEmail' | 'resetPassword';
type VerifyState = 'idle' | 'loading' | 'success' | 'error';
type ResetState = 'idle' | 'success';

function getActionParams(search: string) {
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode')?.trim() ?? '';
  return { mode, oobCode };
}

function resolveMode(mode: string | null): AuthActionMode | null {
  if (mode === 'verifyEmail' || mode === 'resetPassword') {
    return mode;
  }
  return null;
}

function AuthActionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-[#faf9f6]'>
      <div className='grid min-h-screen lg:grid-cols-2'>
        <aside className='relative hidden border-r border-[#2d2a26] lg:block'>
          <img src={loginVisual} alt='PetHub visual' className='absolute inset-0 h-full w-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-br from-[#2d2a26]/35 via-[#6b8f5e]/18 to-[#c67d5b]/20' />
          <div className='absolute bottom-10 left-10 right-10 rounded-2xl border border-[#fbf9f6]/45 bg-black/28 p-7 backdrop-blur-[1px]'>
            <p
              className='text-[36px] leading-tight text-[#fbf9f6]'
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
            >
              Bảo mật tài khoản chuyên nghiệp, liền mạch với trải nghiệm PetHub.
            </p>
            <p className='mt-4 text-sm text-[#fbf9f6]/90'>PetHub Premium Veterinary SaaS</p>
          </div>
        </aside>

        <main className='flex items-center px-6 py-8 sm:px-10 md:px-14 lg:px-16'>
          <div className='mx-auto w-full max-w-md'>
            <Link
              to='/'
              className='inline-flex items-center gap-2 text-sm text-[#7a756e] transition-colors hover:text-[#2d2a26]'
            >
              <ArrowLeft className='h-4 w-4' />
              Quay về trang chủ
            </Link>

            <div className='mb-6 mt-6'>
              <div className='mb-5 flex items-center gap-2'>
                <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2d2a26] bg-[#6b8f5e]'>
                  <PawPrint className='h-6 w-6 text-white' />
                </div>
                <span className='text-3xl' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  Pet<span className='text-[#c67d5b]'>Hub</span>
                </span>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthActionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode: modeParam, oobCode } = useMemo(() => getActionParams(location.search), [location.search]);
  const mode = resolveMode(modeParam);
  const hasValidParams = Boolean(mode && oobCode);

  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyError, setVerifyError] = useState('');
  const [resetState, setResetState] = useState<ResetState>('idle');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (!hasValidParams || mode !== 'verifyEmail') {
      return;
    }

    let active = true;
    setVerifyState('loading');
    setVerifyError('');

    (async () => {
      try {
        await applyActionCode(firebaseAuth, oobCode);
        if (!active) {
          return;
        }
        setVerifyState('success');
      } catch (error) {
        if (!active) {
          return;
        }
        setVerifyState('error');
        setVerifyError(toFriendlyAuthError(error, 'verify-email'));
      }
    })();

    return () => {
      active = false;
    };
  }, [hasValidParams, mode, oobCode]);

  useEffect(() => {
    if (resetState !== 'success') {
      return;
    }
    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [navigate, resetState]);

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidParams || mode !== 'resetPassword') {
      return;
    }

    setResetError('');

    if (newPassword.length < 8) {
      setResetError('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setResetSubmitting(true);
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
      setResetState('success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setResetError(toFriendlyAuthError(error, 'reset-password-confirm'));
    } finally {
      setResetSubmitting(false);
    }
  };

  const renderInvalidState = () => (
    <>
      <CardHeader className='space-y-2 border-b border-[#2d2a26]/10 pb-5'>
        <div className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-300 bg-red-50'>
          <AlertCircle className='h-5 w-5 text-red-600' />
        </div>
        <CardTitle className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Liên kết không hợp lệ
        </CardTitle>
        <CardDescription className='text-[#7a756e]'>
          Đường dẫn xác thực đã thiếu thông tin hoặc không còn hiệu lực.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pb-6'>
        <Alert variant='destructive' className='border border-red-300 bg-red-50 text-red-700'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Không thể xử lý yêu cầu</AlertTitle>
          <AlertDescription>Vui lòng yêu cầu gửi lại email xác thực hoặc đặt lại mật khẩu mới.</AlertDescription>
        </Alert>
        <Button
          type='button'
          onClick={() => navigate('/login', { replace: true })}
          className='h-11 w-full rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:bg-[#628455]'
        >
          Quay lại Đăng nhập
        </Button>
      </CardContent>
    </>
  );

  const renderVerifyState = () => (
    <>
      <CardHeader className='space-y-2 border-b border-[#2d2a26]/10 pb-5'>
        <div className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2d2a26]/20 bg-[#6b8f5e]/10'>
          {verifyState === 'loading' ? (
            <LoaderCircle className='h-5 w-5 animate-spin text-[#6b8f5e]' />
          ) : verifyState === 'success' ? (
            <CheckCircle2 className='h-5 w-5 text-[#6b8f5e]' />
          ) : (
            <MailCheck className='h-5 w-5 text-[#6b8f5e]' />
          )}
        </div>
        <CardTitle className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Xác minh Email
        </CardTitle>
        <CardDescription className='text-[#7a756e]'>
          Hệ thống đang xử lý yêu cầu xác thực tài khoản của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pb-6'>
        {verifyState === 'loading' ? (
          <Alert className='border border-[#2d2a26]/15 bg-[#f7f6f3]'>
            <LoaderCircle className='h-4 w-4 animate-spin text-[#6b8f5e]' />
            <AlertTitle className='text-[#2d2a26]'>Đang xác minh email...</AlertTitle>
            <AlertDescription>Vui lòng chờ trong giây lát.</AlertDescription>
          </Alert>
        ) : null}
        {verifyState === 'success' ? (
          <Alert className='border border-[#6b8f5e]/40 bg-[#ecf7ec] text-[#2f6b2f]'>
            <CheckCircle2 className='h-4 w-4 text-[#2f6b2f]' />
            <AlertTitle>Email đã được xác thực thành công</AlertTitle>
            <AlertDescription>Bạn có thể đăng nhập và sử dụng đầy đủ tính năng của PetHub.</AlertDescription>
          </Alert>
        ) : null}
        {verifyState === 'error' ? (
          <Alert variant='destructive' className='border border-red-300 bg-red-50 text-red-700'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Xác minh thất bại</AlertTitle>
            <AlertDescription>{verifyError || 'Liên kết xác minh đã hết hạn hoặc đã được sử dụng.'}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type='button'
          onClick={() => navigate('/login', { replace: true })}
          className='h-11 w-full rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:bg-[#628455]'
          disabled={verifyState === 'loading'}
        >
          Tiếp tục Đăng nhập
        </Button>
      </CardContent>
    </>
  );

  const renderResetState = () => (
    <>
      <CardHeader className='space-y-2 border-b border-[#2d2a26]/10 pb-5'>
        <div className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2d2a26]/20 bg-[#6b8f5e]/10'>
          <ShieldCheck className='h-5 w-5 text-[#6b8f5e]' />
        </div>
        <CardTitle className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Đặt lại mật khẩu
        </CardTitle>
        <CardDescription className='text-[#7a756e]'>
          Nhập mật khẩu mới để hoàn tất khôi phục tài khoản của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pb-6'>
        {resetState === 'success' ? (
          <Alert className='border border-[#6b8f5e]/40 bg-[#ecf7ec] text-[#2f6b2f]'>
            <CheckCircle2 className='h-4 w-4 text-[#2f6b2f]' />
            <AlertTitle>Cập nhật mật khẩu thành công</AlertTitle>
            <AlertDescription>Bạn sẽ được chuyển về trang đăng nhập trong giây lát.</AlertDescription>
          </Alert>
        ) : (
          <form className='space-y-4' onSubmit={handleResetSubmit}>
            <div className='space-y-2'>
              <Label htmlFor='new-password' className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>
                Mật khẩu mới
              </Label>
              <div className='relative'>
                <Lock className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7a756e]' />
                <Input
                  id='new-password'
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder='Tối thiểu 8 ký tự'
                  autoComplete='new-password'
                  required
                  className='h-11 rounded-xl border-[#2d2a26] bg-transparent pl-10 pr-12 text-[#2d2a26] placeholder:text-[#99938a] focus-visible:ring-[#6b8f5e]'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((value) => !value)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-[#7a756e]'
                  aria-label={showPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                >
                  {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm-password' className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>
                Xác nhận mật khẩu mới
              </Label>
              <div className='relative'>
                <Lock className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7a756e]' />
                <Input
                  id='confirm-password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder='Nhập lại mật khẩu mới'
                  autoComplete='new-password'
                  required
                  className='h-11 rounded-xl border-[#2d2a26] bg-transparent pl-10 pr-12 text-[#2d2a26] placeholder:text-[#99938a] focus-visible:ring-[#6b8f5e]'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-[#7a756e]'
                  aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
                >
                  {showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              </div>
            </div>

            {resetError ? (
              <Alert variant='destructive' className='border border-red-300 bg-red-50 text-red-700'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Không thể đặt lại mật khẩu</AlertTitle>
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type='submit'
              disabled={resetSubmitting}
              className='h-11 w-full rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:bg-[#628455]'
            >
              {resetSubmitting ? (
                <span className='inline-flex items-center gap-2'>
                  <LoaderCircle className='h-4 w-4 animate-spin' />
                  Đang cập nhật...
                </span>
              ) : (
                'Lưu mật khẩu mới'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='h-11 w-full rounded-xl border-[#2d2a26] text-[#2d2a26]'
              onClick={() => navigate('/login', { replace: true })}
            >
              Quay lại Đăng nhập
            </Button>
          </form>
        )}
      </CardContent>
    </>
  );

  return (
    <AuthActionShell>
      <Card className='overflow-hidden rounded-2xl border border-[#2d2a26] bg-white/95 shadow-[0_16px_45px_rgba(45,42,38,0.1)]'>
        {!hasValidParams ? renderInvalidState() : null}
        {hasValidParams && mode === 'verifyEmail' ? renderVerifyState() : null}
        {hasValidParams && mode === 'resetPassword' ? renderResetState() : null}
      </Card>
    </AuthActionShell>
  );
}
