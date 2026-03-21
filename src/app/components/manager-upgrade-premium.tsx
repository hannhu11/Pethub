import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { extractApiError } from '../lib/api-client';
import {
  createPayosPaymentLink,
  getPayosTransactionStatus,
  type ApiPayosLinkResponse,
  type ApiPayosTransactionStatusResponse,
} from '../lib/pethub-api';
import { connectRealtimeSocket } from '../lib/realtime';
import {
  getClinicSettings,
  getProfileSettings,
  getSubscriptionSettings,
  saveSubscriptionSettings,
} from './manager-settings-store';

const premiumBenefits = [
  'Không giới hạn hồ sơ thú cưng và khách hàng',
  'CRM nâng cao với phân tầng khách hàng tự động',
  'Smart Reminders đa kênh (Email/SMS)',
  'Digital Pet Card nâng cao + xuất ảnh chuẩn',
  'Báo cáo vận hành và doanh thu chi tiết',
  'Hỗ trợ ưu tiên 24/7',
];

type UpgradePhase = 'idle' | 'waiting' | 'confirmed';

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0));
}

function resolveQrValue(checkout: ApiPayosLinkResponse | null): string | null {
  if (!checkout) {
    return null;
  }
  return checkout.qrCode ?? checkout.checkoutUrl;
}

