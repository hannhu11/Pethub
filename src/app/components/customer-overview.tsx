import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, PawPrint, ChevronRight } from 'lucide-react';
import type { ApiAppointment, ApiPet } from '../types';
import { useAuthSession } from '../auth-session';
import { extractApiError } from '../lib/api-client';
import { getStatusLabel, isUpcoming, toDateLabel, toTimeLabel } from '../lib/format';
import { listAppointments, listPets } from '../lib/pethub-api';

export function CustomerOverviewPage() {
  const { session } = useAuthSession();
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [petData, appointmentData] = await Promise.all([listPets(), listAppointments()]);
        if (!mounted) {
          return;
        }
        setPets(petData);
        setAppointments(appointmentData);
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

  const nextAppointment = useMemo(() => {
    return appointments
      .filter((item) => isUpcoming(item.appointmentAt) && item.status !== 'cancelled' && item.status !== 'completed')
      .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime())[0];
  }, [appointments]);

  return (
    <div className='py-12'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-6 md:p-8 mb-6'>
          <h1 className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Chào mừng trở lại, {session.userName || 'Khách hàng PetHub'}
          </h1>
          <p className='text-[#7a756e] mt-2'>
            Theo dõi lịch hẹn, quản lý hồ sơ thú cưng và đặt lịch mới trong cùng một luồng.
          </p>
        </div>

        {error ? (
          <div className='rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 mb-6'>{error}</div>
        ) : null}

        <div className='grid lg:grid-cols-3 gap-6'>
          <section className='lg:col-span-2 bg-white border border-[#2d2a26] rounded-2xl p-6'>
            <h2 className='text-xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Lịch hẹn gần nhất
            </h2>

            {loading ? (
              <p className='text-sm text-[#7a756e]'>Đang tải dữ liệu lịch hẹn...</p>
            ) : null}

            {!loading && nextAppointment ? (
              <div className='border border-[#2d2a26]/20 rounded-xl p-4 bg-[#f0ede8]'>
                <p className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  {nextAppointment.service?.name || 'Dịch vụ'}
                </p>
                <p className='text-sm text-[#7a756e] mt-1'>
                  {toDateLabel(nextAppointment.appointmentAt)} - {toTimeLabel(nextAppointment.appointmentAt)} |{' '}
                  {nextAppointment.pet?.name || 'Thú cưng'}
                </p>
                <p className='mt-2 inline-flex px-3 py-1 rounded-xl border border-[#2d2a26]/20 bg-white text-xs'>
                  {getStatusLabel(nextAppointment.status)}
                </p>
              </div>
            ) : null}

            {!loading && !nextAppointment ? (
              <p className='text-sm text-[#7a756e]'>Bạn chưa có lịch hẹn nào.</p>
            ) : null}

            <div className='flex gap-3 mt-4'>
              <Link
                to='/customer/appointments'
                className='px-4 py-2 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] hover:-translate-y-0.5 transition-all'
              >
                Đặt lịch ngay
              </Link>
              <Link
                to='/customer/appointments'
                className='px-4 py-2 rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 transition-all'
              >
                Xem tất cả lịch hẹn
              </Link>
            </div>
          </section>

          <section className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Thú cưng của tôi
              </h2>
              <PawPrint className='w-5 h-5 text-[#6b8f5e]' />
            </div>

            {loading ? (
              <p className='text-sm text-[#7a756e]'>Đang tải danh sách thú cưng...</p>
            ) : (
              <div className='space-y-3'>
                {pets.slice(0, 4).map((pet) => (
                  <div key={pet.id} className='p-3 rounded-xl border border-[#2d2a26]/20 bg-[#faf9f6]'>
                    <p className='text-[#2d2a26]' style={{ fontWeight: 700 }}>{pet.name}</p>
                    <p className='text-xs text-[#7a756e] mt-1'>
                      {pet.species} | {pet.breed || 'Chưa cập nhật giống'}
                    </p>
                  </div>
                ))}
                {pets.length === 0 ? (
                  <p className='text-sm text-[#7a756e]'>Bạn chưa có hồ sơ thú cưng.</p>
                ) : null}
              </div>
            )}

            <Link to='/customer/my-pets' className='mt-4 inline-flex items-center gap-1 text-sm text-[#6b8f5e]'>
              Quản lý hồ sơ thú cưng
              <ChevronRight className='w-4 h-4' />
            </Link>
          </section>
        </div>

        <div className='grid sm:grid-cols-2 gap-4 mt-6'>
          <Link to='/customer/my-pets' className='bg-white border border-[#2d2a26] rounded-2xl p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3'>
            <PawPrint className='w-5 h-5 text-[#6b8f5e]' />
            <span className='text-sm'>Thú cưng của tôi</span>
            <ChevronRight className='w-4 h-4 ml-auto' />
          </Link>
          <Link to='/customer/appointments' className='bg-white border border-[#2d2a26] rounded-2xl p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3'>
            <CalendarDays className='w-5 h-5 text-[#c67d5b]' />
            <span className='text-sm'>Lịch hẹn</span>
            <ChevronRight className='w-4 h-4 ml-auto' />
          </Link>
        </div>
      </div>
    </div>
  );
}
