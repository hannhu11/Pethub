import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  PawPrint, Stethoscope, Scissors, Droplets, Shield,
  CalendarCheck, QrCode, BarChart3, ArrowRight, Star, Check
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import heroClinicImage from '../../assets/images/home/hero-clinic.jpg';

const features = [
  { icon: CalendarCheck, title: 'Đặt lịch thông minh 24/7', desc: 'Khách chủ động chọn khung giờ phù hợp, hệ thống tự tối ưu slot để giảm trùng lịch và quá tải.' },
  { icon: Check, title: 'Thanh toán POS đa phương thức', desc: 'Xử lý thanh toán tại quầy nhanh gọn với luồng xác nhận rõ ràng, đồng bộ trạng thái giao dịch tức thì.' },
  { icon: PawPrint, title: 'Hồ sơ thú cưng tập trung', desc: 'Toàn bộ thông tin chăm sóc, lịch sử dịch vụ và ghi chú được quản lý tập trung, dễ tra cứu.' },
  { icon: QrCode, title: 'Digital Pet Card', desc: 'Thẻ định danh kỹ thuật số tích hợp QR giúp nhận diện nhanh và phục vụ chính xác từng bé thú cưng.' },
  { icon: Shield, title: 'Nhắc lịch tự động đa kênh', desc: 'Chủ động gửi nhắc lịch tiêm, tái khám và chăm sóc định kỳ để tăng tỷ lệ quay lại của khách hàng.' },
  { icon: BarChart3, title: 'Báo cáo vận hành theo thời gian thực', desc: 'Theo dõi doanh thu, hiệu suất dịch vụ và tệp khách hàng để ra quyết định nhanh và chính xác hơn.' },
];

const services = [
  { icon: Stethoscope, name: 'Khám tổng quát', color: '#d56756' },
  { icon: Droplets, name: 'Tắm & Spa', color: '#8f6b5e' },
  { icon: Scissors, name: 'Cắt tỉa lông', color: '#c75b4c' },
  { icon: Shield, name: 'Tiêm phòng', color: '#d4940a' },
];

