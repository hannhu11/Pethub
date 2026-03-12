import type { ApiPet, PetCardView } from '../types';
import { toDateInputValue } from './format';
import luckyImage from '../../assets/images/pets/lucky.jpg';
import mimiImage from '../../assets/images/pets/mimi.jpg';
import bongImage from '../../assets/images/pets/bong.jpg';

const knownImageMap: Record<string, string> = {
  '/assets/lucky.jpg': luckyImage,
  '/assets/mimi.jpg': mimiImage,
  '/assets/bong.jpg': bongImage,
};

function resolvePetImage(imageUrl: string | null, species: string): string {
  if (imageUrl && knownImageMap[imageUrl]) {
    return knownImageMap[imageUrl];
  }

  if (imageUrl && /^(https?:\/\/|data:)/.test(imageUrl)) {
    return imageUrl;
  }

  return species.toLowerCase().includes('mèo') ? mimiImage : luckyImage;
}

function toWeightLabel(weightKg: ApiPet['weightKg']): string {
  if (weightKg === null || weightKg === undefined || weightKg === '') {
    return 'Chưa cập nhật';
  }

  const numeric = Number(weightKg);
  if (Number.isNaN(numeric)) {
    return String(weightKg);
  }
  return `${numeric}kg`;
}

function toNeuteredValue(neutered: ApiPet['neutered']): boolean | null {
  if (neutered === 'yes') {
    return true;
  }
  if (neutered === 'no') {
    return false;
  }
  return null;
}

export function mapApiPetToCardView(pet: ApiPet): PetCardView {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? 'Chưa cập nhật',
    gender: pet.gender ?? 'Chưa cập nhật',
    dob: pet.dateOfBirth ? toDateInputValue(pet.dateOfBirth) : 'Chưa cập nhật',
    weight: toWeightLabel(pet.weightKg),
    color: pet.coatColor ?? 'Không có',
    microchipId: pet.microchipId ?? 'Không có',
    bloodType: pet.bloodType ?? 'Không có',
    neutered: toNeuteredValue(pet.neutered),
    specialNotes: pet.specialNotes ?? undefined,
    image: resolvePetImage(pet.imageUrl, pet.species),
    ownerName: pet.customer?.name ?? 'Chưa cập nhật',
    ownerPhone: pet.customer?.phone ?? 'Chưa cập nhật',
    ownerEmail: pet.customer?.email ?? 'chua-cap-nhat@pethub.vn',
    lastCheckup: pet.lastCheckupAt ? toDateInputValue(pet.lastCheckupAt) : 'Chưa cập nhật',
  };
}
