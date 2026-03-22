import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Download,
  Edit3,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { ApiCustomer, ApiPet, CustomerSegment } from '../types';
import type { Pet } from './pet-types';
import { extractApiError } from '../lib/api-client';
import { formatCurrency, getStatusColor, getStatusLabel, toDateLabel, toTimeLabel } from '../lib/format';
import {
  createCustomer,
  generateClinicalNotes,
  createMedicalRecord,
  createPet,
  deleteMedicalRecord,
  getCustomerById,
  getCustomerSegmentSettings,
  getPetDigitalCard,
  listCustomers,
  listMedicalRecords,
  listPets,
  regeneratePetDigitalCard,
  updateMedicalRecord,
  updateCustomerSegmentSettings,
  updatePet,
  type ApiDigitalCard,
  type ApiMedicalRecord,
  type ApiCustomerTierSettings,
} from '../lib/pethub-api';
import { mapApiPetToCardView } from '../lib/view-models';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PetProfileDetailPanel } from './pet-profile-detail-panel';
import { PetDigitalCard } from './pet-digital-card';
import { downloadElementAsPng } from './export-utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

type PetFormState = {
  id: string | null;
  existingOwner: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  imageUrl: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petGender: string;
  petDob: string;
  petWeight: string;
  coatColor: string;
  bloodType: string;
  neutered: 'yes' | 'no' | 'none';
  microchipId: string;
  specialNotes: string;
};

const emptyPetForm: PetFormState = {
  id: null,
  existingOwner: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  imageUrl: '',
  petName: '',
  petSpecies: 'Chó',
  petBreed: '',
  petGender: '',
  petDob: '',
  petWeight: '',
  coatColor: '',
  bloodType: 'none',
  neutered: 'none',
  microchipId: '',
  specialNotes: '',
};

type DetailTab = 'info' | 'medical' | 'card';
type OwnerMode = 'existing' | 'new';
type MedicalFormMode = 'create' | 'edit';

type MedicalFormState = {
  date: string;
  doctorName: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  nextVisitAt: string;
};

const emptyMedicalForm: MedicalFormState = {
  date: '',
  doctorName: '',
  symptoms: '',
  diagnosis: '',
  treatment: '',
  notes: '',
  nextVisitAt: '',
};

type TierSettingsFormState = {
  regular: string;
  loyal: string;
  vip: string;
};

const emptyTierSettingsForm: TierSettingsFormState = {
  regular: '',
  loyal: '',
  vip: '',
};

function segmentLabel(segment: CustomerSegment) {
  if (segment === 'vip') return 'Khách VIP';
  if (segment === 'loyal') return 'Thân thiết';
  if (segment === 'regular') return 'Khách thường';
  return 'Khách mới';
}

function segmentClass(segment: CustomerSegment) {
  if (segment === 'vip') return 'bg-amber-100 text-amber-800 border-amber-300';
  if (segment === 'loyal') return 'bg-[#d56756]/10 text-[#d56756] border-[#d56756]/30';
  if (segment === 'regular') return 'bg-[#f4ece4] text-[#8b6a61] border-[#592518]/10';
  return 'bg-emerald-100 text-emerald-700 border-emerald-300';
}

function normalizeThresholdInput(value: string) {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

function formatThresholdInput(value: string) {
  if (!value) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(value));
}

function mapTierSettingsToForm(settings: ApiCustomerTierSettings): TierSettingsFormState {
  return {
    regular: String(Math.trunc(Number(settings.regularMinSpent))),
    loyal: String(Math.trunc(Number(settings.loyalMinSpent))),
    vip: String(Math.trunc(Number(settings.vipMinSpent))),
  };
}

function toDateInput(value: string | null | undefined) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function toIsoStartOfDay(value: string) {
  return `${value}T00:00:00.000Z`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc ảnh.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

const MAX_PET_IMAGE_PAYLOAD_BYTES = 700_000;

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.floor((base64.length * 3) / 4);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể xử lý ảnh tải lên.'));
    };
    image.src = objectUrl;
  });
}

async function optimizePetImageForUpload(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  if (estimateDataUrlBytes(originalDataUrl) <= MAX_PET_IMAGE_PAYLOAD_BYTES) {
    return originalDataUrl;
  }

  const source = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  const maxDimension = 1200;
  const largerEdge = Math.max(source.naturalWidth, source.naturalHeight);
  let width = source.naturalWidth;
  let height = source.naturalHeight;
  if (largerEdge > maxDimension) {
    const ratio = maxDimension / largerEdge;
    width = Math.max(320, Math.round(width * ratio));
    height = Math.max(320, Math.round(height * ratio));
  }

  const qualitySteps = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.4];
  let bestAttempt = originalDataUrl;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    canvas.width = Math.max(320, Math.round(width));
    canvas.height = Math.max(320, Math.round(height));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    for (const quality of qualitySteps) {
      const output = canvas.toDataURL('image/jpeg', quality);
      bestAttempt = output;
      if (estimateDataUrlBytes(output) <= MAX_PET_IMAGE_PAYLOAD_BYTES) {
        return output;
      }
    }

    width *= 0.82;
    height *= 0.82;
  }

  return bestAttempt;
}

function formatRecordDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function syncTextareaHeight(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = '0px';
  element.style.height = `${element.scrollHeight}px`;
}

function mapMedicalRecordDisplay(record: ApiMedicalRecord) {
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
      symptoms: '',
      primaryLabel: 'Dịch vụ sử dụng',
      primaryValue: serviceName || diagnosis,
      secondaryLabel: 'Chi tiết thực hiện',
      secondaryValue: treatment,
    };
  }

  return {
    symptoms,
    primaryLabel: 'Chẩn đoán',
    primaryValue: diagnosis,
    secondaryLabel: 'Điều trị',
    secondaryValue: treatment,
  };
}

function mapApiPetToUiPet(pet: ApiPet): Pet {
  const view = mapApiPetToCardView(pet);
  return {
    ...view,
    ownerId: pet.customerId,
    vaccinationLevel: 'N/A',
    hasDigitalCard: true,
  };
}

function mapDigitalCardToUiPet(card: ApiDigitalCard): Pet {
  const neutered =
    card.pet.neutered === 'yes' ? true : card.pet.neutered === 'no' ? false : null;

  return {
    id: card.pet.id,
    name: card.pet.name,
    species: card.pet.species,
    breed: card.pet.breed ?? 'Chưa cập nhật',
    gender: card.pet.gender ?? 'Chưa cập nhật',
    dob: toDateInput(card.pet.dateOfBirth) || 'Chưa cập nhật',
    weight:
      card.pet.weightKg === null || card.pet.weightKg === undefined
        ? 'Chưa cập nhật'
        : `${Number(card.pet.weightKg)}kg`,
    color: card.pet.coatColor ?? 'Không có',
    microchipId: card.pet.microchipId ?? 'Không có',
    bloodType: card.pet.bloodType ?? 'Không có',
    neutered,
    vaccinationLevel: 'N/A',
    lastCheckup: toDateInput(card.pet.lastCheckupAt) || 'Chưa cập nhật',
    specialNotes: card.pet.specialNotes ?? undefined,
    image: mapApiPetToCardView({
      ...card.pet,
      customerId: card.owner.id,
      createdAt: '',
      updatedAt: '',
      customer: {
        id: card.owner.id,
        name: card.owner.name,
        phone: card.owner.phone,
        email: card.owner.email,
      },
    } as ApiPet).image,
    ownerId: card.owner.id,
    ownerName: card.owner.name,
    ownerPhone: card.owner.phone,
    ownerEmail: card.owner.email ?? 'chua-cap-nhat@pethub.vn',
    hasDigitalCard: true,
  };
}

