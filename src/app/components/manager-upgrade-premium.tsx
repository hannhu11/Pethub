import { ArrowLeft, CheckCircle2, CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

const premiumBenefits = [
  'Không giới hạn hồ sơ thú cưng và khách hàng',
  'CRM nâng cao với phân tầng khách hàng tự động',
  'Smart Reminders đa kênh (Email/SMS)',
  'Digital Pet Card nâng cao + xuất ảnh chuẩn',
  'Báo cáo vận hành và doanh thu chi tiết',
  'Hỗ trợ ưu tiên 24/7',
];

export function ManagerUpgradePremiumPage() {
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
        <p className='text-xs text-[#7a756e]'>Môi trường mock frontend, chưa kết nối cổng thanh toán thật.</p>
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
          <p className='text-xs text-[#7a756e] mt-1'>Chu kỳ thanh toán: Hàng tháng</p>

          <div className='mt-5 p-4 rounded-xl border border-[#2d2a26]/20 bg-[#f5f0eb]'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-[#7a756e]'>Gói Premium</span>
              <span className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                249.000đ
              </span>
            </div>
            <div className='flex items-center justify-between mt-2 text-sm'>
              <span className='text-[#7a756e]'>VAT (8%)</span>
              <span className='text-[#2d2a26]'>19.920đ</span>
            </div>
            <div className='mt-3 pt-3 border-t border-[#2d2a26]/20 flex items-center justify-between'>
              <span className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>Tổng thanh toán</span>
              <span className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                268.920đ
              </span>
            </div>
          </div>

          <div className='mt-5 space-y-3'>
            <label className='block text-xs text-[#7a756e]'>Số thẻ (mock)</label>
            <input
              className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white'
              placeholder='4242 4242 4242 4242'
            />
            <div className='grid grid-cols-2 gap-3'>
              <input className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white' placeholder='MM/YY' />
              <input className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white' placeholder='CVC' />
            </div>
            <button
              type='button'
              className='w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all text-sm'
              style={{ fontWeight: 700 }}
            >
              <CreditCard className='w-4 h-4' />
              Xác nhận thanh toán
            </button>
          </div>

          <div className='mt-5 border border-[#2d2a26]/15 rounded-xl p-4 bg-[#faf9f6]'>
            <p className='text-xs text-[#7a756e] mb-2'>Hoặc thanh toán bằng QR chuyển khoản</p>
            <div className='inline-flex items-center justify-center w-20 h-20 rounded-lg border border-[#2d2a26]/20 bg-white'>
              <QrCode className='w-9 h-9 text-[#2d2a26]/70' />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
