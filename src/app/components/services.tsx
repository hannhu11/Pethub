import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Clock, ChevronRight } from 'lucide-react';
import serviceCheckupImage from '../../assets/images/services/checkup.jpg';
import serviceSpaImage from '../../assets/images/services/spa.jpg';
import serviceGroomingImage from '../../assets/images/services/grooming.jpg';
import serviceVaccineImage from '../../assets/images/services/vaccine.jpg';
import serviceSpecialistImage from '../../assets/images/services/specialist.jpg';
import serviceBoardingImage from '../../assets/images/services/boarding.jpg';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { extractApiError } from '../lib/api-client';
import { resolveCatalogIcon } from '../lib/catalog-icons';
import { listCatalogServices } from '../lib/pethub-api';
import type { ApiService } from '../types';

const serviceImages = [
  serviceCheckupImage,
  serviceSpaImage,
  serviceGroomingImage,
  serviceVaccineImage,
  serviceSpecialistImage,
  serviceBoardingImage,
] as const;

function formatCurrency(value: number | string) {
  return `${Math.round(Number(value ?? 0)).toLocaleString('vi-VN')} ₫`;
}

function formatDuration(durationMin: number) {
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return 'Chưa cấu hình';
  }

  if (durationMin < 60) {
    return `${durationMin} phút`;
  }

  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listCatalogServices();
        if (mounted) {
          setServices(data);
        }
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
  }, []);

  return (
    <div className='py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <h1 className='text-3xl md:text-4xl text-[#592518] mb-3' style={{ fontWeight: 700 }}>
            Dịch vụ chăm sóc thú cưng
          </h1>
          <p className='text-[#8b6a61] max-w-lg mx-auto'>
            Danh mục dịch vụ được chuẩn hóa cho cửa hàng và phòng khám. Khi bấm đặt lịch, hệ thống sẽ chuyển bạn sang trang Lịch hẹn để hoàn tất booking.
          </p>
        </div>

        {error ? <div className='mb-6 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

        {loading ? (
          <div className='rounded-2xl border border-[#592518] bg-white p-5 text-sm text-[#8b6a61]'>
            Đang tải danh mục dịch vụ...
          </div>
        ) : null}

        {!loading && services.length === 0 ? (
          <div className='rounded-2xl border border-[#592518] bg-white p-5 text-sm text-[#8b6a61]'>
            Phòng khám chưa cập nhật dịch vụ. Vui lòng liên hệ quản trị viên để mở đặt lịch.
          </div>
        ) : null}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {services.map((service, index) => {
            const iconOption = resolveCatalogIcon(service.iconName);
            const Icon = iconOption.icon;
            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className='bg-white border border-[#592518] rounded-2xl overflow-hidden'
              >
                <div className='relative h-48 overflow-hidden'>
                  <ImageWithFallback
                    src={service.imageUrl || serviceImages[index % serviceImages.length]}
                    alt={service.name}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-[#592518]/50 to-transparent' />
                  <div className='absolute bottom-4 left-4'>
                    <div className='inline-flex items-center gap-1 px-3 py-1 bg-white/90 rounded-full text-xs border border-[#592518]/20'>
                      <Clock className='w-3 h-3' />
                      {formatDuration(service.durationMin)}
                    </div>
                  </div>
                </div>

                <div className='p-5'>
                  <div className='flex items-start gap-3 mb-3'>
                    <div
                      className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
                      style={{ backgroundColor: iconOption.bgColor }}
                    >
                      <Icon className='w-5 h-5' style={{ color: iconOption.color }} />
                    </div>
                    <div>
                      <h3 className='text-[#592518] mb-1' style={{ fontWeight: 700 }}>
                        {service.name}
                      </h3>
                      <p className='text-sm text-[#8b6a61]'>{service.description || 'Dịch vụ chăm sóc thú cưng theo chuẩn phòng khám.'}</p>
                    </div>
                  </div>

                  <div className='flex items-center justify-between pt-3 border-t border-[#592518]/10'>
                    <span className='text-lg text-[#d56756]' style={{ fontWeight: 700 }}>
                      {formatCurrency(service.price)}
                    </span>
                    <button
                      type='button'
                      onClick={() => navigate(`/customer/appointments?serviceId=${service.id}`)}
                      className='flex items-center gap-1 text-sm text-[#c75b4c] border border-[#592518] rounded-xl px-3 py-1.5 hover:-translate-y-0.5 active:translate-y-[2px] transition-transform'
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