export function ManagerUpgradePremiumPage() {
  const navigate = useNavigate();
  const clinic = getClinicSettings();
  const profile = getProfileSettings();
  const initialSubscription = getSubscriptionSettings();
  const [checkout, setCheckout] = useState<ApiPayosLinkResponse | null>(null);
  const [phase, setPhase] = useState<UpgradePhase>(
    initialSubscription.plan === 'premium' ? 'confirmed' : 'idle',
  );
  const [loadingLink, setLoadingLink] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(
    initialSubscription.plan === 'premium' ? 'Bạn đang sử dụng gói Premium.' : '',
  );
  const [error, setError] = useState('');
  const confirmedRef = useRef(initialSubscription.plan === 'premium');
  const redirectTimerRef = useRef<number | null>(null);
  const autoStartedRef = useRef(false);

  const amount = Number(initialSubscription.amount ?? 249000);
  const qrValue = useMemo(() => resolveQrValue(checkout), [checkout]);

  const confirmPaidAndRedirect = useCallback(
    (snapshot?: ApiPayosTransactionStatusResponse) => {
      if (confirmedRef.current) {
        return;
      }
      confirmedRef.current = true;
      setPhase('confirmed');
      setChecking(false);
      setError('');
      setMessage('Thanh toán nâng cấp đã được xác nhận. Đang quay lại Gói & thanh toán...');

      const current = getSubscriptionSettings();
      saveSubscriptionSettings({
        ...current,
        plan: 'premium',
        amount: Number(snapshot?.amount ?? checkout?.amount ?? amount),
        currency: 'VND',
        billingCycle: 'monthly',
        paymentMethod: 'payos',
        petCount: Number(current.petCount ?? 0),
      });

      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/manager/settings?tab=subscription', { replace: true });
      }, 1500);
    },
    [amount, checkout?.amount, navigate],
  );

  const syncTransactionStatus = useCallback(
    async (orderCode: string, source: 'poll' | 'realtime') => {
      const snapshot = await getPayosTransactionStatus(orderCode);
      if (snapshot.status === 'paid') {
        confirmPaidAndRedirect(snapshot);
      } else if (source === 'realtime') {
        setMessage('Đã nhận tín hiệu realtime, đang chờ ngân hàng xác nhận hoàn tất...');
      } else {
        setMessage('Đang chờ thanh toán nâng cấp từ ngân hàng...');
      }
      return snapshot;
    },
    [confirmPaidAndRedirect],
  );

  const createCheckout = useCallback(async () => {
    if (loadingLink || confirmedRef.current) {
      return;
    }

    setLoadingLink(true);
    setError('');
    setMessage('Đang tạo phiên thanh toán Premium...');
    try {
      const payment = await createPayosPaymentLink({
        amount,
        description: 'Nang cap Premium PETHUB',
        returnUrl: `${window.location.origin}/manager/settings/upgrade-premium?payment=success`,
        cancelUrl: `${window.location.origin}/manager/settings/upgrade-premium?payment=cancel`,
      });
      setCheckout(payment);
      setPhase('waiting');
      setMessage('Đang chờ thanh toán nâng cấp từ ngân hàng...');
    } catch (apiError) {
      setError(extractApiError(apiError));
      setMessage('');
    } finally {
      setLoadingLink(false);
    }
  }, [amount, loadingLink]);

  useEffect(() => {
    if (phase !== 'idle' || initialSubscription.plan === 'premium' || autoStartedRef.current) {
      return;
    }
    autoStartedRef.current = true;
    void createCheckout();
  }, [createCheckout, initialSubscription.plan, phase]);

  useEffect(() => {
    if (phase !== 'waiting' || !checkout?.orderCode || confirmedRef.current) {
      return;
    }

    let active = true;
    const poll = async () => {
      if (!active || confirmedRef.current) {
        return;
      }
      setChecking(true);
      try {
        await syncTransactionStatus(checkout.orderCode, 'poll');
      } catch (apiError) {
        if (!active) {
          return;
        }
        setError((prev) => prev || extractApiError(apiError));
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    const timer = window.setInterval(() => {
      void poll();
    }, 3000);

    void poll();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [checkout?.orderCode, phase, syncTransactionStatus]);

  useEffect(() => {
    if (phase !== 'waiting' || !checkout?.orderCode || confirmedRef.current) {
      return;
    }

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

      const onSubscriptionUpdated = (event: {
        type?: string;
        orderCode?: string;
      }) => {
        if (!event?.orderCode || event.orderCode !== checkout.orderCode) {
          return;
        }

        setMessage('Nhận tín hiệu realtime: đang xác minh thanh toán nâng cấp...');
        void syncTransactionStatus(checkout.orderCode, 'realtime').catch(() => undefined);
      };

      socket.on('subscription.updated', onSubscriptionUpdated);
      cleanup = () => {
        socket.off('subscription.updated', onSubscriptionUpdated);
        socket.disconnect();
      };
    };

    void setupRealtime();
    return () => {
      active = false;
      cleanup?.();
    };
  }, [checkout?.orderCode, phase, syncTransactionStatus]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <Link
          to='/manager/settings?tab=subscription'
          className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại gói thanh toán
        </Link>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <section className='bg-white border border-[#592518] rounded-2xl p-6'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d56756]/10 border border-[#d56756]/40 text-[#d56756] text-xs mb-4'>
            <ShieldCheck className='w-3.5 h-3.5' />
            Premium Plan
          </div>
          <h1 className='text-3xl text-[#592518]' style={{ fontWeight: 700 }}>
            Nâng cấp lên Premium
          </h1>
          <p className='text-sm text-[#8b6a61] mt-2'>
            Mở khóa toàn bộ bộ công cụ vận hành theo chuẩn quốc tế cho phòng khám và pet shop.
          </p>

          <div className='mt-6 space-y-3'>
            {premiumBenefits.map((item) => (
              <div key={item} className='flex items-start gap-2 text-sm text-[#592518]'>
                <CheckCircle2 className='w-4 h-4 text-[#d56756] mt-0.5 flex-shrink-0' />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className='bg-white border border-[#592518] rounded-2xl p-6'>
          <h2 className='text-xl text-[#592518]' style={{ fontWeight: 700 }}>
            Thanh toán nâng cấp Premium
          </h2>
          <p className='text-xs text-[#8b6a61] mt-1'>Chu kỳ thanh toán: Hàng tháng • Giá đã gồm VAT</p>

          <div className='mt-4 p-4 rounded-xl border border-[#592518]/20 bg-[#f6eee7]'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-[#8b6a61]'>Gói Premium</span>
              <span className='text-lg text-[#592518]' style={{ fontWeight: 700 }}>
                {formatVnd(amount)}đ
              </span>
            </div>
            <div className='mt-3 pt-3 border-t border-[#592518]/20 flex items-center justify-between'>
              <span className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                Tổng thanh toán
              </span>
              <span className='text-2xl text-[#592518]' style={{ fontWeight: 700 }}>
                {formatVnd(amount)}đ
              </span>
            </div>
          </div>

          <div className='mt-4 border border-[#592518]/15 rounded-xl p-4 bg-[#faf8f5]'>
            <div className='flex items-center gap-2 text-xs text-[#592518]' style={{ fontWeight: 700 }}>
              <QrCode className='w-4 h-4' />
              Quét mã để thanh toán
            </div>
            <div className='mt-3 flex items-start gap-4 flex-wrap'>
              {checkout ? (
                <>
                  {qrValue?.startsWith('http') || qrValue?.startsWith('data:image') ? (
                    <img src={qrValue} alt='QR thanh toán Premium' className='w-32 h-32 object-contain rounded-lg border border-[#592518]/20 bg-white p-2' />
                  ) : qrValue ? (
                    <div className='w-32 h-32 rounded-lg border border-[#592518]/20 bg-white p-2 flex items-center justify-center'>
                      <QRCodeSVG value={qrValue} size={112} />
                    </div>
                  ) : (
                    <div className='w-32 h-32 rounded-lg border border-dashed border-[#592518]/20 bg-white flex items-center justify-center text-[11px] text-[#8b6a61] text-center px-2'>
                      Chưa có QR thanh toán
                    </div>
                  )}
                  <div className='min-w-[220px] text-xs space-y-1 text-[#592518] font-mono'>
                    <p>
                      <span className='text-[#8b6a61]'>Nguồn:</span> Chuyển khoản QR
                    </p>
                    <p>
                      <span className='text-[#8b6a61]'>Mã giao dịch:</span> {checkout.orderCode}
                    </p>
                    <p>
                      <span className='text-[#8b6a61]'>Số tiền:</span> {formatVnd(checkout.amount)} VND
                    </p>
                    <a
                      href={checkout.checkoutUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 text-[#d56756] underline'
                    >
                      Mở liên kết thanh toán
                      <ExternalLink className='w-3.5 h-3.5' />
                    </a>
                  </div>
                </>
              ) : (
                <div className='w-full rounded-lg border border-dashed border-[#592518]/20 bg-white px-3 py-4 text-xs text-[#8b6a61]'>
                  Hệ thống đang chuẩn bị phiên thanh toán Premium...
                </div>
              )}
            </div>
          </div>

          <div className='mt-4 p-3 rounded-xl border border-[#592518]/15 bg-white text-xs text-[#8b6a61]'>
            Hệ thống sẽ kích hoạt Premium ngay sau khi ngân hàng xác nhận thanh toán cho tài khoản quản lý{' '}
            <span className='text-[#592518]' style={{ fontWeight: 600 }}>
              {profile.name}
            </span>{' '}
            tại{' '}
            <span className='text-[#592518]' style={{ fontWeight: 600 }}>
              {clinic.name}
            </span>
            .
          </div>

          {message ? (
            <div className='mt-4 rounded-xl border border-[#592518]/15 bg-[#f8f6f2] p-3 text-xs text-[#592518]'>
              <div className='flex items-center gap-2'>
                {(loadingLink || checking) && phase !== 'confirmed' ? (
                  <Loader2 className='w-4 h-4 animate-spin text-[#d56756]' />
                ) : phase === 'confirmed' ? (
                  <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                ) : (
                  <QrCode className='w-4 h-4 text-[#d56756]' />
                )}
                <span>{message}</span>
              </div>
              {phase === 'waiting' ? (
                <p className='mt-2 text-[11px] text-[#8b6a61]'>Đang kiểm tra trạng thái thanh toán mỗi 3 giây...</p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className='mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='w-4 h-4 mt-0.5' />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <button
            type='button'
            onClick={() => {
              if (phase !== 'confirmed') {
                void createCheckout();
              }
            }}
            disabled={loadingLink || checking || phase === 'waiting' || phase === 'confirmed'}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#592518] text-sm transition-all ${
              phase === 'confirmed'
                ? 'bg-emerald-600 text-white'
                : loadingLink || checking || phase === 'waiting'
                  ? 'bg-[#592518] text-white cursor-not-allowed'
                  : 'bg-[#d56756] text-white hover:-translate-y-0.5'
            }`}
            style={{ fontWeight: 700 }}
          >
            {phase === 'confirmed' ? (
              <>
                <CheckCircle2 className='w-4 h-4' />
                Nâng cấp thành công!
              </>
            ) : loadingLink ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Đang tạo mã thanh toán...
              </>
            ) : phase === 'waiting' ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Đang chờ thanh toán nâng cấp từ ngân hàng...
              </>
            ) : (
              'Tạo lại mã thanh toán'
            )}
          </button>
        </section>
      </div>
    </div>
  );
}

