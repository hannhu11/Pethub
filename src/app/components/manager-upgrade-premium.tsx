import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, LoaderCircle, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
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

type LocalPaymentMethod = 'vietqr' | 'momo' | 'zalopay';

const paymentMethods: Array<{ id: LocalPaymentMethod; label: string; helper: string }> = [
  {
    id: 'vietqr',
    label: 'VietQR (Khuyên dùng)',
    helper: 'Quét mã từ app ngân hàng (Vietcombank, Techcombank, BIDV, MB...)',
  },
  {
    id: 'momo',
    label: 'Ví MoMo',
    helper: 'Thanh toán nhanh bằng ví điện tử MoMo',
  },
  {
    id: 'zalopay',
    label: 'ZaloPay',
    helper: 'Thanh toán QR bằng ZaloPay',
  },
];

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function ManagerUpgradePremiumPage() {
  const navigate = useNavigate();
  const clinic = getClinicSettings();
  const profile = getProfileSettings();
  const subscription = getSubscriptionSettings();
  const [selectedMethod, setSelectedMethod] = useState<LocalPaymentMethod>('vietqr');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(subscription.plan === 'premium');

  const amount = subscription.amount;
  const memo = useMemo(() => {
    const digits = profile.phone.replace(/\D/g, '');
    const suffix = digits.slice(-6) || '000000';
    return `PETHUB-${suffix}`;
  }, [profile.phone]);

  const paymentDetails = useMemo(() => {
    if (selectedMethod === 'momo') {
      return {
        title: 'MoMo Business',
        accountLabel: 'SĐT MoMo',
        accountValue: '0901 999 000',
        owner: 'PETHUB SOFTWARE',
        bank: 'Ví MoMo',
      };
    }

    if (selectedMethod === 'zalopay') {
      return {
        title: 'ZaloPay Business',
        accountLabel: 'Merchant ID',
        accountValue: 'PETHUB-ZLP-2026',
        owner: 'PETHUB SOFTWARE',
        bank: 'Ví ZaloPay',
      };
    }

    return {
      title: 'VietQR Ngân hàng',
      accountLabel: 'Số TK',
      accountValue: '1900 2026 8888',
      owner: 'PETHUB SOFTWARE',
      bank: 'Vietcombank',
    };
  }, [selectedMethod]);

  const handleConfirmPayment = () => {
    if (submitting || success) return;

    setSubmitting(true);
    window.setTimeout(() => {
      saveSubscriptionSettings({
        plan: 'premium',
        amount,
        currency: 'VND',
        billingCycle: 'monthly',
        paymentMethod: selectedMethod,
        activatedAt: formatDate(new Date()),
      });
      setSubmitting(false);
      setSuccess(true);
      window.setTimeout(() => {
        navigate('/manager/settings?tab=subscription', { replace: true });
      }, 1100);
    }, 3000);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <Link
          to='/manager/settings?tab=subscription'
          className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại gói thanh toán
        </Link>
        <p className='text-xs text-[#7a756e]'>Mô phỏng thanh toán chuẩn Việt Nam (VietQR/MoMo/ZaloPay), chưa nối API thật.</p>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <section className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6b8f5e]/10 border border-[#6b8f5e]/40 text-[#6b8f5e] text-xs mb-4'>
            <ShieldCheck className='w-3.5 h-3.5' />
            Premium Plan
          </div>
          <h1 className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Nâng cấp lên Premium
          </h1>
          <p className='text-sm text-[#7a756e] mt-2'>
            Mở khóa toàn bộ bộ công cụ vận hành theo chuẩn quốc tế cho phòng khám và pet shop.
          </p>

          <div className='mt-6 space-y-3'>
            {premiumBenefits.map((item) => (
              <div key={item} className='flex items-start gap-2 text-sm text-[#2d2a26]'>
                <CheckCircle2 className='w-4 h-4 text-[#6b8f5e] mt-0.5 flex-shrink-0' />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
          <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Checkout Premium
          </h2>
          <p className='text-xs text-[#7a756e] mt-1'>Chu kỳ thanh toán: Hàng tháng • Giá đã gồm VAT</p>

          <div className='mt-4 p-4 rounded-xl border border-[#2d2a26]/20 bg-[#f5f0eb]'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-[#7a756e]'>Gói Premium</span>
              <span className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {formatVnd(amount)}đ
              </span>
            </div>
            <div className='mt-3 pt-3 border-t border-[#2d2a26]/20 flex items-center justify-between'>
              <span className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>
                Tổng thanh toán
              </span>
              <span className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {formatVnd(amount)}đ
              </span>
            </div>
          </div>

          <div className='mt-4 grid sm:grid-cols-3 gap-2'>
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type='button'
                onClick={() => setSelectedMethod(method.id)}
                className={`px-3 py-2 rounded-xl border text-xs text-left transition-all ${
                  selectedMethod === method.id
                    ? 'bg-[#6b8f5e] text-white border-[#2d2a26]'
                    : 'bg-white text-[#2d2a26] border-[#2d2a26]/20 hover:bg-[#f0ede8]'
                }`}
                style={{ fontWeight: 600 }}
              >
                {method.label}
              </button>
            ))}
          </div>
          <p className='text-[11px] text-[#7a756e] mt-2'>
            {paymentMethods.find((method) => method.id === selectedMethod)?.helper}
          </p>

          <div className='mt-4 border border-[#2d2a26]/15 rounded-xl p-4 bg-[#faf9f6]'>
            <p className='text-xs text-[#2d2a26]' style={{ fontWeight: 600 }}>
              Quét mã để thanh toán
            </p>
            <div className='mt-3 flex items-start gap-4 flex-wrap'>
              <div className='inline-flex items-center justify-center w-28 h-28 rounded-lg border border-[#2d2a26]/20 bg-white p-2'>
                <QRCodeSVG
                  value={`PAYMENT|PETHUB_PREMIUM|METHOD:${selectedMethod}|AMOUNT:${amount}|MEMO:${memo}`}
                  size={96}
                  level='M'
                />
              </div>
              <div className='min-w-[220px] text-xs space-y-1 text-[#2d2a26] font-mono'>
                <p>
                  <span className='text-[#7a756e]'>Nguồn:</span> {paymentDetails.title}
                </p>
                <p>
                  <span className='text-[#7a756e]'>Ngân hàng/Ví:</span> {paymentDetails.bank}
                </p>
                <p>
                  <span className='text-[#7a756e]'>{paymentDetails.accountLabel}:</span> {paymentDetails.accountValue}
                </p>
                <p>
                  <span className='text-[#7a756e]'>Chủ TK:</span> {paymentDetails.owner}
                </p>
                <p>
                  <span className='text-[#7a756e]'>Số tiền:</span> {formatVnd(amount)} VND
                </p>
                <p>
                  <span className='text-[#7a756e]'>Nội dung:</span> {memo}
                </p>
              </div>
            </div>
          </div>

          <div className='mt-4 p-3 rounded-xl border border-[#2d2a26]/15 bg-white text-xs text-[#7a756e]'>
            Hệ thống sẽ kích hoạt ngay sau khi xác nhận chuyển khoản thành công cho tài khoản quản lý{' '}
            <span className='text-[#2d2a26]' style={{ fontWeight: 600 }}>
              {profile.name}
            </span>{' '}
            tại{' '}
            <span className='text-[#2d2a26]' style={{ fontWeight: 600 }}>
              {clinic.name}
            </span>
            .
          </div>

          <button
            type='button'
            onClick={handleConfirmPayment}
            disabled={submitting || success}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2d2a26] text-sm transition-all ${
              success
                ? 'bg-emerald-600 text-white'
                : submitting
                  ? 'bg-[#2d2a26] text-white'
                  : 'bg-[#6b8f5e] text-white hover:-translate-y-0.5'
            }`}
            style={{ fontWeight: 700 }}
          >
            {submitting ? <LoaderCircle className='w-4 h-4 animate-spin' /> : <Wallet className='w-4 h-4' />}
            {success ? 'Nâng cấp thành công!' : submitting ? 'Đang xác nhận thanh toán...' : 'Tôi đã chuyển khoản'}
          </button>
        </section>
      </div>
    </div>
  );
}
