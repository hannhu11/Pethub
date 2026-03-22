import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  CalendarClock,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Weight,
} from 'lucide-react';
import { extractApiError } from '../lib/api-client';
import {
  getPublicPetCard,
  type ApiPublicMedicalRecord,
  type ApiPublicPetCard,
} from '../lib/pethub-api';
import { ImageWithFallback } from './figma/ImageWithFallback';

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return 'Chưa cập nhật';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Chưa cập nhật';
  }

  return parsed.toLocaleDateString('vi-VN');
}

function formatWeightLabel(weightKg: ApiPublicPetCard['pet']['weightKg']) {
  if (weightKg === null || weightKg === undefined || weightKg === '') {
    return 'Chưa cập nhật';
  }

  const numeric = Number(weightKg);
  if (Number.isNaN(numeric)) {
    return String(weightKg);
  }

  return `${numeric}kg`;
}

function formatNeuteredLabel(value: ApiPublicPetCard['pet']['neutered']) {
  if (value === 'yes') return 'Đã triệt sản';
  if (value === 'no') return 'Chưa triệt sản';
  return 'Chưa cập nhật';
}

function mapMedicalRecordDisplay(record: ApiPublicMedicalRecord) {
  const symptoms = record.symptoms?.trim() ?? '';
  const diagnosis = record.diagnosis?.trim() ?? '';
  const treatment = record.treatment?.trim() ?? '';
  const diagnosisLower = diagnosis.toLowerCase();
  const treatmentLower = treatment.toLowerCase();
  const isServiceDiagnosis =
    diagnosisLower.startsWith('hoàn tất dịch vụ:') ||
    diagnosisLower.startsWith('hoan tat dich vu:') ||
    diagnosisLower.startsWith('dịch vụ sử dụng:') ||
    diagnosisLower.startsWith('dich vu su dung:') ||
    diagnosisLower.startsWith('dịch vụ:') ||
    diagnosisLower.startsWith('dich vu:');
  const isServiceLog =
    isServiceDiagnosis ||
    treatmentLower.includes('thực hiện dịch vụ') ||
    treatmentLower.includes('thuc hien dich vu') ||
    treatmentLower.includes('hoàn tất dịch vụ') ||
    treatmentLower.includes('hoan tat dich vu');
  const colonIndex = diagnosis.indexOf(':');
  const serviceName =
    isServiceLog && colonIndex >= 0 ? diagnosis.slice(colonIndex + 1).trim() : diagnosis;

  if (isServiceLog) {
    return {
      title: 'Dịch vụ gần đây',
      symptoms: '',
      primary: serviceName || diagnosis,
      secondary: treatment,
    };
  }

  return {
    title: 'Hồ sơ y tế',
    symptoms,
    primary: diagnosis || 'Chưa cập nhật',
    secondary: treatment || 'Chưa cập nhật',
  };
}

