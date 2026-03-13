export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  dob: string;
  weight: string;
  color: string;
  microchipId: string;
  bloodType: string;
  neutered: boolean | null;
  vaccinationLevel: string;
  lastCheckup: string;
  specialNotes?: string;
  image: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  hasDigitalCard: boolean;
}
