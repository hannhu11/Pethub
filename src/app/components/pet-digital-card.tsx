import { ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Pet } from './pet-types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { cn } from './ui/utils';
import { formatPetDisplayId, getPublicPetCardUrl } from '../lib/pet-id';

type PetDigitalCardProps = {
  pet: Pet;
  className?: string;
};

export function PetDigitalCard({ pet, className }: PetDigitalCardProps) {
  const formatFieldValue = (value: string | null | undefined) => {
    if (!value || value.toLowerCase() === 'none') {
      return 'Không có';
    }
    return value;
  };

  const neuteredLabel =
    pet.neutered === true ? 'Đã triệt sản' : pet.neutered === false ? 'Chưa triệt sản' : 'Không rõ';
  const specialNotes = pet.specialNotes ? pet.specialNotes.slice(0, 55) : '';
  const displayPetId = pet.displayPetId ?? formatPetDisplayId(pet.id);
  const publicCardUrl = getPublicPetCardUrl(pet.id);

  const ownerData = [
    { label: 'Họ và tên', value: pet.ownerName },
    { label: 'Số điện thoại', value: pet.ownerPhone },
    { label: 'Email', value: pet.ownerEmail },
  ];

  const petData = [
    { label: 'Loài', value: pet.species },
    { label: 'Giới tính', value: pet.gender },
    { label: 'Ngày sinh', value: pet.dob },
    { label: 'Cân nặng', value: pet.weight },
    { label: 'Màu lông', value: formatFieldValue(pet.color) },
    { label: 'Nhóm máu', value: formatFieldValue(pet.bloodType) },
    { label: 'Microchip', value: formatFieldValue(pet.microchipId) },
    { label: 'Triệt sản', value: neuteredLabel },
  ];

  return (
    <div className={cn('rounded-3xl overflow-hidden border border-[#592518] relative bg-[#1f2327] text-white shadow-none', className)}>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,#8a6d5e_0%,transparent_38%),radial-gradient(circle_at_bottom_left,#5b7a67_0%,transparent_40%)] opacity-70' />
      <div className='absolute inset-0 opacity-15' style={{ backgroundImage: 'linear-gradient(115deg, transparent 0%, #ffffff 45%, transparent 85%)' }} />

      <div className='relative z-10 p-6 md:p-7'>
        <div className='flex flex-col md:flex-row gap-6'>
          <div className='flex-1 flex flex-col'>
            <div className='flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-white/85'>
              <ShieldCheck className='w-4 h-4 text-[#8fb39f]' />
              Premium Identity
            </div>

            <div className='mt-4 flex items-start gap-4'>
              <div className='w-24 h-24 rounded-full overflow-hidden border border-white/70'>
                <ImageWithFallback src={pet.image} alt={pet.name} className='w-full h-full object-cover' />
              </div>
              <div>
                <h2 className='text-3xl leading-tight' style={{ fontWeight: 700 }}>
                  {pet.name}
                </h2>
                <p className='text-sm text-white/85 mt-1'>{pet.breed}</p>
                <p className='text-xs text-white/75 mt-0.5'>PET ID</p>
                <p className='text-sm tracking-[0.22em] font-mono text-white'>{displayPetId}</p>
              </div>
            </div>
          </div>

          <div className='w-[150px] flex flex-col items-center justify-between'>
            <div className='w-[124px] h-[124px] bg-white rounded-2xl border border-white/90 p-2'>
              <QRCodeSVG
                value={publicCardUrl}
                size={108}
                level='M'
              />
            </div>
            <p className='text-[11px] text-white/80 text-center leading-4'>Last checkup: {pet.lastCheckup}</p>
          </div>
        </div>

        <div className='mt-6 grid gap-3 md:grid-cols-2'>
          <section className='rounded-2xl border border-white/25 bg-white/10 p-3'>
            <p className='text-[11px] uppercase tracking-[0.12em] text-white/75 mb-2'>Chủ thú cưng</p>
            <div className='space-y-1.5'>
              {ownerData.map((item) => (
                <div key={item.label} className='flex justify-between gap-3 text-xs'>
                  <span className='text-white/70'>{item.label}</span>
                  <span className='text-right'>{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className='rounded-2xl border border-white/25 bg-white/10 p-3'>
            <p className='text-[11px] uppercase tracking-[0.12em] text-white/75 mb-2'>Thông tin thú cưng</p>
            <div className='grid grid-cols-2 gap-x-3 gap-y-1.5'>
              {petData.map((item) => (
                <div key={item.label} className='text-xs'>
                  <p className='text-white/65'>{item.label}</p>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {specialNotes && (
          <p className='mt-3 text-xs text-white/85' style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            <span className='text-white/65'>Lưu ý:</span> {specialNotes}
          </p>
        )}
      </div>
    </div>
  );
}

