import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  PawPrint, QrCode, BarChart3, ArrowRight, Star, Check, CalendarCheck, HeartHandshake, BellRing, CreditCard, ClipboardPlus, Shield,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import heroPetShopImage from '../../assets/images/home/dog_hien_thi_o_trang_chu.jpg';
import bookingImage from '../../assets/images/services/booking-upgrade.jpg';
import catalogImage from '../../assets/images/services/catalog-upgrade.jpg';
import chatbotImage from '../../assets/images/services/chatbot-service.png';
import crmImage from '../../assets/images/services/crm-service.jpg';
import loyaltyImage from '../../assets/images/services/loyalty-service.png';
import medicalImage from '../../assets/images/services/medical-service.png';
import posImage from '../../assets/images/services/pos-service.png';
import qrCardImage from '../../assets/images/services/qr-card-service.png';
import reminderImage from '../../assets/images/services/reminder-service.jpg';
import revenueImage from '../../assets/images/services/revenue-service.jpg';
import { pricingPlanDefinitions } from '../constants/pricing';

const features = [
  { icon: CalendarCheck, title: 'Đặt lịch thông minh 24/7', desc: 'Khách chủ động chọn khung giờ phù hợp, hệ thống tự tối ưu slot để giảm trùng lịch và quá tải.' },
  { icon: Check, title: 'Thanh toán POS đa phương thức', desc: 'Xử lý thanh toán tại quầy nhanh gọn với luồng xác nhận rõ ràng, đồng bộ trạng thái giao dịch tức thì.' },
  { icon: PawPrint, title: 'Hồ sơ thú cưng tập trung', desc: 'Toàn bộ thông tin chăm sóc, lịch sử dịch vụ và ghi chú được quản lý tập trung, dễ tra cứu.' },
  { icon: QrCode, title: 'Digital Pet Card', desc: 'Thẻ định danh kỹ thuật số tích hợp QR giúp nhận diện nhanh và phục vụ chính xác từng bé thú cưng.' },
  { icon: Shield, title: 'Nhắc lịch tự động đa kênh', desc: 'Chủ động gửi nhắc lịch tiêm, tái khám và chăm sóc định kỳ để tăng tỷ lệ quay lại của khách hàng.' },
  { icon: BarChart3, title: 'Báo cáo vận hành theo thời gian thực', desc: 'Theo dõi doanh thu, hiệu suất dịch vụ và tệp khách hàng để ra quyết định nhanh và chính xác hơn.' },
];

const serviceShowcase = [
  {
    title: 'Quản lý khách hàng thông minh',
    desc: 'Lưu trữ thông tin khách hàng và thú cưng chi tiết. Theo dõi lịch sử dịch vụ và tổng chi tiêu.',
    image: crmImage,
    badge: 'CRM',
    objectPosition: 'center 50%',
  },
  {
    title: 'Lịch hẹn tự động',
    desc: 'Đặt lịch nhanh, nhắc nhở tự động qua SMS/Zalo. Không bao giờ bỏ lỡ khách hàng.',
    image: bookingImage,
    badge: 'Booking',
    objectPosition: 'center 50%',
  },
  {
    title: 'Digital Pet Card',
    desc: 'Thẻ thú cưng điện tử với QR code. Khách hàng quét là thấy ngay lịch sử tiêm phòng, tẩy giun.',
    image: qrCardImage,
    badge: 'QR Card',
    objectPosition: 'center 50%',
  },
  {
    title: 'Hồ sơ Y tế chi tiết',
    desc: 'Lưu trữ đầy đủ lịch sử khám bệnh, tiêm phòng, thuốc men. Timeline rõ ràng, dễ theo dõi.',
    image: medicalImage,
    badge: 'Medical',
    objectPosition: 'center 50%',
  },
  {
    title: 'POS thanh toán nhanh',
    desc: 'Tính tiền chuyên nghiệp, in hóa đơn ngay. Hỗ trợ nhiều hình thức thanh toán.',
    image: posImage,
    badge: 'POS',
    objectPosition: 'center 50%',
  },
  {
    title: 'Nhắc nhở thông minh',
    desc: 'Tự động nhắc lịch tái chủng, sinh nhật thú cưng. Tăng tỷ lệ khách quay lại 3x.',
    image: reminderImage,
    badge: 'Reminder',
    objectPosition: 'center 50%',
  },
  {
    title: 'Báo cáo doanh thu',
    desc: 'Thống kê chi tiết doanh thu theo ngày/tháng. Phân tích xu hướng và tăng trưởng.',
    image: revenueImage,
    badge: 'Revenue',
    objectPosition: 'center 50%',
  },
  {
    title: 'CRM giữ chân khách',
    desc: 'Chăm sóc khách hàng chu đáo. Gửi ưu đãi cá nhân hóa, xây dựng lòng trung thành.',
    image: loyaltyImage,
    badge: 'Loyalty',
    objectPosition: 'center 50%',
  },
  {
    title: 'Quản lý dịch vụ',
    desc: 'Danh mục dịch vụ linh hoạt. Cập nhật giá, combo dễ dàng.',
    image: catalogImage,
    badge: 'Catalog',
    objectPosition: 'center 50%',
  },
  {
    title: 'Trợ lý ảo AI (Chatbot RAG)',
    desc: 'Tư vấn khách hàng, phân tích dữ liệu và hỗ trợ quản trị pet shop 24/7 ngay trong hệ thống.',
    image: chatbotImage,
    badge: 'AI Chatbot',
    objectPosition: 'center 40%',
  },
];

