import { Link } from 'react-router';
import { Check, Sparkles, ShieldCheck, HeartHandshake, BookOpenText, Phone, FileText, Shield, LifeBuoy } from 'lucide-react';
import { BackButton } from './back-button';
import { pricingPlanDefinitions } from '../constants/pricing';

export function PricingPage() {
  const pricingCards = pricingPlanDefinitions;

  return (
    <div className='py-16 md:py-20'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
            Bảng giá PetHub
          </h1>
          <p className='text-[#8b6a61] max-w-2xl mx-auto'>
            Chọn đúng gói cho quy mô pet shop hoặc phòng khám của bạn. Professional phù hợp để vận hành đầy đủ, Enterprise dành cho chuỗi và nhu cầu tùy chỉnh sâu.
          </p>
        </div>

        <div className='grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
          {pricingCards.map((plan) => {
            const isHighlight = Boolean(plan.highlight);
            const ctaTo = plan.contactOnly ? '/contact' : '/register';

            return (
              <article
                key={plan.code}
                className={`relative rounded-[2rem] border p-8 shadow-[0_18px_38px_rgba(89,37,24,0.08)] ${
                  isHighlight
                    ? 'border-[#592518] bg-[#d56756] text-white shadow-[0_24px_48px_rgba(213,103,86,0.24)]'
                    : 'border-[#ead9d1] bg-white text-[#592518]'
                }`}
              >
                {isHighlight ? (
                  <div className='absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#592518] bg-[#23466d] px-4 py-1 text-xs text-white'>
                    <Sparkles className='w-3.5 h-3.5' />
                    Phổ biến nhất
                  </div>
                ) : null}
                <h2 className='text-3xl mb-2' style={{ fontWeight: 700 }}>{plan.title}</h2>
                <p className={`text-sm mb-6 ${isHighlight ? 'text-white/85' : 'text-[#8b6a61]'}`}>{plan.tagline}</p>
                <p className={`mb-6 ${plan.contactOnly ? 'text-[#d56756]' : ''}`} style={{ fontWeight: 700 }}>
                  <span className='text-5xl'>{plan.priceLabel}</span>
                  {plan.priceSuffix ? <span className={`ml-2 text-xl ${isHighlight ? 'text-white/85' : 'text-[#8b6a61]'}`}>{plan.priceSuffix}</span> : null}
                </p>
                <ul className='space-y-3 text-sm'>
                  {plan.features.map((item) => (
                    <li key={item} className='flex items-start gap-3'>
                      <span className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${isHighlight ? 'bg-white/20' : 'bg-[#f7ebe6]'}`}>
                        <Check className={`w-3.5 h-3.5 ${isHighlight ? 'text-white' : 'text-[#d56756]'}`} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaTo}
                  className={`mt-8 inline-flex w-full justify-center rounded-2xl border px-5 py-3 transition-all hover:-translate-y-0.5 ${
                    isHighlight
                      ? 'border-[#592518] bg-white text-[#d56756]'
                      : 'border-[#592518] bg-[#d56756] text-white'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {plan.contactOnly ? 'Liên hệ tư vấn' : plan.code === 'starter' ? 'Đăng ký Starter' : 'Đăng ký Professional'}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className='py-16 md:py-20'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl'>
          <h1 className='text-4xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
            Về chúng tôi
          </h1>
          <p className='text-[#8b6a61] leading-7'>
            PetHub được xây dựng để giúp chủ pet clinic và pet store vận hành tự tin hơn mỗi ngày: lịch hẹn rõ ràng, chăm sóc khách hàng nhất quán
            và tăng trưởng doanh thu dựa trên dữ liệu thực tế.
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-5 mt-10'>
          <div className='bg-white border border-[#592518] rounded-2xl p-5'>
            <ShieldCheck className='w-6 h-6 text-[#d56756] mb-3' />
            <h2 className='text-lg mb-2' style={{ fontWeight: 700 }}>Vận hành chuẩn hóa</h2>
            <p className='text-sm text-[#8b6a61]'>Từ tiếp nhận khách, đặt lịch, chăm sóc đến thanh toán đều theo một luồng rõ ràng và dễ kiểm soát.</p>
          </div>
          <div className='bg-white border border-[#592518] rounded-2xl p-5'>
            <HeartHandshake className='w-6 h-6 text-[#c75b4c] mb-3' />
            <h2 className='text-lg mb-2' style={{ fontWeight: 700 }}>Giữ chân khách hàng</h2>
            <p className='text-sm text-[#8b6a61]'>Nhắc lịch thông minh, dữ liệu khách hàng tập trung và trải nghiệm liền mạch giúp khách quay lại đều đặn hơn.</p>
          </div>
          <div className='bg-white border border-[#592518] rounded-2xl p-5'>
            <Sparkles className='w-6 h-6 text-[#d56756] mb-3' />
            <h2 className='text-lg mb-2' style={{ fontWeight: 700 }}>Sẵn sàng mở rộng</h2>
            <p className='text-sm text-[#8b6a61]'>Phù hợp cho cả cửa hàng đơn lẻ lẫn mô hình nhiều chi nhánh, giữ chuẩn dịch vụ đồng nhất khi tăng trưởng.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogPage() {
  const posts = [
    {
      title: '5 chỉ số doanh thu giúp pet clinic tăng trưởng ổn định mỗi tuần',
      desc: 'Bộ KPI thực chiến để theo dõi hiệu suất dịch vụ, tỷ lệ khách quay lại và biên lợi nhuận theo từng nhóm.',
    },
    {
      title: 'Thiết kế lịch hẹn giảm no-show cho pet store trong 30 ngày',
      desc: 'Cách tối ưu khung giờ, nhắc lịch và kịch bản chăm sóc trước hẹn để giảm hủy phút chót.',
    },
    {
      title: 'Chuẩn hóa hồ sơ thú cưng để tăng tốc độ phục vụ tại quầy',
      desc: 'Mô hình hồ sơ tập trung giúp đội ngũ tư vấn nhanh hơn, bác sĩ phối hợp tốt hơn và khách hàng tin tưởng hơn.',
    },
  ];

  return (
    <div className='py-16 md:py-20'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-4xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
          Blog
        </h1>
        <p className='text-[#8b6a61] mb-8'>Góc chia sẻ thực chiến cho chủ pet clinic và pet store muốn vận hành tinh gọn và tăng trưởng bền vững.</p>
        <div className='grid gap-4'>
          {posts.map((post) => (
            <article key={post.title} className='bg-white border border-[#592518] rounded-2xl p-5'>
              <div className='flex items-center gap-2 text-[#c75b4c] mb-2'>
                <BookOpenText className='w-4 h-4' />
                <span className='text-xs'>PetHub Insight</span>
              </div>
              <h2 className='text-xl text-[#592518]' style={{ fontWeight: 700 }}>
                {post.title}
              </h2>
              <p className='text-sm text-[#8b6a61] mt-2'>{post.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <div className='py-16 md:py-20'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-4xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
          Liên hệ
        </h1>
        <p className='text-[#8b6a61] mb-8'>Đội ngũ PetHub luôn sẵn sàng hỗ trợ vận hành cho bạn.</p>

        <div className='grid lg:grid-cols-2 gap-6'>
          <div className='bg-white border border-[#592518] rounded-2xl p-6'>
            <h2 className='text-2xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>Gửi yêu cầu tư vấn</h2>
            <div className='space-y-3'>
              <input placeholder='Họ và tên' className='w-full p-3 border border-[#592518]/30 rounded-xl bg-[#faf8f5]' />
              <input placeholder='Số điện thoại' className='w-full p-3 border border-[#592518]/30 rounded-xl bg-[#faf8f5]' />
              <input placeholder='Email' className='w-full p-3 border border-[#592518]/30 rounded-xl bg-[#faf8f5]' />
              <textarea rows={4} placeholder='Nội dung' className='w-full p-3 border border-[#592518]/30 rounded-xl bg-[#faf8f5] resize-none' />
              <button className='px-5 py-3 rounded-xl border border-[#592518] bg-[#d56756] text-white hover:-translate-y-0.5 transition-all'>
                Gửi yêu cầu
              </button>
            </div>
          </div>

          <div className='bg-white border border-[#592518] rounded-2xl p-6'>
            <h2 className='text-2xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>Thông tin hỗ trợ</h2>
            <div className='space-y-4 text-[#592518]'>
              <div className='flex gap-3 items-start'>
                <Phone className='w-5 h-5 text-[#c75b4c] mt-0.5' />
                <div>
                  <p style={{ fontWeight: 600 }}>Hotline: 1900 123 456</p>
                  <p className='text-sm text-[#8b6a61]'>Thứ 2 - Chủ nhật, 8:00 - 21:00</p>
                </div>
              </div>
              <div className='flex gap-3 items-start'>
                <FileText className='w-5 h-5 text-[#c75b4c] mt-0.5' />
                <div>
                  <p style={{ fontWeight: 600 }}>Email: support@pethub.vn</p>
                  <p className='text-sm text-[#8b6a61]'>Phản hồi trong 24h</p>
                </div>
              </div>
              <div className='flex gap-3 items-start'>
                <LifeBuoy className='w-5 h-5 text-[#c75b4c] mt-0.5' />
                <div>
                  <p style={{ fontWeight: 600 }}>Trung tâm trợ giúp</p>
                  <p className='text-sm text-[#8b6a61]'>Xem FAQ và hướng dẫn chi tiết tại trang hỗ trợ.</p>
                  <Link to='/help' className='text-sm text-[#d56756] underline underline-offset-2'>Đi tới Help Center</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpPage() {
  const faqs = [
    {
      q: 'Làm sao để đặt lịch cho thú cưng?',
      a: 'Đăng nhập tài khoản, vào mục Lịch hẹn, chọn dịch vụ - thú cưng - thời gian và xác nhận đặt lịch.',
    },
    {
      q: 'Tôi có thể hủy lịch hẹn không?',
      a: 'Có. Trong lịch hẹn sắp tới, chọn Hủy lịch và xác nhận thao tác để tránh hủy nhầm.',
    },
    {
      q: 'Professional khác Starter ở điểm nào?',
      a: 'Professional mở khóa không giới hạn khách hàng và thú cưng, Digital Pet Card Premium, lịch hẹn nâng cao, tồn kho sản phẩm và tích hợp API.',
    },
  ];

  return (
    <div className='py-12 md:py-16'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-5'>
          <BackButton fallbackPath='/' />
        </div>
        <h1 className='text-4xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
          Trung tâm trợ giúp
        </h1>
        <p className='text-[#8b6a61] mb-8'>Tìm nhanh câu trả lời cho các thao tác quan trọng.</p>
        <div className='space-y-3'>
          {faqs.map((faq) => (
            <details key={faq.q} className='bg-white border border-[#592518] rounded-2xl p-4'>
              <summary className='cursor-pointer text-[#592518]' style={{ fontWeight: 700 }}>{faq.q}</summary>
              <p className='text-sm text-[#8b6a61] mt-3'>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegalPageShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='py-12 md:py-16'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-5'>
          <BackButton fallbackPath='/' />
        </div>

        <article className='bg-white border border-[#592518] rounded-2xl p-6 md:p-8'>
          <div className='flex items-center gap-3 mb-3 text-[#c75b4c]'>
            {icon}
            <span className='text-sm'>Cập nhật: 11/03/2026</span>
          </div>
          <h1 className='text-4xl text-[#592518] mb-2' style={{ fontWeight: 700 }}>{title}</h1>
          <p className='text-[#8b6a61] mb-6'>{subtitle}</p>
          <div className='space-y-5 text-[#592518] text-sm leading-7'>{children}</div>
        </article>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalPageShell
      title='Điều khoản sử dụng'
      subtitle='Vui lòng đọc kỹ điều khoản trước khi sử dụng dịch vụ PetHub.'
      icon={<FileText className='w-5 h-5' />}
    >
      <p><strong>1. Phạm vi dịch vụ:</strong> PetHub cung cấp nền tảng quản lý lịch hẹn, hồ sơ thú cưng, thông tin khách hàng và báo cáo vận hành cho cửa hàng/phòng khám.</p>
      <p><strong>2. Trách nhiệm tài khoản:</strong> Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập, không chia sẻ tài khoản trái phép.</p>
      <p><strong>3. Quyền sở hữu dữ liệu:</strong> Dữ liệu nghiệp vụ do khách hàng tạo thuộc quyền quản lý của khách hàng, PetHub chỉ xử lý theo mục đích cung cấp dịch vụ.</p>
      <p><strong>4. Giới hạn trách nhiệm:</strong> PetHub không chịu trách nhiệm cho gián đoạn do nguyên nhân bất khả kháng hoặc bên thứ ba hạ tầng ngoài kiểm soát hợp lý.</p>
    </LegalPageShell>
  );
}

export function PrivacyPage() {
  return (
    <LegalPageShell
      title='Chính sách bảo mật'
      subtitle='Chúng tôi cam kết bảo vệ dữ liệu người dùng theo nguyên tắc minh bạch và tối thiểu hóa.'
      icon={<Shield className='w-5 h-5' />}
    >
      <p><strong>1. Dữ liệu thu thập:</strong> Thông tin tài khoản, thông tin thú cưng, lịch hẹn và dữ liệu vận hành phục vụ tính năng sản phẩm.</p>
      <p><strong>2. Mục đích sử dụng:</strong> Vận hành dịch vụ, hỗ trợ khách hàng, cải thiện trải nghiệm và thông báo liên quan tài khoản.</p>
      <p><strong>3. Bảo mật:</strong> Chúng tôi áp dụng kiểm soát truy cập và mã hóa ở mức phù hợp để bảo vệ dữ liệu khỏi truy cập trái phép.</p>
      <p><strong>4. Liên hệ:</strong> Nếu cần hỗ trợ về bảo mật dữ liệu, vui lòng gửi email về support@pethub.vn.</p>
    </LegalPageShell>
  );
}
