import type { Pet } from './pet-types';

type PetProfileDetailPanelProps = {
  pet: Pet;
  includeOwner?: boolean;
  className?: string;
};

function normalizeNoneText(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === 'none' || normalized === 'không có';
}

function getPetAgeLabel(dob: string) {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return 'Chưa rõ';
  }

  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();

  if (now.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) return `${Math.max(months, 1)} tháng`;
  if (months === 0) return `${years} tuổi`;
  return `${years} tuổi ${months} tháng`;
}

export function PetProfileDetailPanel({ pet, includeOwner = true, className = '' }: PetProfileDetailPanelProps) {
  const neuteredLabel =
    pet.neutered === true ? 'Đã triệt sản' : pet.neutered === false ? 'Chưa triệt sản' : 'Không rõ';
  const ownerInitial = pet.ownerName.trim().charAt(0).toUpperCase() || 'P';

  const fields = [
    { label: 'Loài', value: pet.species },
    { label: 'Giống', value: pet.breed },
    { label: 'Giới tính', value: pet.gender },
    { label: 'Ngày sinh', value: pet.dob },
    { label: 'Cân nặng', value: pet.weight },
    { label: 'Tuổi', value: getPetAgeLabel(pet.dob) },
    { label: 'Màu lông', value: normalizeNoneText(pet.color) ? 'Không có' : pet.color },
    { label: 'Nhóm máu', value: normalizeNoneText(pet.bloodType) ? 'Không có' : pet.bloodType },
    { label: 'Microchip', value: normalizeNoneText(pet.microchipId) ? 'Không có' : pet.microchipId },
    { label: 'Triệt sản', value: neuteredLabel },
    { label: 'Lưu ý', value: pet.specialNotes || 'Không có' },
  ];

  return (
    <div className={`space-y-5 ${className}`}>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {fields.map((item) => (
          <div
            key={item.label}
            className='px-4 py-3 bg-white/95 rounded-2xl border border-[#592518]/10 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]'
          >
            <p className='text-[10px] text-[#8b6a61] mb-1.5 uppercase tracking-[0.14em]'>{item.label}</p>
            <p className='text-lg leading-6 text-[#1f1d1a]' style={{ fontWeight: 600 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {includeOwner ? (
        <div className='bg-[linear-gradient(180deg,#ffffff_0%,#f9f7f2_100%)] rounded-2xl border border-[#592518]/10 p-4 shadow-[0_8px_18px_rgba(45,42,38,0.06)]'>
          <p className='text-[10px] text-[#8b6a61] mb-2 uppercase tracking-[0.14em]'>Chủ sở hữu</p>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-2xl bg-[#c75b4c] border border-[#592518]/20 flex items-center justify-center shadow-sm'>
              <span className='text-white text-sm' style={{ fontWeight: 700 }}>
                {ownerInitial}
              </span>
            </div>
            <div>
              <p className='text-base text-[#592518]' style={{ fontWeight: 700 }}>
                {pet.ownerName}
              </p>
              <p className='text-sm text-[#8b6a61]'>{pet.ownerPhone}</p>
              <p className='text-sm text-[#8b6a61]'>{pet.ownerEmail}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className='rounded-xl border border-dashed border-[#592518]/20 bg-white/70 px-3 py-2'>
        <p className='text-[10px] text-[#8b6a61] uppercase tracking-[0.14em] mb-1'>ID hồ sơ</p>
        <p className='text-xs text-[#8b6a61] font-mono break-all'>{pet.id}</p>
      </div>
    </div>
  );
}
