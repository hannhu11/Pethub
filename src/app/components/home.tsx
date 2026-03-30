import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  PawPrint, QrCode, BarChart3, ArrowRight, Star, Check, CalendarCheck, HeartHandshake, BellRing, CreditCard, ClipboardPlus, Shield, BrainCircuit,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { HomeScrollHero } from './home-scroll-hero';
import clinicalAiImage from '../../assets/images/services/ai-trong-y-te.webp';
import bookingImage from '../../assets/images/services/booking-upgrade.jpg';
import catalogImage from '../../assets/images/services/catalog-upgrade.jpg';
import chatbotImage from '../../assets/images/services/chatbot-service-cropped.png';
import crmImage from '../../assets/images/services/crm-service.jpg';
import loyaltyImage from '../../assets/images/services/loyalty-service.png';
import medicalImage from '../../assets/images/services/medical-service.png';
import posImage from '../../assets/images/services/pos-service.png';
import qrCardImage from '../../assets/images/services/qr-card-service-cropped.png';
import reminderImage from '../../assets/images/services/reminder-service.jpg';
import revenueImage from '../../assets/images/services/revenue-service.jpg';
import snowballPetImage from '../../assets/images/pets/snowball.jpg';
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
    desc: 'Đặt lịch nhanh, nhắc nhở tự động qua Zalo/Email. Không bao giờ bỏ lỡ khách hàng.',
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

const clinicalAiHighlights = [
  {
    icon: BrainCircuit,
    title: 'Hỗ trợ định dạng nhanh',
    desc: 'Chuyển các ghi chú ban đầu thành nội dung có bố cục rõ ràng, dễ đọc và chuyên nghiệp hơn.',
  },
  {
    icon: ClipboardPlus,
    title: 'Hỗ trợ đội ngũ kiểm tra lại',
    desc: 'Nội dung được chuẩn bị sẵn để bác sĩ hoặc nhân viên rà soát, chỉnh sửa và hoàn thiện trước khi lưu.',
  },
  {
    icon: CalendarCheck,
    title: 'Tiết kiệm thời gian nhập liệu',
    desc: 'Giảm đáng kể thao tác gõ lặp lại trong quá trình cập nhật hồ sơ chăm sóc và tái khám.',
  },
  {
    icon: Shield,
    title: 'Ghi nhận minh bạch',
    desc: 'Thông tin sau khi được xác nhận sẽ hiển thị nhất quán trong hồ sơ và các bề mặt theo dõi liên quan.',
  },
];

