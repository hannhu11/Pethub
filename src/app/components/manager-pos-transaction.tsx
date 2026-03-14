import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, QrCode, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router';
import { getInvoiceById, type InvoiceDetailsResponse } from '../lib/pethub-api';
import { extractApiError } from '../lib/api-client';

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

export function ManagerPosTransactionStatusPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<InvoiceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
        setPayload(data);
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
  }, [invoiceId]);

  useEffect(() => {
    if (!payload?.invoice || !invoiceId) {
      return;
    }
    if (payload.invoice.paymentStatus === 'paid') {
      window.sessionStorage.removeItem('pethub:last-pos-checkout');
      setMessage('payOS đã xác nhận giao dịch. Đang chuyển sang trang in hóa đơn...');
      const timer = window.setTimeout(() => {
        navigate(`/manager/invoice/${payload.invoice.id}`, { replace: true });
      }, 700);
      return () => window.clearTimeout(timer);
    }

    if (!payload.paymentAction) {
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
        setPayload(latest);
        if (latest.invoice.paymentStatus === 'paid') {
          setChecking(false);
        }
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
  }, [invoiceId, navigate, payload?.invoice.id, payload?.invoice.paymentStatus, payload?.paymentAction]);

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
          {checking && invoice.paymentStatus !== 'paid' ? (
            <p className='text-xs text-[#7a756e] mt-3'>Đang kiểm tra webhook payOS mỗi 3 giây...</p>
          ) : null}
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