const testimonials = [
  { name: 'Chị Lan', role: 'Chủ cửa hàng Soul Pet', text: 'PetHub giúp tôi quản lý hơn 200 khách hàng mỗi tháng mà không cần sổ sách. Nhân viên mới cũng dùng được ngay!', rating: 5 },
  { name: 'Anh Minh', role: 'Bác sĩ thú y', text: 'Tính năng Digital Pet Card và nhắc lịch tự động giúp phòng khám chuyên nghiệp hơn rất nhiều.', rating: 5 },
  { name: 'Chị Hương', role: 'Quản lý phòng khám', text: 'Báo cáo doanh thu chi tiết giúp tôi nắm bắt tình hình kinh doanh mọi lúc.', rating: 5 },
];

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d56756] text-[#d56756] text-sm mb-6">
                <PawPrint className="w-4 h-4" />
                Nền tảng vận hành hiện đại cho pet clinic & pet store
              </div>
              <h1 className="text-4xl md:text-5xl mb-6 text-[#592518]" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                Tăng trưởng phòng khám thú y
                <span className="text-[#d56756]"> chuyên nghiệp</span> &
                <span className="text-[#c75b4c]"> bền vững</span>
              </h1>
              <p className="text-lg text-[#8b6a61] mb-8 max-w-lg">
                PetHub giúp bạn chuẩn hóa vận hành từ đặt lịch, chăm sóc khách hàng đến quản lý hồ sơ thú cưng.
                Mọi quy trình quan trọng được gom về một nền tảng duy nhất để tăng hiệu suất và giữ chân khách hàng.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#d56756] text-white hover:-translate-y-1 transition-all border border-[#592518]"
                >
                  Khám phá nền tảng
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#592518] hover:-translate-y-1 transition-all border border-[#592518]"
                >
                  Nhận tư vấn miễn phí
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-10">
                {[
                  { num: '12M+', label: 'Thú cưng VN' },
                  { num: '3,100+', label: 'Cửa hàng' },
                  { num: '95M$', label: 'Quy mô TT' },
                ].map(s => (
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
              <div className="relative rounded-3xl overflow-hidden border border-[#592518] aspect-[4/3]">
                <ImageWithFallback
                  src={heroClinicImage}
                  alt="PetHub Veterinary Care"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#592518]/30 to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 bg-white border border-[#592518] rounded-2xl p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
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

      {/* Wavy Divider */}
      <div className="relative h-12">
        <svg viewBox="0 0 1440 48" className="absolute w-full" preserveAspectRatio="none">
          <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="#f4ece4" />
        </svg>
      </div>

      {/* Services Preview */}
      <section id="services-section" className="bg-[#f4ece4] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-[#592518] mb-3" style={{ fontWeight: 700 }}>
              Dịch vụ của chúng tôi
            </h2>
            <p className="text-[#8b6a61] max-w-lg mx-auto">
              Danh mục dịch vụ được chuẩn hóa để khách hàng dễ đặt lịch và phòng khám dễ vận hành.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-[#592518] rounded-2xl p-6 text-center hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: s.color + '20' }}>
                  <s.icon className="w-7 h-7" style={{ color: s.color }} />
                </div>
                <p className="text-sm text-[#592518]" style={{ fontWeight: 500 }}>{s.name}</p>
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
      <section id="about-section" className="py-20">
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
                className="bg-white border border-[#592518] rounded-2xl p-6 hover:-translate-y-1 transition-all"
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
      <section id="pricing-section" className="bg-[#f4ece4] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl text-[#592518] mb-3" style={{ fontWeight: 700 }}>
              Bảng giá minh bạch
            </h2>
            <p className="text-[#8b6a61]">Bắt đầu miễn phí, nâng cấp khi sẵn sàng.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white border border-[#592518] rounded-2xl p-8">
              <h3 className="text-lg mb-1" style={{ fontWeight: 600 }}>Cơ bản</h3>
              <p className="text-3xl text-[#592518] mb-4" style={{ fontWeight: 700 }}>
                0 <span className="text-sm text-[#8b6a61]" style={{ fontWeight: 400 }}>VND/tháng</span>
              </p>
              <div className="space-y-3 mb-6">
                {['Giới hạn 50 hồ sơ', 'Tạo booking thủ công', 'Lưu lịch sử dịch vụ', '1 tài khoản admin'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#d56756]" />
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/register" className="block w-full text-center py-3 rounded-xl border border-[#592518] hover:-translate-y-0.5 transition-all">
                Bắt đầu miễn phí
              </Link>
            </div>
            {/* Premium */}
            <div className="bg-[#d56756] text-white border border-[#592518] rounded-2xl p-8 relative">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-[#c75b4c] text-white text-xs rounded-full border border-[#592518]">
                Phổ biến nhất
              </div>
              <h3 className="text-lg mb-1" style={{ fontWeight: 600 }}>Premium</h3>
              <p className="text-3xl mb-4" style={{ fontWeight: 700 }}>
                249.000 <span className="text-sm opacity-80" style={{ fontWeight: 400 }}>VND/tháng</span>
              </p>
              <div className="space-y-3 mb-6">
                {['Không giới hạn hồ sơ', 'Báo cáo doanh thu chi tiết', 'Đăng nhập Google OAuth', 'Nhắc lịch CRM tự động', 'Digital Pet Card & QR', 'Phân tích khách quay lại'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/register" className="block w-full text-center py-3 rounded-xl bg-white text-[#d56756] hover:-translate-y-0.5 transition-all border border-[#592518]" style={{ fontWeight: 600 }}>
                Dùng thử 14 ngày
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="py-20">
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
                className="bg-white border border-[#592518] rounded-2xl p-6"
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
      <section id="contact-section" className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-[#d56756] rounded-3xl p-12 border border-[#592518] relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <PawPrint className="w-32 h-32 text-white" />
            </div>
            <h2 className="text-3xl text-white mb-4" style={{ fontWeight: 700 }}>
              Sẵn sàng nâng cấp phòng khám?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Tham gia cùng hàng trăm cơ sở thú y đang sử dụng PetHub để tối ưu vận hành.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#d56756] hover:-translate-y-1 transition-all border border-[#592518]"
              style={{ fontWeight: 600 }}
            >
              Đăng ký ngay — Miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

