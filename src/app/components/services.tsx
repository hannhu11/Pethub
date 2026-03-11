import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Stethoscope, Droplets, Scissors, Syringe, HeartPulse, Home, Clock, ChevronRight } from 'lucide-react';
import { mockServices, formatCurrency } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  droplets: Droplets,
  scissors: Scissors,
  syringe: Syringe,
  'heart-pulse': HeartPulse,
  home: Home,
};

export function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className='py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <h1 className='text-3xl md:text-4xl text-[#2d2a26] mb-3' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Dịch vụ chăm sóc thú cưng
          </h1>
          <p className='text-[#7a756e] max-w-lg mx-auto'>
            Danh mục dịch vụ được chuẩn hóa cho cửa hàng và phòng khám. Khi bấm đặt lịch, hệ thống sẽ chuyển bạn sang trang Lịch hẹn để hoàn tất booking.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {mockServices.map((service, index) => {
            const Icon = iconMap[service.icon] || Stethoscope;
            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden'
              >
                <div className='relative h-48 overflow-hidden'>
                  <ImageWithFallback
                    src={service.image}
                    alt={service.name}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-[#2d2a26]/50 to-transparent' />
                  <div className='absolute bottom-4 left-4'>
                    <div className='inline-flex items-center gap-1 px-3 py-1 bg-white/90 rounded-full text-xs border border-[#2d2a26]/20'>
                      <Clock className='w-3 h-3' />
                      {service.duration}
                    </div>
                  </div>
                </div>

                <div className='p-5'>
                  <div className='flex items-start gap-3 mb-3'>
                    <div className='w-10 h-10 rounded-xl bg-[#6b8f5e]/10 flex items-center justify-center flex-shrink-0'>
                      <Icon className='w-5 h-5 text-[#6b8f5e]' />
                    </div>
                    <div>
                      <h3 className='text-[#2d2a26] mb-1' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {service.name}
                      </h3>
                      <p className='text-sm text-[#7a756e]'>{service.description}</p>
                    </div>
                  </div>

                  <div className='flex items-center justify-between pt-3 border-t border-[#2d2a26]/10'>
                    <span className='text-lg text-[#6b8f5e]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {formatCurrency(service.price)}
                    </span>
                    <button
                      type='button'
                      onClick={() => navigate(`/customer/appointments?serviceId=${service.id}`)}
                      className='flex items-center gap-1 text-sm text-[#c67d5b] border border-[#2d2a26] rounded-xl px-3 py-1.5 hover:-translate-y-0.5 active:translate-y-[2px] transition-transform'
                    >
                      Đặt lịch
                      <ChevronRight className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}