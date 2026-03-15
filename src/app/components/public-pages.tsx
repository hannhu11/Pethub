import { Link } from 'react-router';
import { Check, Sparkles, ShieldCheck, HeartHandshake, BookOpenText, Phone, FileText, Shield, LifeBuoy } from 'lucide-react';
import { BackButton } from './back-button';

export function PricingPage() {
  return (
    <div className='py-16 md:py-20'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Bảng giá PetHub
          </h1>
          <p className='text-[#7a756e] max-w-2xl mx-auto'>
            Mở đầu miễn phí để thử hệ thống. Khi sẵn sàng mở rộng, nâng cấp Premium để dùng CRM, nhắc lịch tự động và Digital Pet Card.
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
          <article className='bg-white border border-[#2d2a26] rounded-2xl p-8'>
            <h2 className='text-xl text-[#2d2a26] mb-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Basic</h2>
            <p className='text-3xl text-[#2d2a26] mb-6' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              0đ <span className='text-sm text-[#7a756e]' style={{ fontWeight: 400 }}>/ tháng</span>
            </p>
            <ul className='space-y-3 text-sm text-[#2d2a26]'>
              {['Tối đa 50 hồ sơ thú cưng', 'Đặt lịch & quản lý cơ bản', '1 tài khoản quản lý'].map((item) => (
                <li key={item} className='flex items-center gap-2'>
                  <Check className='w-4 h-4 text-[#6b8f5e]' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to='/register'
              className='mt-8 inline-flex w-full justify-center px-5 py-3 rounded-xl border border-[#2d2a26] text-[#2d2a26] hover:-translate-y-0.5 transition-all'
            >
              Bắt đầu miễn phí
            </Link>
          </article>

          <article className='bg-[#6b8f5e] text-white border border-[#2d2a26] rounded-2xl p-8'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2d2a26] bg-[#c67d5b] text-xs mb-4'>
              <Sparkles className='w-3.5 h-3.5' />
              Gói khuyên dùng
            </div>
            <h2 className='text-xl mb-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Premium</h2>
            <p className='text-3xl mb-6' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              249.000đ <span className='text-sm opacity-80' style={{ fontWeight: 400 }}>/ tháng</span>
            </p>
            <ul className='space-y-3 text-sm'>
              {['Không giới hạn hồ sơ', 'Digital Pet Card + QR', 'CRM nhắc lịch tự động', 'Phân tích doanh thu và tần suất khách quay lại'].map((item) => (
                <li key={item} className='flex items-center gap-2'>
                  <Check className='w-4 h-4' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to='/register'
              className='mt-8 inline-flex w-full justify-center px-5 py-3 rounded-xl border border-[#2d2a26] bg-white text-[#6b8f5e] hover:-translate-y-0.5 transition-all'
              style={{ fontWeight: 600 }}
            >
              Dùng thử 14 ngày
            </Link>
          </article>
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
          <h1 className='text-4xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Về chúng tôi
          </h1>
          <p className='text-[#7a756e] leading-7'>
            PetHub xây dựng nền tảng vận hành cho pet store và phòng khám thú y theo tiêu chuẩn quốc tế: rõ ràng quy trình,
            dữ liệu nhất quán và trải nghiệm khách hàng có chiều sâu.
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-5 mt-10'>
          <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
            <ShieldCheck className='w-6 h-6 text-[#6b8f5e] mb-3' />
            <h2 className='text-lg mb-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Chuẩn hóa quy trình</h2>
            <p className='text-sm text-[#7a756e]'>Từ đặt lịch đến lịch sử điều trị đều theo một luồng rõ ràng, nhất quán và dễ kiểm soát.</p>
          </div>
          <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
            <HeartHandshake className='w-6 h-6 text-[#c67d5b] mb-3' />
            <h2 className='text-lg mb-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Trải nghiệm nhân văn</h2>
            <p className='text-sm text-[#7a756e]'>UI tập trung sự rõ ràng và ấm áp, phù hợp cho môi trường dịch vụ chăm sóc thú cưng.</p>
          </div>
          <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
            <Sparkles className='w-6 h-6 text-[#6b8f5e] mb-3' />
            <h2 className='text-lg mb-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Sẵn sàng mở rộng</h2>
            <p className='text-sm text-[#7a756e]'>Thiết kế để mở rộng từ một cửa hàng đến chuỗi đa chi nhánh với hiệu suất ổn định.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogPage() {
  const posts = [
    {
      title: '5 chỉ số vận hành pet clinic nên theo dõi hằng tuần',
      desc: 'Khung KPI giúp quản lý doanh thu, tỉ lệ khách quay lại và mức độ sử dụng dịch vụ theo từng nhóm.',
    },
    {
      title: 'Thiết kế lịch hẹn giảm no-show cho pet store',
      desc: 'Cách tổ chức slot, nhắc lịch và follow-up để giảm lịch hủy phút chót.',
    },
    {
      title: 'Chuẩn hóa hồ sơ thú cưng theo chuẩn dịch vụ cao cấp',
      desc: 'Mô hình dữ liệu hồ sơ y tế giúp đội vận hành và bác sĩ phối hợp nhất quán.',
    },
  ];

  return (
    <div className='py-16 md:py-20'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-4xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Blog
        </h1>
        <p className='text-[#7a756e] mb-8'>Tài nguyên chiến lược cho vận hành pet business hiện đại.</p>
        <div className='grid gap-4'>
          {posts.map((post) => (
            <article key={post.title} className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
              <div className='flex items-center gap-2 text-[#c67d5b] mb-2'>
                <BookOpenText className='w-4 h-4' />
                <span className='text-xs'>PetHub Insight</span>
              </div>
              <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {post.title}
              </h2>
              <p className='text-sm text-[#7a756e] mt-2'>{post.desc}</p>
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
        <h1 className='text-4xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Liên hệ
        </h1>
        <p className='text-[#7a756e] mb-8'>Đội ngũ PetHub luôn sẵn sàng hỗ trợ vận hành cho bạn.</p>

        <div className='grid lg:grid-cols-2 gap-6'>
          <div className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
            <h2 className='text-2xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Gửi yêu cầu tư vấn</h2>
            <div className='space-y-3'>
              <input placeholder='Họ và tên' className='w-full p-3 border border-[#2d2a26]/30 rounded-xl bg-[#faf9f6]' />
              <input placeholder='Số điện thoại' className='w-full p-3 border border-[#2d2a26]/30 rounded-xl bg-[#faf9f6]' />
              <input placeholder='Email' className='w-full p-3 border border-[#2d2a26]/30 rounded-xl bg-[#faf9f6]' />
              <textarea rows={4} placeholder='Nội dung' className='w-full p-3 border border-[#2d2a26]/30 rounded-xl bg-[#faf9f6] resize-none' />
              <button className='px-5 py-3 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all'>
                Gửi yêu cầu
              </button>
            </div>
          </div>

          <div className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
            <h2 className='text-2xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Thông tin hỗ trợ</h2>
            <div className='space-y-4 text-[#2d2a26]'>
              <div className='flex gap-3 items-start'>
                <Phone className='w-5 h-5 text-[#c67d5b] mt-0.5' />
                <div>
                  <p style={{ fontWeight: 600 }}>Hotline: 1900 123 456</p>
                  <p className='text-sm text-[#7a756e]'>Thứ 2 - Chủ nhật, 8:00 - 21:00</p>
                </div>
              </div>
              <div className='flex gap-3 items-start'>
                <FileText className='w-5 h-5 text-[#c67d5b] mt-0.5' />
                <div>
                  <p style={{ fontWeight: 600 }}>Email: support@pethub.vn</p>
                  <p className='text-sm text-[#7a756e]'>Phản hồi trong 24h</p>
                </div>
              </div>
              <div className='flex gap-3 items-start'>
                <LifeBuoy className='w-5 h-5 text-[#c67d5b] mt-0.5' />
                <div>
                  <p style={{ fontWeight: 600 }}>Trung tâm trợ giúp</p>
                  <p className='text-sm text-[#7a756e]'>Xem FAQ và hướng dẫn chi tiết tại trang hỗ trợ.</p>
                  <Link to='/help' className='text-sm text-[#6b8f5e] underline underline-offset-2'>Đi tới Help Center</Link>
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
      q: 'Gói Premium có những tính năng gì?',
      a: 'Premium mở khóa CRM nhắc lịch tự động, Digital Pet Card và báo cáo vận hành nâng cao.',
    },
  ];

  return (
    <div className='py-12 md:py-16'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-5'>
          <BackButton fallbackPath='/' />
        </div>
        <h1 className='text-4xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Trung tâm trợ giúp
        </h1>
        <p className='text-[#7a756e] mb-8'>Tìm nhanh câu trả lời cho các thao tác quan trọng.</p>
        <div className='space-y-3'>
          {faqs.map((faq) => (
            <details key={faq.q} className='bg-white border border-[#2d2a26] rounded-2xl p-4'>
              <summary className='cursor-pointer text-[#2d2a26]' style={{ fontWeight: 700 }}>{faq.q}</summary>
              <p className='text-sm text-[#7a756e] mt-3'>{faq.a}</p>
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

        <article className='bg-white border border-[#2d2a26] rounded-2xl p-6 md:p-8'>
          <div className='flex items-center gap-3 mb-3 text-[#c67d5b]'>
            {icon}
            <span className='text-sm'>Cập nhật: 11/03/2026</span>
          </div>
          <h1 className='text-4xl text-[#2d2a26] mb-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{title}</h1>
          <p className='text-[#7a756e] mb-6'>{subtitle}</p>
          <div className='space-y-5 text-[#2d2a26] text-sm leading-7'>{children}</div>
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
