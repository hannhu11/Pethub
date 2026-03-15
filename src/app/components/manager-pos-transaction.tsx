import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CircleCheck, ExternalLink, Loader2, QrCode, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router';
import { getInvoiceById, type InvoiceDetailsResponse } from '../lib/pethub-api';
import { extractApiError } from '../lib/api-client';
import { connectRealtimeSocket } from '../lib/realtime';

function formatCurrency(value: number | string) {
  const normalized = Number(value ?? 0);
  return `${Math.round(normalized).toLocaleString('vi-VN')} ₫`;
}

function resolveQrValue(payload: InvoiceDetailsResponse | null): string | null {
  if (!payload?.paymentAction) {
    return null;
  }
  return payload.paymentAction.qrCode ?? payload.paymentAction.checkoutUrl;
}

type ConfirmedBy = 'realtime' | 'poll-safe' | null;
type TransactionPhase = 'waiting' | 'confirmed';
type SnapshotSource = 'initial' | 'poll' | 'realtime';

export function ManagerPosTransactionStatusPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<InvoiceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<TransactionPhase>('waiting');
  const [confirmedBy, setConfirmedBy] = useState<ConfirmedBy>(null);
  const [hasObservedUnpaid, setHasObservedUnpaid] = useState(false);
  const [consecutivePaidAfterUnpaid, setConsecutivePaidAfterUnpaid] = useState(0);
  const [earlyPaidGuardActive, setEarlyPaidGuardActive] = useState(false);

  const hasObservedUnpaidRef = useRef(false);
  const confirmedRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  const markObservedUnpaid = useCallback(() => {
    if (!hasObservedUnpaidRef.current) {
      hasObservedUnpaidRef.current = true;
      setHasObservedUnpaid(true);
    }
    setConsecutivePaidAfterUnpaid(0);
    setEarlyPaidGuardActive(false);
  }, []);

  const confirmPaidAndRedirect = useCallback(
    (by: Exclude<ConfirmedBy, null>, targetInvoiceId: string) => {
      if (confirmedRef.current) {
        return;
      }
      confirmedRef.current = true;
      setPhase('confirmed');
      setConfirmedBy(by);
      setChecking(false);
      setEarlyPaidGuardActive(false);
      setMessage('payOS đã xác nhận giao dịch. Đang chuyển sang trang in hóa đơn...');
      window.sessionStorage.removeItem('pethub:last-pos-checkout');
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = window.setTimeout(() => {
        navigate(`/manager/pos/receipt/${targetInvoiceId}`, { replace: true });
      }, 1500);
    },
    [navigate],
  );

  const applySnapshot = useCallback(
    (snapshot: InvoiceDetailsResponse, source: SnapshotSource) => {
      setPayload(snapshot);
      const status = snapshot.invoice.paymentStatus;

      if (status !== 'paid') {
        markObservedUnpaid();
        if (!confirmedRef.current) {
          setPhase('waiting');
          setConfirmedBy(null);
          setMessage((prev) => (prev.startsWith('Đang chờ xác minh bổ sung') ? '' : prev));
        }
        return;
      }

      if (source === 'realtime') {
        confirmPaidAndRedirect('realtime', snapshot.invoice.id);
        return;
      }

      if (!hasObservedUnpaidRef.current) {
        setEarlyPaidGuardActive(true);
        setConsecutivePaidAfterUnpaid(0);
        if (!confirmedRef.current) {
          setMessage('Đang chờ xác minh bổ sung trước khi chốt hóa đơn.');
        }
        return;
      }

      setEarlyPaidGuardActive(false);
      if (source === 'poll') {
        setConsecutivePaidAfterUnpaid((prev) => {
          const next = prev + 1;
          if (next >= 2) {
            confirmPaidAndRedirect('poll-safe', snapshot.invoice.id);
          }
          return next;
        });
      }
    },
    [confirmPaidAndRedirect, markObservedUnpaid],
  );

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!invoiceId) {
      return;
    }
    const raw = window.sessionStorage.getItem('pethub:last-pos-checkout');
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as
        | { result?: { invoiceId?: string; paymentStatus?: 'unpaid' | 'paid' | 'refunded'; paymentAction?: unknown } }
        | { invoiceId?: string; paymentStatus?: 'unpaid' | 'paid' | 'refunded'; paymentAction?: unknown };
      const result = parsed && 'result' in parsed ? parsed.result : parsed;
      if (
        result?.invoiceId === invoiceId &&
        result.paymentAction &&
        result.paymentStatus &&
        result.paymentStatus !== 'paid'
      ) {
        hasObservedUnpaidRef.current = true;
        setHasObservedUnpaid(true);
      }
    } catch {
      // ignore malformed session snapshot
    }
  }, [invoiceId]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!invoiceId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getInvoiceById(invoiceId);
        if (!mounted) {
          return;
        }
        applySnapshot(data, 'initial');
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [applySnapshot, invoiceId]);

  useEffect(() => {
    if (!invoiceId || !payload?.paymentAction || phase === 'confirmed') {
      return;
    }

    let mounted = true;
    setChecking(true);

    const poll = async () => {
      try {
        const latest = await getInvoiceById(invoiceId);
        if (!mounted) {
          return;
        }
        setChecking(true);
        applySnapshot(latest, 'poll');
      } catch {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    const timer = window.setInterval(() => {
      void poll();
    }, 3000);

    void poll();

    return () => {
      mounted = false;
      setChecking(false);
      window.clearInterval(timer);
    };
  }, [applySnapshot, invoiceId, payload?.paymentAction, phase]);

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
      if (!active || !socket || !invoiceId) {
        return;
      }

      const onInvoicePaymentUpdated = (event: {
        invoiceId?: string;
        paymentStatus?: 'paid' | 'unpaid' | 'refunded';
      }) => {
        if (!event?.invoiceId || event.invoiceId !== invoiceId) {
          return;
        }

        if (event.paymentStatus === 'paid') {
          setMessage('Nhận tín hiệu realtime: đang xác nhận thanh toán...');
          void getInvoiceById(invoiceId)
            .then((latest) => {
              if (latest.invoice.paymentStatus === 'paid') {
                applySnapshot(latest, 'realtime');
              }
            })
            .catch(() => undefined);
        }
      };

      socket.on('invoice.payment.updated', onInvoicePaymentUpdated);
      cleanup = () => {
        socket.off('invoice.payment.updated', onInvoicePaymentUpdated);
        socket.disconnect();
      };
    };

    void setupRealtime();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [applySnapshot, invoiceId]);

  if (loading) {
    return <div className='text-sm text-[#7a756e]'>Đang tải trạng thái giao dịch...</div>;
  }

  if (!payload?.invoice) {
    return (
      <div className='space-y-4'>
        <button
          type='button'
          onClick={() => navigate('/manager/pos')}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại POS
        </button>
        <div className='rounded-2xl border border-[#2d2a26] bg-white p-6 text-sm text-[#7a756e]'>
          Không tìm thấy giao dịch cần theo dõi.
        </div>
      </div>
    );
  }

  const invoice = payload.invoice;
  const paymentAction = payload.paymentAction;
  const qrValue = resolveQrValue(payload);

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Trạng thái giao dịch POS
          </h1>
          <p className='text-sm text-[#7a756e] mt-1'>Theo dõi realtime thanh toán chuyển khoản và tự động chuyển sang hóa đơn khi đã thu tiền.</p>
        </div>
        <button
          type='button'
          onClick={() => navigate('/manager/pos')}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại POS
        </button>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
      ) : null}

      <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5'>
        <div className='rounded-2xl border border-[#2d2a26] bg-white p-5'>
          <div className='flex items-center gap-2 text-[#2d2a26]'>
            <Receipt className='w-4 h-4' />
            <p className='text-sm' style={{ fontWeight: 700 }}>
              THÔNG TIN HÓA ĐƠN
            </p>
          </div>
          <div className='mt-4 space-y-2 text-sm'>
            <p>
              Hóa đơn: <span style={{ fontWeight: 600 }}>{invoice.invoiceNo}</span>
            </p>
            <p>
              Khách hàng: <span style={{ fontWeight: 600 }}>{invoice.customer.name}</span> ({invoice.customer.phone})
            </p>
            <p>
              Tổng thanh toán: <span style={{ fontWeight: 700 }}>{formatCurrency(invoice.grandTotal)}</span>
            </p>
            <p>
              Trạng thái:{' '}
              <span
                className={invoice.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}
                style={{ fontWeight: 700 }}
              >
                {invoice.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
              </span>
            </p>
          </div>
          <div className='mt-4 rounded-xl border border-[#2d2a26]/10 bg-[#f8f6f2] p-3'>
            {phase === 'confirmed' ? (
              <div className='flex items-center gap-2 text-sm text-emerald-700'>
                <CircleCheck className='w-4 h-4' />
                <span style={{ fontWeight: 600 }}>payOS đã xác nhận. Đang chuyển sang trang in hóa đơn...</span>
              </div>
            ) : (
              <div className='flex items-center gap-2 text-sm text-[#7a756e]'>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Đang chờ thanh toán từ ngân hàng...</span>
              </div>
            )}
            {earlyPaidGuardActive ? (
              <div className='mt-2 flex items-start gap-2 text-xs text-amber-700'>
                <AlertTriangle className='w-3.5 h-3.5 mt-0.5' />
                <span>Đang chờ xác minh bổ sung trước khi chốt hóa đơn.</span>
              </div>
            ) : null}
            {phase === 'waiting' && checking ? (
              <p className='text-xs text-[#7a756e] mt-2'>Đang kiểm tra webhook payOS mỗi 3 giây...</p>
            ) : null}
            {phase === 'confirmed' && confirmedBy ? (
              <p className='text-xs text-[#7a756e] mt-2'>
                Nguồn xác nhận: {confirmedBy === 'realtime' ? 'Realtime signal' : 'Polling an toàn'}.
              </p>
            ) : null}
            {phase === 'waiting' && hasObservedUnpaid ? (
              <p className='text-xs text-[#7a756e] mt-2'>Đã ghi nhận trạng thái chờ thanh toán, đang theo dõi xác nhận...</p>
            ) : null}
            {phase === 'waiting' && consecutivePaidAfterUnpaid > 0 ? (
              <p className='text-xs text-[#7a756e] mt-1'>
                Đang xác thực an toàn: {consecutivePaidAfterUnpaid}/2 nhịp xác nhận đã thu tiền.
              </p>
            ) : null}
          </div>
        </div>

        <div className='rounded-2xl border border-[#2d2a26] bg-white p-5'>
          <div className='flex items-center gap-2 text-[#2d2a26]'>
            <QrCode className='w-4 h-4' />
            <p className='text-sm' style={{ fontWeight: 700 }}>
              QR / LINK THANH TOÁN
            </p>
          </div>
          {paymentAction ? (
            <div className='mt-4 flex flex-col items-center gap-3'>
              {qrValue?.startsWith('http') || qrValue?.startsWith('data:image') ? (
                <img
                  src={qrValue}
                  alt='payOS QR'
                  className='w-52 h-52 object-contain border border-[#2d2a26]/10 rounded-lg p-2 bg-white'
                />
              ) : qrValue ? (
                <div className='w-56 h-56 border border-[#2d2a26]/10 rounded-lg p-2 bg-white flex items-center justify-center'>
                  <QRCodeSVG value={qrValue} size={200} />
                </div>
              ) : (
                <div className='w-52 h-52 border border-dashed border-[#2d2a26]/20 rounded-lg flex items-center justify-center text-xs text-[#7a756e]'>
                  Chưa có QR từ payOS
                </div>
              )}
              <a
                href={paymentAction.checkoutUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-sm text-[#6b8f5e] underline'
              >
                <ExternalLink className='w-4 h-4' />
                Mở link thanh toán payOS
              </a>
            </div>
          ) : (
            <p className='text-sm text-[#7a756e] mt-4'>
              Giao dịch này không dùng QR payOS. Nếu đã thanh toán tiền mặt/thẻ, hệ thống sẽ chuyển thẳng sang hóa đơn.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
