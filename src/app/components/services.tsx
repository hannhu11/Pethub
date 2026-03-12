import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Stethoscope,
  Droplets,
  Scissors,
  Syringe,
  HeartPulse,
  Home,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { ApiService } from '../types';
import { extractApiError } from '../lib/api-client';
import { formatCurrency } from '../lib/format';
import { listCatalogServices } from '../lib/pethub-api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import serviceCheckupImage from '../../assets/images/services/checkup.jpg';
import serviceSpaImage from '../../assets/images/services/spa.jpg';
import serviceGroomingImage from '../../assets/images/services/grooming.jpg';
import serviceVaccineImage from '../../assets/images/services/vaccine.jpg';
import serviceSpecialistImage from '../../assets/images/services/specialist.jpg';
import serviceBoardingImage from '../../assets/images/services/boarding.jpg';

const imageMap: Record<string, string> = {
  checkup: serviceCheckupImage,
  spa: serviceSpaImage,
  trim: serviceGroomingImage,
  vaccine: serviceVaccineImage,
  specialist: serviceSpecialistImage,
  boarding: serviceBoardingImage,
};

function resolveServiceImage(service: ApiService): string {
  const text = `${service.code} ${service.name}`.toLowerCase();
  if (text.includes('checkup') || text.includes('khám')) return imageMap.checkup;
  if (text.includes('spa') || text.includes('tắm')) return imageMap.spa;
  if (text.includes('trim') || text.includes('cắt')) return imageMap.trim;
  if (text.includes('vaccine') || text.includes('tiêm')) return imageMap.vaccine;
  if (text.includes('boarding') || text.includes('lưu chuồng')) return imageMap.boarding;
  return imageMap.specialist;
}

function resolveServiceIcon(service: ApiService): React.ElementType {
  const text = `${service.code} ${service.name}`.toLowerCase();
  if (text.includes('spa') || text.includes('tắm')) return Droplets;
  if (text.includes('trim') || text.includes('cắt')) return Scissors;
  if (text.includes('vaccine') || text.includes('tiêm')) return Syringe;
  if (text.includes('boarding') || text.includes('lưu chuồng')) return Home;
  if (text.includes('special') || text.includes('chuyên')) return HeartPulse;
  return Stethoscope;
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
          <h1 className='text-3xl md:text-4xl text-[#2d2a26] mb-3' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Dịch vụ chăm sóc thú cưng
          </h1>
          <p className='text-[#7a756e] max-w-lg mx-auto'>
            Danh mục dịch vụ được đồng bộ trực tiếp từ hệ thống quản lý cửa hàng.
          </p>
        </div>

        {loading ? (
          <div className='rounded-2xl border border-[#2d2a26] bg-white p-6 text-center text-sm text-[#7a756e]'>
            Đang tải danh mục dịch vụ...
          </div>
        ) : null}

        {error ? (
          <div className='rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 mb-6'>{error}</div>
        ) : null}

        {!loading && !error && services.length === 0 ? (
          <div className='rounded-2xl border border-[#2d2a26] bg-white p-6 text-center text-sm text-[#7a756e]'>
            Chưa có dịch vụ nào đang mở bán.
          </div>
        ) : null}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {services.map((service, index) => {
            const Icon = resolveServiceIcon(service);
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
                    src={resolveServiceImage(service)}
                    alt={service.name}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-[#2d2a26]/50 to-transparent' />
                  <div className='absolute bottom-4 left-4'>
                    <div className='inline-flex items-center gap-1 px-3 py-1 bg-white/90 rounded-full text-xs border border-[#2d2a26]/20'>
                      <Clock className='w-3 h-3' />
                      {service.durationMin} phút
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
                      <p className='text-sm text-[#7a756e]'>{service.description || 'Dịch vụ tiêu chuẩn của PetHub.'}</p>
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