const testimonials = [
  { name: 'Chị Lan', role: 'Chủ cửa hàng Soul Pet', text: 'PetHub giúp tôi quản lý hơn 200 khách hàng mỗi tháng mà không cần sổ sách. Nhân viên mới cũng dùng được ngay!', rating: 5 },
  { name: 'Anh Minh', role: 'Bác sĩ thú y', text: 'Tính năng Digital Pet Card và nhắc lịch tự động giúp phòng khám chuyên nghiệp hơn rất nhiều.', rating: 5 },
  { name: 'Chị Hương', role: 'Quản lý phòng khám', text: 'Báo cáo doanh thu chi tiết giúp tôi nắm bắt tình hình kinh doanh mọi lúc.', rating: 5 },
];

export function HomePage() {
  const pricingCards = pricingPlanDefinitions;

  return (
    <div className="bg-[#fdfbf8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(213,103,86,0.10),_transparent_34%),linear-gradient(180deg,_#fffdfa_0%,_#fdfbf8_100%)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d56756] text-[#d56756] text-sm mb-6 bg-white/80 backdrop-blur-sm">
                <PawPrint className="w-4 h-4" />
                Nền tảng vận hành hiện đại cho pet clinic & pet store
              </div>
              <h1 className="text-4xl md:text-5xl mb-6 text-[#592518]" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                Tăng trưởng phòng khám thú y
                <span className="text-[#d56756]"> chuyên nghiệp</span> &
                <span className="text-[#c75b4c]"> bền vững</span>
              </h1>
              <p className="text-lg text-[#7f594f] mb-8 max-w-lg">
                PetHub giúp bạn chuẩn hóa vận hành từ đặt lịch, chăm sóc khách hàng đến quản lý hồ sơ thú cưng.
                Mọi quy trình quan trọng được gom về một nền tảng duy nhất để tăng hiệu suất và giữ chân khách hàng.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#d56756] text-white hover:-translate-y-1 transition-all border border-[#592518] shadow-[0_18px_40px_rgba(213,103,86,0.18)]"
                >
                  Khám phá nền tảng
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/95 text-[#592518] hover:-translate-y-1 transition-all border border-[#592518]/80 shadow-[0_16px_30px_rgba(89,37,24,0.08)]"
                >
                  Nhận tư vấn miễn phí
                </Link>
              </div>

              <div className="flex gap-8 mt-10">
                {[
                  { num: '12M+', label: 'Thú cưng VN' },
                  { num: '3,100+', label: 'Cửa hàng' },
                  { num: '95M$', label: 'Quy mô TT' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl text-[#d56756]" style={{ fontWeight: 700 }}>{s.num}</p>
                    <p className="text-xs text-[#8b6a61]">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-[2rem] overflow-hidden border border-[#d9b8aa] bg-white shadow-[0_28px_70px_rgba(89,37,24,0.12)] aspect-[4/3]">
                <ImageWithFallback
                  src={heroPetShopImage}
                  alt="PetHub home hero dog"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#592518]/10 via-transparent to-white/10" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white/96 border border-[#e6cfc5] rounded-2xl p-4 shadow-[0_18px_35px_rgba(89,37,24,0.10)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#eaf8ef] flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#592518]" style={{ fontWeight: 600 }}>Lịch hẹn mới!</p>
                    <p className="text-xs text-[#8b6a61]">Lucky - Khám tổng quát</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="relative h-12 bg-[#fcfbf8]">
        <svg viewBox="0 0 1440 48" className="absolute w-full" preserveAspectRatio="none">
          <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="#faf6f1" />
        </svg>
      </div>

      {/* Services Preview */}
      <section id="services-section" className="bg-[#faf6f1] py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-[#592518] mb-3" style={{ fontWeight: 700 }}>
              Dịch vụ của chúng tôi
            </h2>
            <p className="text-[#8b6a61] max-w-2xl mx-auto">
              Bộ công cụ vận hành được tối ưu cho pet shop, spa thú cưng và phòng khám muốn chăm sóc khách hàng tốt hơn mỗi ngày.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {serviceShowcase.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group overflow-hidden rounded-[1.75rem] border border-[#e8d7cf] bg-white shadow-[0_14px_34px_rgba(89,37,24,0.07)] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(89,37,24,0.10)] transition-all"
              >
                <div className="relative h-60 overflow-hidden">
                  <ImageWithFallback
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: service.objectPosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#592518]/72 via-[#592518]/22 to-white/5" />
                  <div className="absolute left-5 top-5 inline-flex items-center rounded-full border border-white/30 bg-white/88 px-3 py-1 text-xs text-[#d56756] backdrop-blur-sm">
                    {service.badge}
                  </div>
                  <div className="absolute inset-x-5 bottom-5">
                    <h3 className="text-xl text-white mb-2" style={{ fontWeight: 700 }}>{service.title}</h3>
                    <p className="text-sm text-white/90 leading-6">{service.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#d56756] hover:underline"
            >
              Xem toàn bộ dịch vụ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="about-section" className="py-20 bg-[#fcfbf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl text-[#592518] mb-3" style={{ fontWeight: 700 }}>
              Tại sao chọn PetHub?
            </h2>
            <p className="text-[#8b6a61] max-w-lg mx-auto">
              Những năng lực cốt lõi giúp PetHub đồng hành cùng chủ pet clinic/pet store ngay từ ngày đầu vận hành.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-[#ead9d1] rounded-2xl p-6 hover:-translate-y-1 transition-all shadow-[0_14px_28px_rgba(89,37,24,0.06)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#d56756]/10 flex-shrink-0 flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-[#d56756]" />
                  </div>
                  <div>
                    <h3 className="text-lg text-[#592518] mb-2" style={{ fontWeight: 600 }}>{f.title}</h3>
                    <p className="text-sm text-[#8b6a61]">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing-section" className="bg-[#faf6f1] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl text-[#592518] mb-3" style={{ fontWeight: 700 }}>
              Bảng giá minh bạch
            </h2>
            <p className="text-[#8b6a61]">Chọn đúng gói cho quy mô pet shop hoặc phòng khám của bạn.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
            {pricingCards.map((plan) => {
              const isHighlight = Boolean(plan.highlight);
              const ctaTo = plan.contactOnly ? '/contact' : '/register';

              return (
                <article
                  key={plan.code}
                  className={`relative rounded-[2rem] border p-8 shadow-[0_18px_38px_rgba(89,37,24,0.08)] transition-all ${
                    isHighlight
                      ? 'border-[#592518] bg-[#d56756] text-white shadow-[0_24px_48px_rgba(213,103,86,0.24)]'
                      : 'border-[#ead9d1] bg-white text-[#592518]'
                  }`}
                >
                  {isHighlight ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#592518] bg-[#23466d] px-4 py-1 text-xs text-white shadow-sm">
                      Phổ biến nhất
                    </div>
                  ) : null}
                  <h3 className="text-2xl mb-2" style={{ fontWeight: 700 }}>{plan.title}</h3>
                  <p className={`text-sm mb-6 ${isHighlight ? 'text-white/85' : 'text-[#8b6a61]'}`}>{plan.tagline}</p>
                  <p className={`mb-6 ${plan.contactOnly ? 'text-[#d56756]' : ''}`} style={{ fontWeight: 700 }}>
                    <span className="text-5xl">{plan.priceLabel}</span>
                    {plan.priceSuffix ? <span className={`ml-2 text-xl ${isHighlight ? 'text-white/85' : 'text-[#8b6a61]'}`}>{plan.priceSuffix}</span> : null}
                  </p>
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className={`flex items-start gap-3 text-sm ${isHighlight ? 'text-white' : 'text-[#592518]'}`}>
                        <span className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${isHighlight ? 'bg-white/20' : 'bg-[#f7ebe6]'}`}>
                          <Check className={`w-3.5 h-3.5 ${isHighlight ? 'text-white' : 'text-[#d56756]'}`} />
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={ctaTo}
                    className={`block w-full rounded-2xl border py-3 text-center transition-all hover:-translate-y-0.5 ${
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
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="py-20 bg-[#fcfbf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl text-[#592518] mb-3" style={{ fontWeight: 700 }}>
              Khách hàng nói gì?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-[#ead9d1] rounded-2xl p-6 shadow-[0_14px_28px_rgba(89,37,24,0.06)]"
              >
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#d4940a] text-[#d4940a]" />
                  ))}
                </div>
                <p className="text-sm text-[#592518] mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600 }}>{t.name}</p>
                  <p className="text-xs text-[#8b6a61]">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact-section" className="py-16 bg-[#fdfbf8]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-[#d56756] rounded-3xl p-12 border border-[#592518] relative overflow-hidden shadow-[0_22px_46px_rgba(213,103,86,0.16)]">
            <div className="absolute top-4 right-4 opacity-10">
              <PawPrint className="w-32 h-32 text-white" />
            </div>
            <h2 className="text-3xl text-white mb-4" style={{ fontWeight: 700 }}>
              Sẵn sàng nâng cấp phòng khám?
            </h2>
            <p className="text-white/85 mb-8 max-w-lg mx-auto">
              Tham gia cùng hàng trăm cơ sở thú y đang sử dụng PetHub để tối ưu vận hành.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#d56756] hover:-translate-y-1 transition-all border border-[#592518]"
              style={{ fontWeight: 600 }}
            >
              Đăng ký ngay
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