export function PublicPetCardPage() {
  const { petId } = useParams();
  const [card, setCard] = useState<ApiPublicPetCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!petId) {
        setLoading(false);
        setError('Không tìm thấy mã thú cưng.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const payload = await getPublicPetCard(petId);
        if (mounted) {
          setCard(payload);
        }
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
          setCard(null);
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
  }, [petId]);

  const ctaHref = useMemo(() => {
    if (card?.clinic.phone) {
      return `tel:${card.clinic.phone.replace(/\s+/g, '')}`;
    }

    return '/contact';
  }, [card?.clinic.phone]);

  const heroStats = card
    ? [
        { label: 'Ngày sinh', value: formatDateLabel(card.pet.dateOfBirth), icon: CalendarClock },
        { label: 'Cân nặng', value: formatWeightLabel(card.pet.weightKg), icon: Weight },
        { label: 'Triệt sản', value: formatNeuteredLabel(card.pet.neutered), icon: ShieldCheck },
      ]
    : [];

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top,#f8e6df_0%,#faf8f5_36%,#f4ece4_100%)] text-[#2e201a]'>
      <div className='absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,#592518_0%,#7a3c2d_45%,#d56756_100%)]' />

      <main className='relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5'>
        <div className='mb-4 flex items-center justify-between text-white'>
          <Link
            to='/'
            className='inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-sm backdrop-blur'
          >
            <ArrowLeft className='h-4 w-4' />
            PetHub
          </Link>
          {card ? (
            <span className='rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.24em] backdrop-blur'>
              {card.displayPetId}
            </span>
          ) : null}
        </div>

        {loading ? (
          <section className='mt-12 rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_24px_80px_rgba(89,37,24,0.16)] backdrop-blur'>
            <div className='h-52 animate-pulse rounded-[28px] bg-[#f1e2d7]' />
            <div className='mt-5 h-5 w-40 animate-pulse rounded-full bg-[#ead4c3]' />
            <div className='mt-3 h-4 w-28 animate-pulse rounded-full bg-[#ead4c3]' />
          </section>
        ) : null}

        {!loading && error ? (
          <section className='mt-12 rounded-[32px] border border-[#592518]/15 bg-white/90 p-6 shadow-[0_24px_80px_rgba(89,37,24,0.12)] backdrop-blur'>
            <p className='text-xs uppercase tracking-[0.24em] text-[#8b6a61]'>Digital Pet Card</p>
            <h1 className='mt-3 text-2xl text-[#592518]' style={{ fontWeight: 700 }}>
              Không thể mở hồ sơ thú cưng
            </h1>
            <p className='mt-3 text-sm leading-6 text-[#6f544a]'>{error}</p>
            <Link
              to='/contact'
              className='mt-6 inline-flex items-center justify-center rounded-2xl bg-[#592518] px-5 py-3 text-sm text-white'
            >
              Liên hệ PetHub
            </Link>
          </section>
        ) : null}

        {!loading && card ? (
          <>
            <section className='overflow-hidden rounded-[34px] border border-white/60 bg-white/88 shadow-[0_30px_90px_rgba(89,37,24,0.18)] backdrop-blur'>
              <div className='relative px-5 pb-6 pt-6'>
                <div className='absolute inset-x-0 top-0 h-36 bg-[linear-gradient(135deg,#592518_0%,#744234_52%,#d56756_100%)]' />
                <div className='relative'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='max-w-[65%] rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white backdrop-blur'>
                      Premium Identity
                    </div>
                    <div className='rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] text-white backdrop-blur'>
                      {card.clinic.name}
                    </div>
                  </div>

                  <div className='mt-8 flex flex-col items-center text-center'>
                    <div className='h-28 w-28 overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-[0_18px_40px_rgba(89,37,24,0.16)]'>
                      <ImageWithFallback
                        src={card.pet.imageUrl || ''}
                        alt={card.pet.name}
                        className='h-full w-full object-cover'
                      />
                    </div>

                    <h1 className='mt-5 text-3xl text-[#592518]' style={{ fontWeight: 700 }}>
                      {card.pet.name}
                    </h1>
                    <p className='mt-1 text-sm text-[#8b6a61]'>
                      {[card.pet.species, card.pet.breed || 'Chưa cập nhật giống'].join(' • ')}
                    </p>
                    <p className='mt-3 inline-flex items-center gap-2 rounded-full bg-[#f7ede7] px-3 py-1.5 text-xs text-[#7b5d52]'>
                      <Sparkles className='h-4 w-4 text-[#d56756]' />
                      Cập nhật gần nhất: {formatDateLabel(card.pet.lastCheckupAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className='grid gap-3 px-4 pb-4 sm:grid-cols-3'>
                {heroStats.map((item) => (
                  <div key={item.label} className='rounded-[24px] border border-[#592518]/10 bg-[#fffaf7] p-4'>
                    <item.icon className='h-4 w-4 text-[#d56756]' />
                    <p className='mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8b6a61]'>{item.label}</p>
                    <p className='mt-1 text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className='mt-4 rounded-[30px] border border-[#592518]/10 bg-white/92 p-5 shadow-[0_18px_48px_rgba(89,37,24,0.1)]'>
              <div className='flex items-center gap-2'>
                <HeartPulse className='h-5 w-5 text-[#d56756]' />
                <h2 className='text-lg text-[#592518]' style={{ fontWeight: 700 }}>
                  Thông tin thú cưng
                </h2>
              </div>

              <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                <div className='rounded-2xl bg-[#faf5f0] p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-[#8b6a61]'>Giới tính</p>
                  <p className='mt-1 text-[#592518]'>{card.pet.gender || 'Chưa cập nhật'}</p>
                </div>
                <div className='rounded-2xl bg-[#faf5f0] p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-[#8b6a61]'>Màu lông</p>
                  <p className='mt-1 text-[#592518]'>{card.pet.coatColor || 'Chưa cập nhật'}</p>
                </div>
                <div className='rounded-2xl bg-[#faf5f0] p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-[#8b6a61]'>Nhóm máu</p>
                  <p className='mt-1 text-[#592518]'>{card.pet.bloodType || 'Chưa cập nhật'}</p>
                </div>
                <div className='rounded-2xl bg-[#faf5f0] p-3'>
                  <p className='text-[11px] uppercase tracking-[0.14em] text-[#8b6a61]'>Microchip</p>
                  <p className='mt-1 text-[#592518]'>{card.pet.microchipId || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {card.pet.specialNotes ? (
                <div className='mt-4 rounded-2xl border border-[#d56756]/20 bg-[#fff4ef] p-4 text-sm text-[#6f544a]'>
                  <p className='text-[11px] uppercase tracking-[0.18em] text-[#d56756]'>Lưu ý chăm sóc</p>
                  <p className='mt-2 leading-6'>{card.pet.specialNotes}</p>
                </div>
              ) : null}
            </section>

            <section className='mt-4 rounded-[30px] border border-[#592518]/10 bg-white/92 p-5 shadow-[0_18px_48px_rgba(89,37,24,0.1)]'>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-5 w-5 text-[#d56756]' />
                <h2 className='text-lg text-[#592518]' style={{ fontWeight: 700 }}>
                  Hồ sơ y tế gần đây
                </h2>
              </div>

              <div className='mt-4 space-y-4'>
                {card.medical.items.length === 0 ? (
                  <div className='rounded-2xl border border-dashed border-[#592518]/20 bg-[#faf5f0] p-4 text-sm text-[#8b6a61]'>
                    Chưa có bản ghi y tế công khai cho thú cưng này.
                  </div>
                ) : null}

                {card.medical.items.map((record, index) => {
                  const view = mapMedicalRecordDisplay(record);

                  return (
                    <div key={`${record.recordedAt}-${index}`} className='flex gap-3'>
                      <div className='flex flex-col items-center'>
                        <div className='mt-1 h-3 w-3 rounded-full bg-[#d56756]' />
                        {index < card.medical.items.length - 1 ? (
                          <div className='mt-2 h-full w-px bg-[#e7d3c6]' />
                        ) : null}
                      </div>

                      <article className='flex-1 rounded-[24px] border border-[#592518]/10 bg-[#fffaf7] p-4'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='text-[11px] uppercase tracking-[0.18em] text-[#8b6a61]'>{view.title}</p>
                          <p className='text-xs text-[#8b6a61]'>{formatDateLabel(record.recordedAt)}</p>
                        </div>
                        {view.symptoms ? (
                          <p className='mt-2 text-sm leading-6 text-[#6f544a]'>
                            <span className='text-[#8b6a61]'>Triệu chứng:</span> {view.symptoms}
                          </p>
                        ) : null}
                        <p className='mt-2 text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                          {view.primary}
                        </p>
                        <p className='mt-2 text-sm leading-6 text-[#6f544a]'>{view.secondary}</p>
                        <p className='mt-3 text-xs text-[#8b6a61]'>
                          Lịch hẹn tiếp theo: {formatDateLabel(record.nextVisitAt)}
                        </p>
                      </article>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </main>

      {!loading && !error && card ? (
        <div className='fixed inset-x-0 bottom-0 z-20 border-t border-[#592518]/10 bg-white/92 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur'>
          {card.clinic.phone ? (
            <a
              href={ctaHref}
              className='mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-[22px] bg-[#d56756] px-4 py-4 text-sm text-white shadow-[0_16px_36px_rgba(213,103,86,0.35)]'
              style={{ fontWeight: 700 }}
            >
              <PhoneCall className='h-5 w-5' />
              Đặt lịch khám/Spa ngay
            </a>
          ) : (
            <Link
              to={ctaHref}
              className='mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-[22px] bg-[#592518] px-4 py-4 text-sm text-white shadow-[0_16px_36px_rgba(89,37,24,0.24)]'
              style={{ fontWeight: 700 }}
            >
              <PhoneCall className='h-5 w-5' />
              Liên hệ PetHub
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
