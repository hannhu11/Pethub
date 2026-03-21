import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, PawPrint, ChevronRight } from 'lucide-react';
import { useAuthSession } from '../auth-session';
import { listAppointments, listPets } from '../lib/pethub-api';
import type { ApiAppointment, ApiPet } from '../types';
import { extractApiError } from '../lib/api-client';

function toDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function toTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Chờ xác nhận';
  if (status === 'confirmed') return 'Đã xác nhận';
  if (status === 'completed') return 'Hoàn thành';
  if (status === 'cancelled') return 'Đã hủy';
  return status;
}

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

  const nextAppointment = useMemo(
    () =>
      appointments
        .filter((item) => item.status !== 'cancelled')
        .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime())[0],
    [appointments],
  );

  return (
    <div className='py-12'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='bg-white border border-[#592518] rounded-2xl p-6 md:p-8 mb-6'>
          <h1 className='text-3xl text-[#592518]' style={{ fontWeight: 700 }}>
            Chào mừng trở lại, {session.user?.name || 'Khách hàng'}
          </h1>
          <p className='text-[#8b6a61] mt-2'>
            Theo dõi lịch hẹn, quản lý hồ sơ thú cưng và đặt lịch mới trong cùng một luồng.
          </p>
        </div>

        {error ? <div className='mb-6 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

        <div className='grid lg:grid-cols-3 gap-6'>
          <section className='lg:col-span-2 bg-white border border-[#592518] rounded-2xl p-6'>
            <h2 className='text-xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
              Lịch hẹn gần nhất
            </h2>

            {loading ? (
              <p className='text-sm text-[#8b6a61]'>Đang tải lịch hẹn...</p>
            ) : nextAppointment ? (
              <div className='border border-[#592518]/20 rounded-xl p-4 bg-[#f4ece4]'>
                <p className='text-lg text-[#592518]' style={{ fontWeight: 700 }}>
                  {nextAppointment.service?.name || 'Dịch vụ'}
                </p>
                <p className='text-sm text-[#8b6a61] mt-1'>
                  {toDateLabel(nextAppointment.appointmentAt)} - {toTimeLabel(nextAppointment.appointmentAt)} |{' '}
                  {nextAppointment.pet?.name || 'Thú cưng'}
                </p>
                <p className='mt-2 inline-flex px-3 py-1 rounded-xl border border-[#592518]/20 bg-white text-xs'>
                  {statusLabel(nextAppointment.status)}
                </p>
              </div>
            ) : (
              <p className='text-sm text-[#8b6a61]'>Bạn chưa có lịch hẹn nào.</p>
            )}

            <div className='flex gap-3 mt-4'>
              <Link
                to='/customer/appointments'
                className='px-4 py-2 rounded-xl bg-[#d56756] text-white border border-[#592518] hover:-translate-y-0.5 transition-all'
              >
                Đặt lịch ngay
              </Link>
              <Link
                to='/customer/appointments'
                className='px-4 py-2 rounded-xl border border-[#592518] hover:-translate-y-0.5 transition-all'
              >
                Xem tất cả lịch hẹn
              </Link>
            </div>
          </section>

          <section className='bg-white border border-[#592518] rounded-2xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl text-[#592518]' style={{ fontWeight: 700 }}>
                Thú cưng của tôi
              </h2>
              <PawPrint className='w-5 h-5 text-[#d56756]' />
            </div>

            <div className='space-y-3'>
              {pets.map((pet) => (
                <div key={pet.id} className='p-3 rounded-xl border border-[#592518]/20 bg-[#faf8f5]'>
                  <p className='text-[#592518]' style={{ fontWeight: 700 }}>
                    {pet.name}
                  </p>
                  <p className='text-xs text-[#8b6a61] mt-1'>
                    {pet.species} | {pet.breed || 'Chưa cập nhật giống'}
                  </p>
                </div>
              ))}
              {!loading && pets.length === 0 ? <p className='text-sm text-[#8b6a61]'>Bạn chưa có thú cưng nào.</p> : null}
            </div>

            <Link to='/customer/my-pets' className='mt-4 inline-flex items-center gap-1 text-sm text-[#d56756]'>
              Quản lý hồ sơ thú cưng
              <ChevronRight className='w-4 h-4' />
            </Link>
          </section>
        </div>

        <div className='grid sm:grid-cols-2 gap-4 mt-6'>
          <Link
            to='/customer/my-pets'
            className='bg-white border border-[#592518] rounded-2xl p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3'
          >
            <PawPrint className='w-5 h-5 text-[#d56756]' />
            <span className='text-sm'>Thú cưng của tôi</span>
            <ChevronRight className='w-4 h-4 ml-auto' />
          </Link>
          <Link
            to='/customer/appointments'
            className='bg-white border border-[#592518] rounded-2xl p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3'
          >
            <CalendarDays className='w-5 h-5 text-[#c75b4c]' />
            <span className='text-sm'>Lịch hẹn</span>
            <ChevronRight className='w-4 h-4 ml-auto' />
          </Link>
        </div>
      </div>
    </div>
  );
}

