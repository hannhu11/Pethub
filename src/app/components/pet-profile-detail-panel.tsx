import type { Pet } from './data';

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

  const now = new Date('2026-03-10T00:00:00');
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
    <div className={`space-y-4 ${className}`}>
      <div className='grid grid-cols-2 gap-3'>
        {fields.map((item) => (
          <div key={item.label} className='p-3 bg-white rounded-xl border border-[#2d2a26]/10'>
            <p className='text-[10px] text-[#7a756e] mb-1 uppercase tracking-wider'>{item.label}</p>
            <p className='text-sm' style={{ fontWeight: 500 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {includeOwner ? (
        <div className='bg-white rounded-xl border border-[#2d2a26]/10 p-4'>
          <p className='text-[10px] text-[#7a756e] mb-2 uppercase tracking-wider'>Chủ sở hữu</p>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-[#c67d5b] flex items-center justify-center'>
              <span className='text-white text-xs' style={{ fontWeight: 600 }}>
                {pet.ownerName.split(' ').pop()?.charAt(0)}
              </span>
            </div>
            <div>
              <p className='text-sm' style={{ fontWeight: 500 }}>
                {pet.ownerName}
              </p>
              <p className='text-xs text-[#7a756e]'>{pet.ownerPhone}</p>
              <p className='text-xs text-[#7a756e]'>{pet.ownerEmail}</p>
            </div>
          </div>
        </div>
      ) : null}

      <p className='text-[10px] text-[#7a756e] font-mono'>ID: {pet.id}</p>
    </div>
  );
}