export function HomePage() {
  const pricingCards = pricingPlanDefinitions;

  return (
    <div className="bg-[#fdfbf8]">
      <HomeScrollHero />

      <div className="relative -mt-10 h-20 bg-[linear-gradient(180deg,rgba(250,248,245,0)_0%,rgba(250,247,242,0.82)_55%,#faf6f1_100%)]" />

      {/* Services Preview */}
      <section id="services-section" className="bg-[#faf6f1] pb-18 pt-12">
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
                <div className="relative h-72 overflow-hidden sm:h-80">
                  <ImageWithFallback
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: service.objectPosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1f0d08]/92 via-[#1f0d08]/60 to-[#1f0d08]/10" />
                  <div className="absolute left-5 top-5 inline-flex items-center rounded-full border border-white/30 bg-white/88 px-3 py-1 text-xs text-[#d56756] backdrop-blur-sm">
                    {service.badge}
                  </div>
                  <div className="absolute inset-x-5 bottom-5">
                    <h3
                      className="mb-2 max-w-[92%] text-[1.45rem] leading-[1.15] text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.52)] lg:text-[1.6rem]"
                      style={{ fontWeight: 800 }}
                    >
                      {service.title}
                    </h3>
                    <p
                      className="max-w-[95%] text-sm leading-7 text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] lg:text-[0.95rem]"
                      style={{ fontWeight: 500 }}
                    >
                      {service.desc}
                    </p>
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

      <section className="bg-[#fcfbf8] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.25rem] border border-[#ead9d1] bg-[linear-gradient(180deg,#fffdfa_0%,#faf6f1_100%)] shadow-[0_24px_55px_rgba(89,37,24,0.10)]">
            <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="px-8 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d56756]/20 bg-white px-4 py-2 text-sm text-[#d56756] shadow-[0_12px_30px_rgba(213,103,86,0.10)]">
                  <BrainCircuit className="h-4 w-4" />
                  Trợ lý hồ sơ y tế
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl leading-tight text-[#592518] sm:text-4xl lg:text-[2.7rem]" style={{ fontWeight: 800 }}>
                  Trợ lý AI: tối ưu cấu trúc bệnh án từ ghi chú lâm sàng
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#7f594f] lg:text-lg">
                  Giảm tải công việc nhập liệu cho đội ngũ chăm sóc. PetHub hỗ trợ cấu trúc hóa các ghi chú lâm sàng thành bệnh án rõ ràng, chuyên nghiệp để bác sĩ và nhân viên tập trung hơn vào chuyên môn và trải nghiệm khách hàng.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8b6a61] lg:text-base">
                  Thay vì mất thời gian gõ lại từng ý nhỏ, đội ngũ có thể bắt đầu từ vài ghi chú ban đầu rồi nhanh chóng hoàn thiện hồ sơ theo bố cục mạch lạc. Thông tin sau khi được kiểm tra và lưu lại cũng dễ theo dõi hơn ở các lần chăm sóc tiếp theo.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {clinicalAiHighlights.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.07 }}
                      className="rounded-[1.5rem] border border-[#ead9d1] bg-white p-5 shadow-[0_14px_32px_rgba(89,37,24,0.06)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d56756]/10 text-[#d56756]">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base text-[#592518]" style={{ fontWeight: 700 }}>
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-[#8b6a61]">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col items-start gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#592518] bg-[#d56756] px-6 py-3 text-white shadow-[0_18px_38px_rgba(213,103,86,0.18)] transition-all hover:-translate-y-1"
                  >
                    Xem cách PetHub vận hành
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <p className="text-sm text-[#8b6a61]">
                    Phù hợp cho pet shop, spa thú cưng và phòng khám muốn chuẩn hóa hồ sơ chăm sóc theo cách chuyên nghiệp, dễ theo dõi.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="relative px-8 pb-10 sm:px-10 lg:px-12 lg:pb-12"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(213,103,86,0.12),transparent_42%)]" />
                <div className="relative overflow-hidden rounded-[2.25rem] border border-[#ead9d1] bg-white p-3 shadow-[0_24px_46px_rgba(89,37,24,0.12)]">
                  <div className="relative overflow-hidden rounded-[1.75rem]">
                    <ImageWithFallback
                      src={clinicalAiImage}
                      alt="Trợ lý hồ sơ y tế cho pet shop và phòng khám thú y"
                      className="h-[360px] w-full object-cover sm:h-[420px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2b110b]/80 via-[#2b110b]/18 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 rounded-[1.35rem] border border-white/18 bg-white/14 px-4 py-4 text-white backdrop-blur-md shadow-[0_16px_32px_rgba(0,0,0,0.12)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/18">
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-white/78">Trợ lý hồ sơ</p>
                          <p className="mt-1 text-base leading-7 text-white/96" style={{ fontWeight: 600 }}>
                            Hỗ trợ đội ngũ chuyển ghi chú lâm sàng thành bệnh án rõ ràng, mạch lạc và thuận tiện cho tái khám.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fcfbf8] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.25rem] border border-[#e6cbc1] bg-[linear-gradient(135deg,#d56756_0%,#c45e4f_55%,#b65346_100%)] shadow-[0_28px_65px_rgba(89,37,24,0.16)]">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="px-8 py-10 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm text-white/95 backdrop-blur-sm">
                  <QrCode className="h-4 w-4" />
                  Tính năng độc quyền
                </div>
                <h2 className="max-w-xl text-3xl leading-tight text-white sm:text-4xl lg:text-5xl" style={{ fontWeight: 800 }}>
                  Digital Pet Card - Vũ khí bí mật giữ chân khách hàng
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/92 lg:text-lg">
                  Mang đến trải nghiệm chăm sóc thú cưng đẳng cấp 5 sao. Không còn sổ tiêm phòng giấy bọc nilon dễ rách mất.
                  Mọi thông tin thú cưng nằm gọn trong chiếc smartphone của khách hàng để pet shop của bạn luôn chuyên nghiệp và đáng nhớ.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    { icon: QrCode, text: 'Quét mã QR tra cứu hồ sơ y tế tức thì' },
                    { icon: BellRing, text: 'Nhắc lịch tiêm phòng, tẩy giun tự động' },
                    { icon: HeartHandshake, text: 'Tích điểm thành viên, nhận ưu đãi dễ dàng' },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/14 px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-sm"
                    >
                      <item.icon className="h-4 w-4" />
                      <span style={{ fontWeight: 600 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative px-8 pb-10 pt-2 sm:px-10 lg:px-12 lg:pb-12 lg:pt-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)]" />
                <div className="relative mx-auto w-full max-w-[25rem]">
                  <div className="absolute -inset-4 rounded-[2.5rem] border border-white/16 bg-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.06)] backdrop-blur-sm" />
                  <div className="relative overflow-hidden rounded-[2.75rem] border-[10px] border-[#f6efe9] bg-white shadow-[0_28px_50px_rgba(89,37,24,0.22)]">
                    <div className="bg-white px-5 pb-4 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d56756] text-white shadow-sm">
                            <QrCode className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-lg text-[#592518]" style={{ fontWeight: 700 }}>Snowball</p>
                            <p className="text-sm text-[#9a7369]">Mèo Anh lông ngắn</p>
                          </div>
                        </div>
                        <div className="rounded-full border border-[#ead9d1] px-3 py-1 text-xs text-[#d56756]" style={{ fontWeight: 600 }}>
                          Premium
                        </div>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[2rem] border border-[#f1dfd8] bg-[linear-gradient(180deg,#fff8ef_0%,#f8f2e6_100%)] p-4">
                        <ImageWithFallback
                          src={snowballPetImage}
                          alt="Digital Pet Card preview"
                          className="h-48 w-full rounded-[1.5rem] object-cover"
                        />
                        <div className="mt-4 flex items-center justify-between rounded-[1.5rem] bg-white/90 px-4 py-3 shadow-[0_10px_25px_rgba(89,37,24,0.08)]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-[#9a7369]">Pet ID</p>
                            <p className="text-sm text-[#592518]" style={{ fontWeight: 700 }}>SNOW-QR-247</p>
                          </div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fff7f3] text-[#d56756] shadow-inner">
                            <QrCode className="h-12 w-12" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 divide-y divide-[#f0e1db] rounded-[1.25rem] border border-[#f0e1db] bg-[#fffdfa] px-4">
                        <div className="flex items-center justify-between py-3 text-sm">
                          <span className="text-[#9a7369]">Tiêm phòng gần nhất</span>
                          <span className="text-[#592518]" style={{ fontWeight: 700 }}>15/02/2026</span>
                        </div>
                        <div className="flex items-center justify-between py-3 text-sm">
                          <span className="text-[#9a7369]">Tái chủng tiếp theo</span>
                          <span className="text-[#d56756]" style={{ fontWeight: 700 }}>15/05/2026</span>
                        </div>
                        <div className="flex items-center justify-between py-3 text-sm">
                          <span className="text-[#9a7369]">Điểm thành viên</span>
                          <span className="text-[#592518]" style={{ fontWeight: 700 }}>1,250 điểm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
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
                    {plan.contactOnly ? 'Liên hệ tư vấn' : plan.ctaLabel}
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