export function ManagerPetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('existing');
  const [petFormMode, setPetFormMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<PetFormState>(emptyPetForm);
  const [medicalRecords, setMedicalRecords] = useState<ApiMedicalRecord[]>([]);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [medicalFormOpen, setMedicalFormOpen] = useState(false);
  const [medicalFormMode, setMedicalFormMode] = useState<MedicalFormMode>('create');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [medicalForm, setMedicalForm] = useState<MedicalFormState>(emptyMedicalForm);
  const [medicalSaving, setMedicalSaving] = useState(false);
  const [medicalAiLoading, setMedicalAiLoading] = useState(false);
  const [digitalCard, setDigitalCard] = useState<ApiDigitalCard | null>(null);
  const [digitalCardLoading, setDigitalCardLoading] = useState(false);
  const [digitalCardSyncing, setDigitalCardSyncing] = useState(false);
  const cardCaptureRef = useRef<HTMLDivElement | null>(null);
  const symptomsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const diagnosisTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const treatmentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const loadInFlightRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useMemo(
    () => async (silent = false) => {
      if (loadInFlightRef.current) {
        return;
      }
      loadInFlightRef.current = true;
      if (!silent) {
        setLoading(true);
        setError('');
      }
      try {
        const [petData, customerData] = await Promise.all([listPets(), listCustomers()]);
        setPets(petData);
        setCustomers(customerData);
        setSelectedPetId((current) => {
          if (current && petData.some((pet) => pet.id === current)) {
            return current;
          }
          return null;
        });
        setError('');
      } catch (apiError) {
        if (!silent) {
          setError(extractApiError(apiError));
        }
      } finally {
        loadInFlightRef.current = false;
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadData(false);

    const onFocus = () => {
      void loadData(true);
    };
    window.addEventListener('focus', onFocus);

    const timer = window.setInterval(() => {
      void loadData(true);
    }, 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [loadData]);

  useEffect(() => {
    if (loading || searchParams.get('action') !== 'quick-add') {
      return;
    }

    setPetFormMode('create');
    setOwnerMode('existing');
    setForm({ ...emptyPetForm, existingOwner: customers[0]?.id || '' });
    setDrawerOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  }, [customers, loading, searchParams, setSearchParams]);

  const filteredPets = pets.filter((pet) => {
    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      pet.name.toLowerCase().includes(keyword) ||
      pet.id.toLowerCase().includes(keyword) ||
      pet.customer?.name?.toLowerCase().includes(keyword) ||
      pet.customer?.phone?.includes(keyword);
    const matchesCustomer = customerFilter === 'all' || pet.customerId === customerFilter;
    return matchesKeyword && matchesCustomer;
  });

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? null,
    [pets, selectedPetId],
  );
  const selectedUiPet = selectedPet ? mapApiPetToUiPet(selectedPet) : null;
  const selectedCardPet = digitalCard ? mapDigitalCardToUiPet(digitalCard) : selectedUiPet;
  const medicalEditorActive = detailTab === 'medical' && medicalFormOpen;

  useEffect(() => {
    if (!medicalFormOpen) {
      return;
    }

    [
      symptomsTextareaRef.current,
      diagnosisTextareaRef.current,
      treatmentTextareaRef.current,
      notesTextareaRef.current,
    ].forEach(syncTextareaHeight);
  }, [
    medicalFormOpen,
    medicalForm.symptoms,
    medicalForm.diagnosis,
    medicalForm.treatment,
    medicalForm.notes,
  ]);

  useEffect(() => {
    if (detailTab !== 'medical' || !selectedPetId) {
      return;
    }
    let mounted = true;
    const run = async () => {
      setMedicalLoading(true);
      try {
        const records = await listMedicalRecords(selectedPetId);
        if (mounted) {
          setMedicalRecords(records);
        }
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      } finally {
        if (mounted) {
          setMedicalLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [detailTab, selectedPetId]);

  useEffect(() => {
    if (detailTab !== 'card' || !selectedPetId) {
      return;
    }
    let mounted = true;
    const run = async () => {
      setDigitalCardLoading(true);
      try {
        const data = await getPetDigitalCard(selectedPetId);
        if (mounted) {
          setDigitalCard(data);
        }
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      } finally {
        if (mounted) {
          setDigitalCardLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [detailTab, selectedPetId]);

  const openCreate = () => {
    setPetFormMode('create');
    setOwnerMode('existing');
    setForm({ ...emptyPetForm, existingOwner: customers[0]?.id || '' });
    setDrawerOpen(true);
  };

  const openEdit = (pet: ApiPet) => {
    setPetFormMode('edit');
    setOwnerMode('existing');
    setForm({
      id: pet.id,
      existingOwner: pet.customerId,
      ownerName: pet.customer?.name ?? '',
      ownerPhone: pet.customer?.phone ?? '',
      ownerEmail: pet.customer?.email ?? '',
      imageUrl: pet.imageUrl ?? '',
      petName: pet.name,
      petSpecies: pet.species,
      petBreed: pet.breed ?? '',
      petGender: pet.gender ?? '',
      petDob: toDateInput(pet.dateOfBirth),
      petWeight: pet.weightKg ? String(Number(pet.weightKg)) : '',
      coatColor: pet.coatColor ?? '',
      bloodType: pet.bloodType ?? 'none',
      neutered: pet.neutered ?? 'none',
      microchipId: pet.microchipId ?? '',
      specialNotes: pet.specialNotes ?? '',
    });
    setDrawerOpen(true);
  };

  const handlePetImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await optimizePetImageForUpload(file);
      if (estimateDataUrlBytes(dataUrl) > MAX_PET_IMAGE_PAYLOAD_BYTES) {
        throw new Error('Ảnh quá lớn sau khi nén. Vui lòng chọn ảnh nhẹ hơn để lưu hồ sơ.');
      }
      setForm((prev) => ({
        ...prev,
        imageUrl: dataUrl,
      }));
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      event.target.value = '';
    }
  };

  const savePet = async () => {
    if (!form.petName.trim()) {
      setError('Vui lòng nhập tên thú cưng.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      let customerId = form.existingOwner;
      if (ownerMode === 'new') {
        if (!form.ownerName.trim() || !form.ownerPhone.trim()) {
          setError('Vui lòng nhập họ tên và số điện thoại chủ nuôi.');
          setSaving(false);
          return;
        }
        const createdCustomer = await createCustomer({
          name: form.ownerName.trim(),
          phone: form.ownerPhone.trim(),
          email: form.ownerEmail.trim() || undefined,
        });
        customerId = createdCustomer.id;
      }

      if (!customerId) {
        setError('Vui lòng chọn chủ sở hữu cho thú cưng.');
        setSaving(false);
        return;
      }

      const payload = {
        customerId,
        imageUrl: form.imageUrl.trim() || undefined,
        name: form.petName.trim(),
        species: form.petSpecies.trim(),
        breed: form.petBreed.trim() || undefined,
        gender: form.petGender.trim() || undefined,
        dateOfBirth: form.petDob || undefined,
        weightKg: form.petWeight ? Number(form.petWeight) : undefined,
        coatColor: form.coatColor.trim() || undefined,
        bloodType: form.bloodType.trim() || undefined,
        neutered: form.neutered,
        microchipId: form.microchipId.trim() || undefined,
        specialNotes: form.specialNotes.trim().slice(0, 55) || undefined,
      };

      if (form.id) {
        const updated = await updatePet(form.id, payload);
        setPets((prev) => prev.map((pet) => (pet.id === updated.id ? updated : pet)));
        setSelectedPetId(updated.id);
        setMessage('Đã cập nhật hồ sơ thú cưng.');
      } else {
        const created = await createPet(payload);
        setPets((prev) => [created, ...prev]);
        setSelectedPetId(created.id);
        setMessage(ownerMode === 'new' ? 'Đã thêm Walk-in (chủ + thú cưng).' : 'Đã tạo hồ sơ thú cưng mới.');
      }

      setDrawerOpen(false);
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSaving(false);
    }
  };

  const openCreateMedicalForm = () => {
    setMedicalFormMode('create');
    setEditingRecordId(null);
    setMedicalForm({
      ...emptyMedicalForm,
      date: toDateInput(new Date().toISOString()),
    });
    setMedicalFormOpen(true);
  };

  const openEditMedicalForm = (record: ApiMedicalRecord) => {
    setMedicalFormMode('edit');
    setEditingRecordId(record.id);
    setMedicalForm({
      date: toDateInput(record.recordedAt),
      doctorName: record.doctorName ?? '',
      symptoms: record.symptoms ?? '',
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes ?? '',
      nextVisitAt: toDateInput(record.nextVisitAt),
    });
    setMedicalFormOpen(true);
  };

  const closeMedicalForm = () => {
    if (medicalSaving || medicalAiLoading) {
      return;
    }
    setMedicalFormOpen(false);
    setMedicalForm(emptyMedicalForm);
    setEditingRecordId(null);
    setMedicalFormMode('create');
  };

  const generateMedicalDraft = async () => {
    if (!medicalForm.symptoms.trim()) {
      setError('Vui lòng nhập mô tả triệu chứng ở ô Triệu chứng để AI hỗ trợ.');
      return;
    }

    setMedicalAiLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await generateClinicalNotes({
        rawNotes: medicalForm.symptoms.trim(),
        petContext: selectedPet
          ? {
              name: selectedPet.name,
              species: selectedPet.species,
              breed: selectedPet.breed ?? undefined,
              gender: selectedPet.gender ?? undefined,
              dateOfBirth: selectedPet.dateOfBirth ?? undefined,
              weightKg: selectedPet.weightKg ? Number(selectedPet.weightKg) : undefined,
            }
          : undefined,
      });

      setMedicalForm((prev) => ({
        ...prev,
        diagnosis: result.diagnosis,
        treatment: result.treatment,
        notes: result.notes,
      }));
      setMessage('AI đã soạn nháp bệnh án. Vui lòng kiểm tra lại trước khi lưu.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setMedicalAiLoading(false);
    }
  };

  const saveMedical = async () => {
    if (!selectedPetId) {
      return;
    }
    if (!medicalForm.date || !medicalForm.diagnosis.trim() || !medicalForm.treatment.trim()) {
      setError('Bệnh án cần có ngày khám, chẩn đoán và hướng điều trị.');
      return;
    }

    setMedicalSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        doctorName: medicalForm.doctorName.trim() || undefined,
        symptoms: medicalForm.symptoms.trim() || undefined,
        diagnosis: medicalForm.diagnosis.trim(),
        treatment: medicalForm.treatment.trim(),
        notes: medicalForm.notes.trim() || undefined,
        nextVisitAt: medicalForm.nextVisitAt ? toIsoStartOfDay(medicalForm.nextVisitAt) : undefined,
        recordedAt: toIsoStartOfDay(medicalForm.date),
      };

      if (medicalFormMode === 'edit' && editingRecordId) {
        await updateMedicalRecord(selectedPetId, editingRecordId, payload);
        setMessage('Đã cập nhật bệnh án.');
      } else {
        await createMedicalRecord(selectedPetId, payload);
        setMessage('Đã thêm bệnh án mới.');
      }

      const records = await listMedicalRecords(selectedPetId);
      setMedicalRecords(records);
      closeMedicalForm();
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setMedicalSaving(false);
    }
  };

  const removeMedical = async (recordId: string) => {
    if (!selectedPetId) {
      return;
    }
    if (!window.confirm('Xóa bệnh án này? Hành động không thể hoàn tác.')) {
      return;
    }

    try {
      await deleteMedicalRecord(selectedPetId, recordId);
      setMedicalRecords((prev) => prev.filter((record) => record.id !== recordId));
      setMessage('Đã xóa bệnh án.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    }
  };

  const refreshDigitalCard = async () => {
    if (!selectedPetId) {
      return;
    }
    setDigitalCardLoading(true);
    setError('');
    try {
      const data = await getPetDigitalCard(selectedPetId);
      setDigitalCard(data);
      setMessage('Đã cập nhật Digital Card từ hồ sơ thật.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setDigitalCardLoading(false);
    }
  };

  const recreateDigitalCard = async () => {
    if (!selectedPetId) {
      return;
    }
    setDigitalCardSyncing(true);
    setError('');
    try {
      const data = await regeneratePetDigitalCard(selectedPetId, 'manager-regenerate');
      setDigitalCard(data);
      setMessage('Đã tạo lại Digital Card.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setDigitalCardSyncing(false);
    }
  };

  const downloadCard = async () => {
    if (!cardCaptureRef.current || !selectedPet) {
      return;
    }

    try {
      await downloadElementAsPng(cardCaptureRef.current, {
        fileName: `digital-card-${selectedPet.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        backgroundColor: '#592518',
      });
      setMessage('Đã tải Digital Card (PNG).');
    } catch {
      setError('Không thể tải PNG lúc này. Vui lòng thử lại.');
    }
  };

  return (
    <div className='space-y-5'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#592518]' style={{ fontWeight: 700 }}>
            Quản lý thú cưng
          </h1>
          <p className='text-sm text-[#8b6a61] mt-1'>{pets.length} hồ sơ thú cưng • {pets.length} Digital Card</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b6a61]' />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Tìm tên, ID, chủ...'
              className='pl-9 pr-4 py-2.5 border border-[#592518] rounded-xl bg-white text-sm w-56'
            />
          </div>
          <div className='relative'>
            <select
              value={customerFilter}
              onChange={(event) => setCustomerFilter(event.target.value)}
              className='min-w-[210px] appearance-none pl-3 pr-9 py-2.5 border border-[#592518] rounded-xl bg-white text-sm'
            >
              <option value='all'>Tất cả khách hàng</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#592518]/70' />
          </div>
          <button
            onClick={openCreate}
            className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d56756] text-white border border-[#592518] text-sm'
          >
            <UserPlus className='w-4 h-4' />
            Quick Add Walk-in
          </button>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div> : null}

      <div
        className={`grid gap-5 ${
          selectedPet
            ? medicalEditorActive
              ? 'lg:grid-cols-[0.88fr_1.42fr]'
              : 'lg:grid-cols-[1fr_1.1fr]'
            : 'lg:grid-cols-1'
        }`}
      >
        <div>
          <div className='grid md:grid-cols-2 gap-4'>
            {filteredPets.map((pet) => {
              const view = mapApiPetToCardView(pet);
              const selected = selectedPetId === pet.id;
              return (
                <div
                  key={pet.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    setDetailTab('info');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPetId(pet.id);
                      setDetailTab('info');
                    }
                  }}
                  className={`text-left bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                    selected
                      ? 'border-[#d56756] shadow-[0_10px_25px_rgba(107,143,94,0.16)]'
                      : 'border-[#592518] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(45,42,38,0.12)]'
                  }`}
                  aria-label={`Xem chi tiết thú cưng ${pet.name}`}
                >
                  <div className='flex gap-3'>
                    <div className='w-14 h-14 rounded-xl overflow-hidden border border-[#592518]'>
                      <ImageWithFallback src={view.image} alt={view.name} className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-[#592518] transition-colors' style={{ fontWeight: 700 }}>
                        {pet.name}
                      </p>
                      <p className='text-xs text-[#8b6a61]'>{pet.species} • {pet.breed || 'Chưa cập nhật giống'}</p>
                      <p className='text-xs text-[#8b6a61]'>{pet.customer?.name || 'Chưa có chủ'}</p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(pet);
                    }}
                    className='mt-3 w-full px-3 py-2 rounded-xl border border-[#592518]/25 text-sm hover:bg-[#f4ece4]'
                  >
                    Sửa hồ sơ
                  </button>
                </div>
              );
            })}
          </div>

          {loading ? <p className='text-sm text-[#8b6a61] mt-4'>Đang tải dữ liệu thú cưng...</p> : null}
          {!loading && filteredPets.length === 0 ? (
            <div className='rounded-xl border border-[#592518] bg-white p-6 text-center text-sm text-[#8b6a61] mt-4'>
              Không có thú cưng phù hợp bộ lọc hiện tại.
            </div>
          ) : null}
        </div>

        {selectedPet && selectedUiPet ? (
          <div className='bg-[linear-gradient(180deg,#ffffff_0%,#f8f6f1_100%)] border border-[#592518] rounded-3xl overflow-hidden shadow-[0_18px_42px_rgba(45,42,38,0.10)]'>
            <>
              <div className='p-4 md:p-5 border-b border-[#592518]/10 bg-white/75 flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-14 h-14 rounded-2xl overflow-hidden border border-[#592518]/20 shadow-sm'>
                    <ImageWithFallback src={selectedUiPet.image} alt={selectedUiPet.name} className='w-full h-full object-cover' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-2xl text-[#592518] truncate leading-none' style={{ fontWeight: 700 }}>
                      {selectedUiPet.name}
                    </p>
                    <p className='text-sm text-[#8b6a61] truncate mt-1'>{selectedUiPet.breed} • {selectedUiPet.species}</p>
                    <p className='text-xs text-[#8b6a61] truncate'>{selectedUiPet.ownerName}</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 shrink-0'>
                  <button
                    type='button'
                    onClick={() => openEdit(selectedPet)}
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#592518]/20 text-sm bg-white hover:bg-[#f4ece4]'
                  >
                    <Edit3 className='w-4 h-4' />
                    Sửa hồ sơ
                  </button>
                  <button
                    type='button'
                    onClick={() => setSelectedPetId(null)}
                    className='inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#592518]/20 text-sm hover:bg-[#f4ece4]'
                    aria-label='Đóng chi tiết thú cưng'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              </div>

              <div className='px-4 py-3 md:px-5 border-b border-[#592518]/10 flex flex-wrap gap-2'>
                {[
                  { id: 'info' as const, label: 'Hồ sơ' },
                  { id: 'medical' as const, label: 'Bệnh án' },
                  { id: 'card' as const, label: 'Digital Card' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      detailTab === tab.id
                        ? 'bg-[#592518] text-white border-[#592518]'
                        : 'bg-[#faf8f5] text-[#592518] border-[#592518]/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div
                className={`p-4 md:p-5 ${
                  medicalEditorActive ? 'space-y-4 overflow-visible' : 'space-y-3 max-h-[70vh] overflow-auto'
                }`}
              >
                {detailTab === 'info' ? <PetProfileDetailPanel pet={selectedUiPet} className='pb-1' /> : null}

                {detailTab === 'medical' ? (
                  <div className='space-y-4'>
                    {medicalFormOpen ? (
                      <section className='rounded-2xl border border-[#592518]/20 bg-white p-4 md:p-5 shadow-[0_18px_42px_rgba(45,42,38,0.08)]'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div>
                            <p className='text-base text-[#592518]' style={{ fontWeight: 700 }}>
                              {medicalFormMode === 'create' ? 'Tạo bệnh án mới' : 'Cập nhật bệnh án'}
                            </p>
                            <p className='mt-1 text-sm text-[#8b6a61]'>
                              Lưu triệu chứng để khách hàng dễ theo dõi và bác sĩ tái khám có đủ bối cảnh lâm sàng.
                            </p>
                          </div>
                          <div className='rounded-full border border-[#592518]/15 bg-[#faf8f5] px-3 py-1.5 text-xs text-[#8b6a61]'>
                            Editor tập trung
                          </div>
                        </div>

                        <div className='mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]'>
                          <div className='space-y-3'>
                            <div className='grid md:grid-cols-2 gap-3'>
                              <input
                                type='date'
                                value={medicalForm.date}
                                onChange={(event) => setMedicalForm((prev) => ({ ...prev, date: event.target.value }))}
                                className='p-3 border border-[#592518]/30 rounded-xl text-sm'
                              />
                              <input
                                value={medicalForm.doctorName}
                                onChange={(event) => setMedicalForm((prev) => ({ ...prev, doctorName: event.target.value }))}
                                placeholder='Bác sĩ phụ trách'
                                className='p-3 border border-[#592518]/30 rounded-xl text-sm'
                              />
                            </div>

                            <div className='space-y-2'>
                              <p className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                                Triệu chứng / ghi chú lâm sàng
                              </p>
                              <textarea
                                ref={symptomsTextareaRef}
                                rows={4}
                                value={medicalForm.symptoms}
                                onChange={(event) => {
                                  syncTextareaHeight(event.target);
                                  setMedicalForm((prev) => ({ ...prev, symptoms: event.target.value }));
                                }}
                                placeholder='Ví dụ: bỏ ăn 2 ngày, nôn, sốt 39.5 độ, niêm mạc nhợt...'
                                className='w-full min-h-[132px] overflow-hidden rounded-2xl border border-[#592518]/30 p-3 text-sm leading-7 resize-none'
                              />
                            </div>

                            <div className='flex flex-col gap-2 rounded-2xl border border-dashed border-[#d56756]/30 bg-[#fff8f4] p-3'>
                              <div className='flex flex-wrap items-center justify-between gap-2'>
                                <p className='text-xs text-[#8b6a61]'>
                                  AI chỉ hỗ trợ soạn nháp, cần kiểm tra trước khi lưu.
                                </p>
                                <button
                                  type='button'
                                  onClick={() => void generateMedicalDraft()}
                                  disabled={medicalAiLoading || medicalSaving}
                                  className='inline-flex items-center gap-1.5 rounded-xl border border-[#592518]/20 bg-white px-3 py-2 text-sm text-[#592518] hover:bg-[#fdf1ea] disabled:opacity-60'
                                  style={{ fontWeight: 600 }}
                                >
                                  <Sparkles className='w-4 h-4 text-[#d56756]' />
                                  {medicalAiLoading ? 'AI đang soạn...' : 'AI Viết bệnh án'}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className='space-y-3'>
                            <div className='space-y-2'>
                              <p className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                                Chẩn đoán
                              </p>
                              <textarea
                                ref={diagnosisTextareaRef}
                                rows={4}
                                value={medicalForm.diagnosis}
                                onChange={(event) => {
                                  syncTextareaHeight(event.target);
                                  setMedicalForm((prev) => ({ ...prev, diagnosis: event.target.value }));
                                }}
                                placeholder='Chẩn đoán'
                                className='w-full min-h-[132px] overflow-hidden rounded-2xl border border-[#592518]/30 p-3 text-sm leading-7 resize-none'
                              />
                            </div>

                            <div className='space-y-2'>
                              <p className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                                Điều trị
                              </p>
                              <textarea
                                ref={treatmentTextareaRef}
                                rows={5}
                                value={medicalForm.treatment}
                                onChange={(event) => {
                                  syncTextareaHeight(event.target);
                                  setMedicalForm((prev) => ({ ...prev, treatment: event.target.value }));
                                }}
                                placeholder='Điều trị'
                                className='w-full min-h-[156px] overflow-hidden rounded-2xl border border-[#592518]/30 p-3 text-sm leading-7 resize-none'
                              />
                            </div>

                            <div className='space-y-2'>
                              <p className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                                Ghi chú
                              </p>
                              <textarea
                                ref={notesTextareaRef}
                                rows={5}
                                value={medicalForm.notes}
                                onChange={(event) => {
                                  syncTextareaHeight(event.target);
                                  setMedicalForm((prev) => ({ ...prev, notes: event.target.value }));
                                }}
                                placeholder='Ghi chú'
                                className='w-full min-h-[156px] overflow-hidden rounded-2xl border border-[#592518]/30 p-3 text-sm leading-7 resize-none'
                              />
                            </div>

                            <div className='space-y-2'>
                              <p className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>
                                Ngày tái khám
                              </p>
                              <input
                                type='date'
                                value={medicalForm.nextVisitAt}
                                onChange={(event) => setMedicalForm((prev) => ({ ...prev, nextVisitAt: event.target.value }))}
                                className='p-3 border border-[#592518]/30 rounded-xl text-sm'
                              />
                            </div>
                          </div>
                        </div>

                        <div className='mt-5 flex items-center gap-2'>
                          <button
                            onClick={() => void saveMedical()}
                            disabled={medicalSaving || medicalAiLoading}
                            className='px-4 py-2 rounded-xl bg-[#d56756] text-white border border-[#592518] text-sm disabled:opacity-60'
                          >
                            {medicalSaving ? 'Đang lưu...' : medicalFormMode === 'create' ? 'Lưu bệnh án' : 'Lưu chỉnh sửa'}
                          </button>
                          <button
                            onClick={closeMedicalForm}
                            disabled={medicalAiLoading}
                            className='px-4 py-2 rounded-xl border border-[#592518]/25 text-sm'
                          >
                            Hủy
                          </button>
                        </div>
                      </section>
                    ) : (
                      <>
                        <div className='flex items-center justify-between gap-2'>
                          <div>
                            <p className='text-sm text-[#592518]' style={{ fontWeight: 700 }}>
                              Luồng bệnh án
                            </p>
                            <p className='text-xs text-[#8b6a61]'>Tạo/cập nhật bệnh án rồi đồng bộ Digital Card.</p>
                          </div>
                          <button
                            onClick={openCreateMedicalForm}
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d56756] text-white border border-[#592518] text-sm'
                          >
                            <Plus className='w-4 h-4' />
                            Thêm bệnh án
                          </button>
                        </div>

                        {medicalLoading ? <p className='text-sm text-[#8b6a61]'>Đang tải bệnh án...</p> : null}
                        {!medicalLoading && medicalRecords.length === 0 ? (
                          <div className='rounded-xl border border-[#592518]/15 bg-[#faf8f5] p-4 text-sm text-[#8b6a61]'>
                            Chưa có bệnh án nào.
                          </div>
                        ) : null}
                        {medicalRecords.map((record) => {
                          const view = mapMedicalRecordDisplay(record);
                          return (
                            <article key={record.id} className='rounded-xl border border-[#592518]/15 bg-[#faf8f5] p-4'>
                              <div className='flex items-center justify-between gap-2'>
                                <div className='flex items-center gap-2 text-sm text-[#592518]'>
                                  <CalendarDays className='w-4 h-4 text-[#d56756]' />
                                  <span style={{ fontWeight: 700 }}>{formatRecordDate(record.recordedAt)}</span>
                                  <span className='text-[#8b6a61]'>- {record.doctorName || 'BS. Chưa cập nhật'}</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                  <button
                                    onClick={() => openEditMedicalForm(record)}
                                    className='p-1.5 rounded-lg border border-[#592518]/20 hover:bg-white'
                                  >
                                    <Edit3 className='w-4 h-4' />
                                  </button>
                                  <button
                                    onClick={() => void removeMedical(record.id)}
                                    className='p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50'
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </button>
                                </div>
                              </div>
                              {view.symptoms ? (
                                <p className='mt-3 text-sm leading-7 text-[#592518]'>
                                  <span style={{ fontWeight: 600 }}>Triệu chứng:</span> {view.symptoms}
                                </p>
                              ) : null}
                              <p className='text-sm mt-2 leading-7'>
                                <span style={{ fontWeight: 600 }}>{view.primaryLabel}:</span> {view.primaryValue}
                              </p>
                              <p className='text-sm mt-1 leading-7'>
                                <span style={{ fontWeight: 600 }}>{view.secondaryLabel}:</span> {view.secondaryValue}
                              </p>
                              <p className='text-sm mt-1 leading-7'>Ghi chú: {record.notes || 'Không có ghi chú'}</p>
                              {record.nextVisitAt ? (
                                <p className='text-sm mt-1 text-[#b25f2f]'>Tái khám: {formatRecordDate(record.nextVisitAt)}</p>
                              ) : null}
                            </article>
                          );
                        })}
                      </>
                    )}
                  </div>
                ) : null}

                {detailTab === 'card' ? (
                  <div className='space-y-3'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <button
                        onClick={() => void refreshDigitalCard()}
                        disabled={digitalCardLoading}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#592518]/20 text-sm hover:bg-[#f4ece4] disabled:opacity-60'
                      >
                        <Sparkles className='w-4 h-4' />
                        Cập nhật từ hồ sơ
                      </button>
                      <button
                        onClick={() => void recreateDigitalCard()}
                        disabled={digitalCardSyncing}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#592518]/20 text-sm hover:bg-[#f4ece4] disabled:opacity-60'
                      >
                        <Sparkles className='w-4 h-4' />
                        Tạo lại thẻ
                      </button>
                      <button
                        onClick={() => void downloadCard()}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d56756] text-white border border-[#592518] text-sm'
                      >
                        <Download className='w-4 h-4' />
                        Tải PNG
                      </button>
                    </div>
                    {selectedCardPet ? (
                      <div ref={cardCaptureRef}>
                        <PetDigitalCard pet={selectedCardPet} />
                      </div>
                    ) : (
                      <p className='text-sm text-[#8b6a61]'>Không có dữ liệu Digital Card.</p>
                    )}
                    <p className='text-xs text-[#8b6a61]'>
                      Cập nhật gần nhất:{' '}
                      {toDateLabel(
                        digitalCard?.version.lastRegeneratedAt || digitalCard?.generatedAt || new Date().toISOString(),
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          </div>
        ) : null}
      </div>

      {drawerOpen ? (
        <div className='fixed inset-0 z-50 bg-black/30 flex justify-end' onClick={() => !saving && setDrawerOpen(false)}>
          <div className='w-full max-w-xl h-full bg-[#faf8f5] border-l border-[#592518] p-5 overflow-auto' onClick={(event) => event.stopPropagation()}>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl text-[#592518]' style={{ fontWeight: 700 }}>
                {petFormMode === 'create' ? 'Thêm nhanh — Walk-in' : 'Sửa hồ sơ thú cưng'}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className='p-1.5 hover:bg-[#f4ece4] rounded-lg'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='mt-5 space-y-4'>
              {petFormMode === 'create' ? (
                <div className='space-y-2'>
                  <p className='text-xs text-[#8b6a61] uppercase tracking-wider'>Chủ sở hữu</p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setOwnerMode('existing')}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        ownerMode === 'existing'
                          ? 'bg-[#592518] text-white border-[#592518]'
                          : 'bg-white border-[#592518]/20'
                      }`}
                    >
                      Khách hiện có
                    </button>
                    <button
                      onClick={() => setOwnerMode('new')}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        ownerMode === 'new'
                          ? 'bg-[#592518] text-white border-[#592518]'
                          : 'bg-white border-[#592518]/20'
                      }`}
                    >
                      Walk-in mới
                    </button>
                  </div>
                </div>
              ) : null}

              {ownerMode === 'existing' ? (
                <div className='relative'>
                  <select
                    value={form.existingOwner}
                    onChange={(event) => setForm((prev) => ({ ...prev, existingOwner: event.target.value }))}
                    className='w-full appearance-none p-3 pr-10 border border-[#592518]/30 rounded-xl text-sm bg-white'
                  >
                    <option value=''>-- Chọn khách hàng --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#592518]/70' />
                </div>
              ) : (
                <div className='grid gap-3'>
                  <input
                    value={form.ownerName}
                    onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
                    placeholder='Tên chủ nuôi'
                    className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
                  />
                  <input
                    value={form.ownerPhone}
                    onChange={(event) => setForm((prev) => ({ ...prev, ownerPhone: event.target.value }))}
                    placeholder='Số điện thoại'
                    className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
                  />
                  <input
                    value={form.ownerEmail}
                    onChange={(event) => setForm((prev) => ({ ...prev, ownerEmail: event.target.value }))}
                    placeholder='Email (không bắt buộc)'
                    className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
                  />
                </div>
              )}

              <div className='rounded-2xl border border-[#592518]/15 bg-white p-3'>
                <p className='text-[10px] text-[#8b6a61] uppercase tracking-wider mb-2'>Ảnh thú cưng</p>
                <div className='flex items-center gap-3'>
                  <div className='w-16 h-16 rounded-xl overflow-hidden border border-[#592518]/20 bg-[#faf8f5] flex items-center justify-center'>
                    {form.imageUrl ? (
                      <ImageWithFallback src={form.imageUrl} alt='Pet preview' className='w-full h-full object-cover' />
                    ) : (
                      <span className='text-[10px] text-[#8b6a61]'>No image</span>
                    )}
                  </div>
                  <label className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518]/25 text-xs bg-white cursor-pointer hover:bg-[#f4ece4]'>
                    <Plus className='w-3 h-3' />
                    Upload ảnh
                    <input type='file' accept='image/*' onChange={handlePetImageUpload} className='hidden' />
                  </label>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <input value={form.petName} onChange={(event) => setForm((prev) => ({ ...prev, petName: event.target.value }))} placeholder='Tên thú cưng' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <input value={form.petSpecies} onChange={(event) => setForm((prev) => ({ ...prev, petSpecies: event.target.value }))} placeholder='Loài' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <input value={form.petBreed} onChange={(event) => setForm((prev) => ({ ...prev, petBreed: event.target.value }))} placeholder='Giống' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <input value={form.petGender} onChange={(event) => setForm((prev) => ({ ...prev, petGender: event.target.value }))} placeholder='Giới tính' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <input type='date' value={form.petDob} onChange={(event) => setForm((prev) => ({ ...prev, petDob: event.target.value }))} className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <input type='number' value={form.petWeight} onChange={(event) => setForm((prev) => ({ ...prev, petWeight: event.target.value }))} placeholder='Cân nặng (kg)' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <input value={form.coatColor} onChange={(event) => setForm((prev) => ({ ...prev, coatColor: event.target.value }))} placeholder='Màu lông' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <div className='relative'>
                  <select
                    value={form.bloodType}
                    onChange={(event) => setForm((prev) => ({ ...prev, bloodType: event.target.value }))}
                    className='w-full appearance-none p-3 pr-10 border border-[#592518]/30 rounded-xl text-sm bg-white'
                  >
                    <option value='none'>Nhóm máu: Không rõ</option>
                    <option value='A'>A</option>
                    <option value='B'>B</option>
                    <option value='AB'>AB</option>
                    <option value='DEA 1.1+'>DEA 1.1+</option>
                    <option value='DEA 1.1-'>DEA 1.1-</option>
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#592518]/70' />
                </div>
                <input value={form.microchipId} onChange={(event) => setForm((prev) => ({ ...prev, microchipId: event.target.value }))} placeholder='Microchip ID' className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white' />
                <div className='relative'>
                  <select
                    value={form.neutered}
                    onChange={(event) => setForm((prev) => ({ ...prev, neutered: event.target.value as 'yes' | 'no' | 'none' }))}
                    className='w-full appearance-none p-3 pr-10 border border-[#592518]/30 rounded-xl text-sm bg-white'
                  >
                    <option value='none'>Triệt sản: Không rõ</option>
                    <option value='yes'>Đã triệt sản</option>
                    <option value='no'>Chưa triệt sản</option>
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#592518]/70' />
                </div>
              </div>
              <div className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-[10px] text-[#8b6a61] uppercase tracking-wider'>Ghi chú</p>
                  <span className='text-[10px] text-[#8b6a61]'>{form.specialNotes.length}/55</span>
                </div>
                <textarea
                  rows={3}
                  value={form.specialNotes}
                  maxLength={55}
                  onChange={(event) => setForm((prev) => ({ ...prev, specialNotes: event.target.value }))}
                  placeholder='Lưu ý dưới 55 ký tự'
                  className='w-full p-3 border border-[#592518]/30 rounded-xl text-sm bg-white resize-none'
                />
              </div>
              <button onClick={() => void savePet()} disabled={saving} className='w-full py-3 rounded-xl bg-[#d56756] text-white text-sm border border-[#592518] disabled:opacity-60'>
                {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ApiCustomer | null>(null);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | CustomerSegment>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [digitalCardOpen, setDigitalCardOpen] = useState(false);
  const [digitalCardLoading, setDigitalCardLoading] = useState(false);
  const [digitalCardError, setDigitalCardError] = useState('');
  const [digitalCardPetName, setDigitalCardPetName] = useState('');
  const [digitalCardPet, setDigitalCardPet] = useState<Pet | null>(null);
  const [tierSettingsOpen, setTierSettingsOpen] = useState(false);
  const [tierSettingsLoading, setTierSettingsLoading] = useState(false);
  const [tierSettingsSaving, setTierSettingsSaving] = useState(false);
  const [tierSettingsError, setTierSettingsError] = useState('');
  const [tierSettingsForm, setTierSettingsForm] = useState<TierSettingsFormState>(emptyTierSettingsForm);

  const loadCustomers = async (nextSegmentFilter: 'all' | CustomerSegment) => {
    setLoading(true);
    setError('');
    try {
      const data = await listCustomers(nextSegmentFilter === 'all' ? undefined : nextSegmentFilter);
      setCustomers(data);
      setSelectedId((current) => {
        if (!current) {
          return null;
        }
        return data.some((item) => item.id === current) ? current : null;
      });
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetail = async (customerId: string) => {
    try {
      const data = await getCustomerById(customerId);
      setDetail(data);
    } catch (apiError) {
      setError(extractApiError(apiError));
    }
  };

  useEffect(() => {
    void loadCustomers(segmentFilter);
  }, [segmentFilter]);

  useEffect(() => {
    if (selectedId && !customers.some((item) => item.id === selectedId)) {
      setSelectedId(null);
      setDetailOpen(false);
      setDetail(null);
    }
  }, [customers, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    if (!detailOpen) {
      return;
    }
    void loadCustomerDetail(selectedId);
  }, [detailOpen, selectedId]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(keyword) ||
        customer.phone.includes(keyword) ||
        customer.email?.toLowerCase().includes(keyword)
      );
    });
  }, [customers, search]);

  const summary = useMemo(() => {
    return {
      vip: customers.filter((customer) => customer.segment === 'vip').length,
      loyal: customers.filter((customer) => customer.segment === 'loyal').length,
      regular: customers.filter((customer) => customer.segment === 'regular').length,
      totalLtv: customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0),
    };
  }, [customers]);

  const openDetail = (customerId: string) => {
    setSelectedId(customerId);
    setDetail(null);
    setDetailOpen(true);
  };

  const openDigitalCard = async (petId: string, petName: string) => {
    setDigitalCardOpen(true);
    setDigitalCardLoading(true);
    setDigitalCardError('');
    setDigitalCardPet(null);
    setDigitalCardPetName(petName);
    try {
      const card = await getPetDigitalCard(petId);
      setDigitalCardPet(mapDigitalCardToUiPet(card));
    } catch (apiError) {
      setDigitalCardError(extractApiError(apiError));
    } finally {
      setDigitalCardLoading(false);
    }
  };

  const openTierSettingsModal = async () => {
    setTierSettingsOpen(true);
    setTierSettingsLoading(true);
    setTierSettingsError('');
    try {
      const settings = await getCustomerSegmentSettings();
      setTierSettingsForm(mapTierSettingsToForm(settings));
    } catch (apiError) {
      setTierSettingsError(extractApiError(apiError));
    } finally {
      setTierSettingsLoading(false);
    }
  };

  const updateTierField = (field: keyof TierSettingsFormState, value: string) => {
    setTierSettingsForm((prev) => ({
      ...prev,
      [field]: normalizeThresholdInput(value),
    }));
  };

  const saveTierSettings = async () => {
    const regularMinSpent = Number(tierSettingsForm.regular || 0);
    const loyalMinSpent = Number(tierSettingsForm.loyal || 0);
    const vipMinSpent = Number(tierSettingsForm.vip || 0);

    if (regularMinSpent < 1) {
      setTierSettingsError('Mốc Khách thường phải từ 1đ trở lên.');
      return;
    }
    if (loyalMinSpent <= regularMinSpent) {
      setTierSettingsError('Mốc Thân thiết phải lớn hơn mốc Khách thường.');
      return;
    }
    if (vipMinSpent <= loyalMinSpent) {
      setTierSettingsError('Mốc VIP phải lớn hơn mốc Thân thiết.');
      return;
    }

    setTierSettingsSaving(true);
    setTierSettingsError('');
    try {
      await updateCustomerSegmentSettings({
        regularMinSpent,
        loyalMinSpent,
        vipMinSpent,
      });
      setTierSettingsOpen(false);
      await loadCustomers(segmentFilter);
      if (detailOpen && selectedId) {
        await loadCustomerDetail(selectedId);
      }
    } catch (apiError) {
      setTierSettingsError(extractApiError(apiError));
    } finally {
      setTierSettingsSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#592518]' style={{ fontWeight: 700 }}>Quản lý khách hàng</h1>
          <p className='text-sm text-[#8b6a61] mt-1'>CRM 360° — {customers.length} khách hàng</p>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
          <button
            type='button'
            onClick={() => void openTierSettingsModal()}
            className='inline-flex items-center justify-center gap-2 rounded-xl border border-[#592518] bg-white px-4 py-2.5 text-sm text-[#592518] hover:bg-[#f7efe7] transition-colors'
            style={{ fontWeight: 600 }}
          >
            <BadgeCheck className='w-4 h-4 text-[#d56756]' />
            Thiết lập hạng thành viên
          </button>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b6a61]' />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm theo tên, SĐT...' className='pl-9 pr-4 py-2.5 border border-[#592518] rounded-xl bg-white text-sm w-full sm:w-64' />
          </div>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <div className='bg-white border border-[#592518] rounded-2xl p-4'>
          <p className='text-xs uppercase tracking-wide text-[#8b6a61]'>Khách VIP</p>
          <p className='text-2xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>{summary.vip}</p>
        </div>
        <div className='bg-white border border-[#592518] rounded-2xl p-4'>
          <p className='text-xs uppercase tracking-wide text-[#8b6a61]'>Thân thiết</p>
          <p className='text-2xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>{summary.loyal}</p>
        </div>
        <div className='bg-white border border-[#592518] rounded-2xl p-4'>
          <p className='text-xs uppercase tracking-wide text-[#8b6a61]'>Khách thường</p>
          <p className='text-2xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>{summary.regular}</p>
        </div>
        <div className='bg-white border border-[#592518] rounded-2xl p-4'>
          <p className='text-xs uppercase tracking-wide text-[#8b6a61]'>Tổng doanh thu</p>
          <p className='text-2xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>
            {formatCurrency(summary.totalLtv)}
          </p>
        </div>
      </div>

      <div className='bg-white border border-[#592518] rounded-2xl p-3 flex flex-wrap items-center gap-2'>
        {(['all', 'vip', 'loyal', 'regular', 'new'] as const).map((segment) => (
          <button key={segment} onClick={() => setSegmentFilter(segment)} className={`px-3 py-1.5 rounded-xl text-xs border ${segmentFilter === segment ? 'bg-[#d56756] text-white border-[#592518]' : 'bg-[#faf8f5] text-[#592518] border-[#592518]/20'}`}>
            {segment === 'all'
              ? `Tất cả (${customers.length})`
              : `${segmentLabel(segment)} (${customers.filter((item) => item.segment === segment).length})`}
          </button>
        ))}
      </div>

      <div className='flex flex-col lg:flex-row gap-5'>
        <div className={`${detailOpen ? 'lg:w-[45%]' : 'w-full'} transition-all`}>
          <div className='bg-white border border-[#592518] rounded-2xl overflow-hidden min-h-[340px]'>
            <div className='divide-y divide-[#592518]/10'>
              {filtered.map((customer) => {
                const isSelected = selectedId === customer.id;
                const petCount = customer.pets?.length ?? 0;
                return (
                  <div
                    key={customer.id}
                    onClick={() => openDetail(customer.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-[#faf8f5] ${
                      isSelected ? 'bg-[#d56756]/5 border-l-[3px] border-l-[#d56756]' : ''
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-[#c75b4c] flex items-center justify-center flex-shrink-0 border border-[#592518]/20'>
                        <span className='text-white text-xs' style={{ fontWeight: 600 }}>
                          {customer.name.split(' ').filter(Boolean).slice(-1)[0]?.charAt(0).toUpperCase() || 'K'}
                        </span>
                      </div>
                      <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                          <h3 className='text-xl text-[#592518] truncate leading-none' style={{ fontWeight: 700 }}>
                            {customer.name}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${segmentClass(customer.segment)}`} style={{ fontWeight: 600 }}>
                            {segmentLabel(customer.segment)}
                          </span>
                        </div>
                        <div className='flex items-center gap-3 text-xs text-[#8b6a61] mt-1'>
                          <span>{customer.phone}</span>
                          <span>{petCount} thú cưng</span>
                        </div>
                      </div>
                      <div className='text-right hidden sm:block'>
                        <p className='text-[10px] uppercase tracking-wide text-[#8b6a61]'>Doanh thu</p>
                        <p className='text-2xl text-[#d56756]' style={{ fontWeight: 700 }}>
                          {formatCurrency(customer.totalSpent)}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetail(customer.id);
                        }}
                        className='p-1.5 rounded-lg border border-[#592518]/20 hover:bg-[#f4ece4] transition-colors'
                        aria-label='Xem chi tiết khách hàng'
                      >
                        <MoreHorizontal className='w-4 h-4 text-[#8b6a61]' />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {loading ? <p className='p-4 text-sm text-[#8b6a61]'>Đang tải danh sách khách hàng...</p> : null}
            {!loading && filtered.length === 0 ? <p className='p-4 text-sm text-[#8b6a61]'>Không có khách hàng phù hợp.</p> : null}
          </div>
        </div>

        {detailOpen && selectedId && detail ? (
          <div className='lg:w-[55%] space-y-4'>
            <div className='bg-[linear-gradient(140deg,#ffffff_0%,#f8f5ef_100%)] border border-[#592518] rounded-2xl p-5 shadow-[0_12px_30px_rgba(45,42,38,0.08)]'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-4'>
                  <div className='w-14 h-14 rounded-full bg-[#c75b4c] flex items-center justify-center border-2 border-[#592518]'>
                    <span className='text-white text-lg' style={{ fontWeight: 700 }}>
                      {detail.name.split(' ').filter(Boolean).slice(-1)[0]?.charAt(0).toUpperCase() || 'K'}
                    </span>
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h2 className='text-3xl text-[#592518] leading-none' style={{ fontWeight: 700 }}>
                        {detail.name}
                      </h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${segmentClass(detail.segment)}`} style={{ fontWeight: 600 }}>
                        {segmentLabel(detail.segment)}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-xs text-[#8b6a61] mt-2'>
                      <span className='inline-flex items-center gap-1'>
                        <Mail className='w-4 h-4' />
                        {detail.email || '--'}
                      </span>
                      <span className='inline-flex items-center gap-1'>
                        <Phone className='w-4 h-4' />
                        {detail.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDetailOpen(false);
                    setDetail(null);
                  }}
                  className='p-1 hover:bg-[#f4ece4] rounded-lg'
                >
                  <X className='w-5 h-5 text-[#8b6a61]' />
                </button>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div className='bg-white border border-[#592518] rounded-2xl p-4 text-center'>
                <p className='text-[10px] text-[#8b6a61] uppercase tracking-wider'>Doanh thu</p>
                <p className='text-2xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>
                  {formatCurrency(detail.totalSpent)}
                </p>
              </div>
              <div className='bg-white border border-[#592518] rounded-2xl p-4 text-center'>
                <p className='text-[10px] text-[#8b6a61] uppercase tracking-wider'>Lượt ghé thăm</p>
                <p className='text-2xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>
                  {detail.totalVisits}
                </p>
              </div>
              <div className='bg-white border border-[#592518] rounded-2xl p-4 text-center'>
                <p className='text-[10px] text-[#8b6a61] uppercase tracking-wider'>Lần cuối</p>
                <p className='text-lg text-[#592518] mt-1' style={{ fontWeight: 600 }}>
                  {detail.lastVisitAt ? toDateLabel(detail.lastVisitAt) : '—'}
                </p>
              </div>
            </div>

            <div className='bg-[linear-gradient(160deg,#ffffff_0%,#f7f3ec_100%)] border border-[#592518] rounded-2xl p-5'>
              <h3 className='text-2xl text-[#592518] mb-3' style={{ fontWeight: 700 }}>
                Thú cưng ({detail.pets?.length || 0})
              </h3>
              <div className='flex gap-3 overflow-x-auto pb-1'>
                {(detail.pets || []).map((pet) => (
                  <div key={pet.id} className='flex-shrink-0 w-44 border border-[#592518]/20 rounded-xl p-3 bg-[#faf8f5]'>
                    <div className='w-14 h-14 rounded-full overflow-hidden border border-[#592518]/20 mx-auto mb-2'>
                      <ImageWithFallback src={pet.imageUrl || ''} alt={pet.name} className='w-full h-full object-cover' />
                    </div>
                    <p className='text-sm text-center' style={{ fontWeight: 700 }}>{pet.name}</p>
                    <p className='text-xs text-[#8b6a61] text-center'>{pet.species} • {pet.breed || 'Chưa rõ'}</p>
                    <button
                      type='button'
                      onClick={() => void openDigitalCard(pet.id, pet.name)}
                      className='w-full mt-1.5 inline-flex items-center justify-center py-1 rounded-lg border border-[#592518]/30 text-[11px] text-[#d56756] hover:bg-[#d56756]/10 transition-all'
                      style={{ fontWeight: 600 }}
                    >
                      Digital Card
                    </button>
                  </div>
                ))}
                {(detail.pets || []).length === 0 ? (
                  <p className='text-xs text-[#8b6a61] py-4 w-full text-center'>Chưa có thú cưng nào</p>
                ) : null}
              </div>
            </div>

            <div className='bg-white border border-[#592518] rounded-2xl p-5'>
              <h3 className='text-2xl text-[#592518] mb-4' style={{ fontWeight: 700 }}>
                Lịch sử hoạt động
              </h3>
              <div className='space-y-2'>
                {(detail.appointments || []).slice(0, 10).map((appointment) => (
                  <div key={appointment.id} className='text-sm border border-[#592518]/10 rounded-xl p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <span>{appointment.service?.name || 'Dịch vụ'} • {appointment.pet?.name || 'Thú cưng'}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                    <p className='text-[#8b6a61] mt-1 text-xs'>{toDateLabel(appointment.appointmentAt)} {toTimeLabel(appointment.appointmentAt)}</p>
                  </div>
                ))}
                {(detail.appointments || []).length === 0 ? (
                  <p className='text-xs text-[#8b6a61] text-center py-4'>Chưa có hoạt động nào</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {digitalCardOpen ? (
        <div
          className='fixed inset-0 z-50 bg-black/40 p-4 md:p-8 overflow-auto'
          onClick={() => setDigitalCardOpen(false)}
        >
          <div
            className='max-w-4xl mx-auto rounded-3xl border border-[#592518] bg-[#faf8f5] p-4 md:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.14em] text-[#8b6a61]'>Digital Card</p>
                <h3
                  className='text-xl text-[#592518] leading-tight'
                  style={{ fontWeight: 700 }}
                >
                  {digitalCardPetName || 'Thú cưng'}
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setDigitalCardOpen(false)}
                className='p-1.5 rounded-lg border border-[#592518]/20 hover:bg-[#f4ece4]'
                aria-label='Đóng Digital Card'
              >
                <X className='w-4 h-4 text-[#8b6a61]' />
              </button>
            </div>

            {digitalCardLoading ? (
              <p className='text-sm text-[#8b6a61]'>Đang tải digital card...</p>
            ) : null}
            {digitalCardError ? (
              <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
                {digitalCardError}
              </div>
            ) : null}
            {!digitalCardLoading && !digitalCardError && digitalCardPet ? (
              <PetDigitalCard pet={digitalCardPet} />
            ) : null}
          </div>
        </div>
      ) : null}

      <Dialog
        open={tierSettingsOpen}
        onOpenChange={(open) => {
          setTierSettingsOpen(open);
          if (!open) {
            setTierSettingsError('');
            setTierSettingsSaving(false);
          }
        }}
      >
        <DialogContent className='border border-[#592518] bg-[#faf8f5] p-0 sm:max-w-xl'>
          <div className='rounded-[inherit] border border-white/60 bg-[linear-gradient(180deg,#fffdf9_0%,#faf8f5_100%)] p-6'>
            <DialogHeader className='space-y-2 text-left'>
              <DialogTitle className='text-2xl text-[#592518]' style={{ fontWeight: 700 }}>
                Thiết lập hạng thành viên
              </DialogTitle>
              <DialogDescription className='text-sm text-[#8b6a61]'>
                Cập nhật mốc chi tiêu để hệ thống tự động phân loại khách hàng ngay sau khi lưu.
              </DialogDescription>
            </DialogHeader>

            {tierSettingsLoading ? (
              <div className='py-10 text-sm text-[#8b6a61]'>Đang tải cấu hình hạng thành viên...</div>
            ) : (
              <div className='mt-5 space-y-4'>
                <div className='rounded-2xl border border-[#592518]/15 bg-white px-4 py-3'>
                  <p className='text-xs uppercase tracking-[0.16em] text-[#8b6a61]'>Khách mới</p>
                  <div className='mt-2 flex items-center justify-between gap-3'>
                    <span className='text-sm text-[#8b6a61]'>Mốc cố định</span>
                    <span className='text-lg text-[#592518]' style={{ fontWeight: 700 }}>0đ</span>
                  </div>
                </div>

                {([
                  ['regular', 'Khách thường', 'Tối thiểu để lên hạng đầu tiên'],
                  ['loyal', 'Thân thiết', 'Phải lớn hơn mốc Khách thường'],
                  ['vip', 'Khách VIP', 'Phải lớn hơn mốc Thân thiết'],
                ] as const).map(([field, label, hint]) => (
                  <label key={field} className='block'>
                    <span className='text-sm text-[#592518]' style={{ fontWeight: 600 }}>{label}</span>
                    <span className='mt-1 block text-xs text-[#8b6a61]'>{hint}</span>
                    <div className='relative mt-2'>
                      <input
                        inputMode='numeric'
                        autoComplete='off'
                        value={formatThresholdInput(tierSettingsForm[field])}
                        onChange={(event) => updateTierField(field, event.target.value)}
                        placeholder='0'
                        className='w-full rounded-xl border border-[#592518]/20 bg-white px-4 py-3 pr-12 text-base text-[#592518] outline-none transition-colors focus:border-[#d56756]'
                      />
                      <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8b6a61]'>₫</span>
                    </div>
                  </label>
                ))}

                {tierSettingsError ? (
                  <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
                    {tierSettingsError}
                  </div>
                ) : null}
              </div>
            )}

            <DialogFooter className='mt-6 flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => setTierSettingsOpen(false)}
                className='rounded-xl border border-[#592518]/20 bg-white px-4 py-2.5 text-sm text-[#592518] hover:bg-[#f4ece4]'
                style={{ fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                type='button'
                onClick={() => void saveTierSettings()}
                disabled={tierSettingsLoading || tierSettingsSaving}
                className='rounded-xl border border-[#592518] bg-[#d56756] px-4 py-2.5 text-sm text-white disabled:opacity-60'
                style={{ fontWeight: 600 }}
              >
                {tierSettingsSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



