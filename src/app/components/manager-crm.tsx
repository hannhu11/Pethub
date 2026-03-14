import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  CalendarDays,
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
  createMedicalRecord,
  createPet,
  deleteMedicalRecord,
  getCustomerById,
  getPetDigitalCard,
  listCustomers,
  listMedicalRecords,
  listPets,
  regeneratePetDigitalCard,
  updateMedicalRecord,
  updatePet,
  type ApiDigitalCard,
  type ApiMedicalRecord,
} from '../lib/pethub-api';
import { mapApiPetToCardView } from '../lib/view-models';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PetProfileDetailPanel } from './pet-profile-detail-panel';
import { PetDigitalCard } from './pet-digital-card';
import { downloadElementAsPng } from './export-utils';

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
  diagnosis: string;
  treatment: string;
  notes: string;
  nextVisitAt: string;
};

const emptyMedicalForm: MedicalFormState = {
  date: '',
  doctorName: '',
  diagnosis: '',
  treatment: '',
  notes: '',
  nextVisitAt: '',
};

function segmentLabel(segment: CustomerSegment) {
  if (segment === 'vip') return 'Khách VIP';
  if (segment === 'loyal') return 'Thân thiết';
  if (segment === 'regular') return 'Khách thường';
  return 'Khách mới';
}

function segmentClass(segment: CustomerSegment) {
  if (segment === 'vip') return 'bg-amber-100 text-amber-800 border-amber-300';
  if (segment === 'loyal') return 'bg-[#6b8f5e]/10 text-[#6b8f5e] border-[#6b8f5e]/30';
  if (segment === 'regular') return 'bg-[#f0ede8] text-[#7a756e] border-[#2d2a26]/10';
  return 'bg-emerald-100 text-emerald-700 border-emerald-300';
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

function formatRecordDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
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
  const [digitalCard, setDigitalCard] = useState<ApiDigitalCard | null>(null);
  const [digitalCardLoading, setDigitalCardLoading] = useState(false);
  const [digitalCardSyncing, setDigitalCardSyncing] = useState(false);
  const cardCaptureRef = useRef<HTMLDivElement | null>(null);
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
      const dataUrl = await readFileAsDataUrl(file);
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
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes ?? '',
      nextVisitAt: toDateInput(record.nextVisitAt),
    });
    setMedicalFormOpen(true);
  };

  const closeMedicalForm = () => {
    if (medicalSaving) {
      return;
    }
    setMedicalFormOpen(false);
    setMedicalForm(emptyMedicalForm);
    setEditingRecordId(null);
    setMedicalFormMode('create');
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
        backgroundColor: '#1f2327',
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
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Quản lý thú cưng
          </h1>
          <p className='text-sm text-[#7a756e] mt-1'>
            {pets.length} hồ sơ thú cưng • {pets.filter((pet) => Boolean(pet.lastCheckupAt)).length} Digital Card
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]' />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Tìm tên, ID, chủ...'
              className='pl-9 pr-4 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm w-56'
            />
          </div>
          <select
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
            className='px-3 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm'
          >
            <option value='all'>Tất cả khách hàng</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <button
            onClick={openCreate}
            className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] text-sm'
          >
            <UserPlus className='w-4 h-4' />
            Quick Add Walk-in
          </button>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div> : null}

      <div className={`grid gap-5 ${selectedPet ? 'lg:grid-cols-[1fr_1.1fr]' : 'lg:grid-cols-1'}`}>
        <div>
          <div className='grid md:grid-cols-2 gap-4'>
            {filteredPets.map((pet) => {
              const view = mapApiPetToCardView(pet);
              const selected = selectedPetId === pet.id;
              return (
                <div
                  key={pet.id}
                  className={`text-left bg-white border rounded-2xl p-4 transition ${
                    selected ? 'border-[#6b8f5e] shadow-sm' : 'border-[#2d2a26]'
                  }`}
                >
                  <div className='flex gap-3'>
                    <div className='w-14 h-14 rounded-xl overflow-hidden border border-[#2d2a26]'>
                      <ImageWithFallback src={view.image} alt={view.name} className='w-full h-full object-cover' />
                    </div>
                    <div className='flex-1'>
                      <button
                        type='button'
                        onClick={() => {
                          setSelectedPetId(pet.id);
                          setDetailTab('info');
                        }}
                        className='text-sm text-[#2d2a26] hover:text-[#6b8f5e] transition-colors'
                        style={{ fontWeight: 700 }}
                      >
                        {pet.name}
                      </button>
                      <p className='text-xs text-[#7a756e]'>{pet.species} • {pet.breed || 'Chưa cập nhật giống'}</p>
                      <p className='text-xs text-[#7a756e]'>{pet.customer?.name || 'Chưa có chủ'}</p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(pet);
                    }}
                    className='mt-3 w-full px-3 py-2 rounded-xl border border-[#2d2a26]/25 text-sm hover:bg-[#f0ede8]'
                  >
                    Sửa hồ sơ
                  </button>
                </div>
              );
            })}
          </div>

          {loading ? <p className='text-sm text-[#7a756e] mt-4'>Đang tải dữ liệu thú cưng...</p> : null}
          {!loading && filteredPets.length === 0 ? (
            <div className='rounded-xl border border-[#2d2a26] bg-white p-6 text-center text-sm text-[#7a756e] mt-4'>
              Không có thú cưng phù hợp bộ lọc hiện tại.
            </div>
          ) : null}
        </div>

        {selectedPet && selectedUiPet ? (
          <div className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden'>
            <>
              <div className='p-4 border-b border-[#2d2a26]/10 flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-12 h-12 rounded-full overflow-hidden border border-[#2d2a26]/20'>
                    <ImageWithFallback src={selectedUiPet.image} alt={selectedUiPet.name} className='w-full h-full object-cover' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-lg text-[#2d2a26] truncate' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {selectedUiPet.name}
                    </p>
                    <p className='text-xs text-[#7a756e] truncate'>{selectedUiPet.breed} • {selectedUiPet.species}</p>
                    <p className='text-xs text-[#7a756e] truncate'>{selectedUiPet.ownerName}</p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => openEdit(selectedPet)}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2d2a26]/20 text-sm hover:bg-[#f0ede8]'
                >
                  <Edit3 className='w-4 h-4' />
                  Sửa hồ sơ
                </button>
                <button
                  type='button'
                  onClick={() => setSelectedPetId(null)}
                  className='inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#2d2a26]/20 text-sm hover:bg-[#f0ede8]'
                  aria-label='Đóng chi tiết thú cưng'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>

              <div className='p-4 border-b border-[#2d2a26]/10 flex gap-2'>
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
                        ? 'bg-[#2d2a26] text-white border-[#2d2a26]'
                        : 'bg-[#faf9f6] text-[#2d2a26] border-[#2d2a26]/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className='p-4 space-y-3 max-h-[70vh] overflow-auto'>
                {detailTab === 'info' ? <PetProfileDetailPanel pet={selectedUiPet} /> : null}

                {detailTab === 'medical' ? (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>
                          Luồng bệnh án
                        </p>
                        <p className='text-xs text-[#7a756e]'>Tạo/cập nhật bệnh án rồi đồng bộ Digital Card.</p>
                      </div>
                      <button
                        onClick={openCreateMedicalForm}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] text-sm'
                      >
                        <Plus className='w-4 h-4' />
                        Thêm bệnh án
                      </button>
                    </div>

                    {medicalLoading ? <p className='text-sm text-[#7a756e]'>Đang tải bệnh án...</p> : null}
                    {!medicalLoading && medicalRecords.length === 0 ? (
                      <div className='rounded-xl border border-[#2d2a26]/15 bg-[#faf9f6] p-4 text-sm text-[#7a756e]'>
                        Chưa có bệnh án nào.
                      </div>
                    ) : null}
                    {medicalRecords.map((record) => (
                      <article key={record.id} className='rounded-xl border border-[#2d2a26]/15 bg-[#faf9f6] p-3'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex items-center gap-2 text-sm text-[#2d2a26]'>
                            <CalendarDays className='w-4 h-4 text-[#6b8f5e]' />
                            <span style={{ fontWeight: 700 }}>{formatRecordDate(record.recordedAt)}</span>
                            <span className='text-[#7a756e]'>- {record.doctorName || 'BS. Chưa cập nhật'}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <button
                              onClick={() => openEditMedicalForm(record)}
                              className='p-1.5 rounded-lg border border-[#2d2a26]/20 hover:bg-white'
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
                        <p className='text-sm mt-2'>Chẩn đoán: {record.diagnosis}</p>
                        <p className='text-sm mt-1'>Điều trị: {record.treatment}</p>
                        <p className='text-sm mt-1'>Ghi chú: {record.notes || 'Không có ghi chú'}</p>
                        {record.nextVisitAt ? (
                          <p className='text-sm mt-1 text-[#b25f2f]'>Tái khám: {formatRecordDate(record.nextVisitAt)}</p>
                        ) : null}
                      </article>
                    ))}

                    {medicalFormOpen ? (
                      <div className='rounded-2xl border border-[#2d2a26] bg-white p-4 space-y-3'>
                        <p className='text-base text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                          {medicalFormMode === 'create' ? 'Tạo bệnh án mới' : 'Cập nhật bệnh án'}
                        </p>
                        <div className='grid md:grid-cols-2 gap-3'>
                          <input
                            type='date'
                            value={medicalForm.date}
                            onChange={(event) => setMedicalForm((prev) => ({ ...prev, date: event.target.value }))}
                            className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm'
                          />
                          <input
                            value={medicalForm.doctorName}
                            onChange={(event) => setMedicalForm((prev) => ({ ...prev, doctorName: event.target.value }))}
                            placeholder='Bác sĩ phụ trách'
                            className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm'
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={medicalForm.diagnosis}
                          onChange={(event) => setMedicalForm((prev) => ({ ...prev, diagnosis: event.target.value }))}
                          placeholder='Chẩn đoán'
                          className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm resize-none'
                        />
                        <textarea
                          rows={2}
                          value={medicalForm.treatment}
                          onChange={(event) => setMedicalForm((prev) => ({ ...prev, treatment: event.target.value }))}
                          placeholder='Điều trị'
                          className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm resize-none'
                        />
                        <textarea
                          rows={2}
                          value={medicalForm.notes}
                          onChange={(event) => setMedicalForm((prev) => ({ ...prev, notes: event.target.value }))}
                          placeholder='Ghi chú'
                          className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm resize-none'
                        />
                        <input
                          type='date'
                          value={medicalForm.nextVisitAt}
                          onChange={(event) => setMedicalForm((prev) => ({ ...prev, nextVisitAt: event.target.value }))}
                          className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm'
                        />
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => void saveMedical()}
                            disabled={medicalSaving}
                            className='px-4 py-2 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] text-sm disabled:opacity-60'
                          >
                            {medicalSaving ? 'Đang lưu...' : medicalFormMode === 'create' ? 'Lưu bệnh án' : 'Lưu chỉnh sửa'}
                          </button>
                          <button
                            onClick={closeMedicalForm}
                            className='px-4 py-2 rounded-xl border border-[#2d2a26]/25 text-sm'
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {detailTab === 'card' ? (
                  <div className='space-y-3'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <button
                        onClick={() => void refreshDigitalCard()}
                        disabled={digitalCardLoading}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2d2a26]/20 text-sm hover:bg-[#f0ede8] disabled:opacity-60'
                      >
                        <Sparkles className='w-4 h-4' />
                        Cập nhật từ hồ sơ
                      </button>
                      <button
                        onClick={() => void recreateDigitalCard()}
                        disabled={digitalCardSyncing}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2d2a26]/20 text-sm hover:bg-[#f0ede8] disabled:opacity-60'
                      >
                        <Sparkles className='w-4 h-4' />
                        Tạo lại thẻ
                      </button>
                      <button
                        onClick={() => void downloadCard()}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] text-sm'
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
                      <p className='text-sm text-[#7a756e]'>Không có dữ liệu Digital Card.</p>
                    )}
                    <p className='text-xs text-[#7a756e]'>
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
          <div className='w-full max-w-xl h-full bg-[#faf9f6] border-l border-[#2d2a26] p-5 overflow-auto' onClick={(event) => event.stopPropagation()}>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {petFormMode === 'create' ? 'Thêm nhanh — Walk-in' : 'Sửa hồ sơ thú cưng'}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className='p-1.5 hover:bg-[#f0ede8] rounded-lg'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='mt-5 space-y-4'>
              {petFormMode === 'create' ? (
                <div className='space-y-2'>
                  <p className='text-xs text-[#7a756e] uppercase tracking-wider'>Chủ sở hữu</p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setOwnerMode('existing')}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        ownerMode === 'existing'
                          ? 'bg-[#2d2a26] text-white border-[#2d2a26]'
                          : 'bg-white border-[#2d2a26]/20'
                      }`}
                    >
                      Khách hiện có
                    </button>
                    <button
                      onClick={() => setOwnerMode('new')}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        ownerMode === 'new'
                          ? 'bg-[#2d2a26] text-white border-[#2d2a26]'
                          : 'bg-white border-[#2d2a26]/20'
                      }`}
                    >
                      Walk-in mới
                    </button>
                  </div>
                </div>
              ) : null}

              {ownerMode === 'existing' ? (
                <select
                  value={form.existingOwner}
                  onChange={(event) => setForm((prev) => ({ ...prev, existingOwner: event.target.value }))}
                  className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
                >
                  <option value=''>-- Chọn khách hàng --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              ) : (
                <div className='grid gap-3'>
                  <input
                    value={form.ownerName}
                    onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
                    placeholder='Tên chủ nuôi'
                    className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
                  />
                  <input
                    value={form.ownerPhone}
                    onChange={(event) => setForm((prev) => ({ ...prev, ownerPhone: event.target.value }))}
                    placeholder='Số điện thoại'
                    className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
                  />
                  <input
                    value={form.ownerEmail}
                    onChange={(event) => setForm((prev) => ({ ...prev, ownerEmail: event.target.value }))}
                    placeholder='Email (không bắt buộc)'
                    className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
                  />
                </div>
              )}

              <div className='rounded-2xl border border-[#2d2a26]/15 bg-white p-3'>
                <p className='text-[10px] text-[#7a756e] uppercase tracking-wider mb-2'>Ảnh thú cưng</p>
                <div className='flex items-center gap-3'>
                  <div className='w-16 h-16 rounded-xl overflow-hidden border border-[#2d2a26]/20 bg-[#faf9f6] flex items-center justify-center'>
                    {form.imageUrl ? (
                      <ImageWithFallback src={form.imageUrl} alt='Pet preview' className='w-full h-full object-cover' />
                    ) : (
                      <span className='text-[10px] text-[#7a756e]'>No image</span>
                    )}
                  </div>
                  <label className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26]/25 text-xs bg-white cursor-pointer hover:bg-[#f0ede8]'>
                    <Plus className='w-3 h-3' />
                    Upload ảnh
                    <input type='file' accept='image/*' onChange={handlePetImageUpload} className='hidden' />
                  </label>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <input value={form.petName} onChange={(event) => setForm((prev) => ({ ...prev, petName: event.target.value }))} placeholder='Tên thú cưng' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <input value={form.petSpecies} onChange={(event) => setForm((prev) => ({ ...prev, petSpecies: event.target.value }))} placeholder='Loài' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <input value={form.petBreed} onChange={(event) => setForm((prev) => ({ ...prev, petBreed: event.target.value }))} placeholder='Giống' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <input value={form.petGender} onChange={(event) => setForm((prev) => ({ ...prev, petGender: event.target.value }))} placeholder='Giới tính' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <input type='date' value={form.petDob} onChange={(event) => setForm((prev) => ({ ...prev, petDob: event.target.value }))} className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <input type='number' value={form.petWeight} onChange={(event) => setForm((prev) => ({ ...prev, petWeight: event.target.value }))} placeholder='Cân nặng (kg)' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <input value={form.coatColor} onChange={(event) => setForm((prev) => ({ ...prev, coatColor: event.target.value }))} placeholder='Màu lông' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <select value={form.bloodType} onChange={(event) => setForm((prev) => ({ ...prev, bloodType: event.target.value }))} className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'>
                  <option value='none'>Nhóm máu: Không rõ</option>
                  <option value='A'>A</option>
                  <option value='B'>B</option>
                  <option value='AB'>AB</option>
                  <option value='DEA 1.1+'>DEA 1.1+</option>
                  <option value='DEA 1.1-'>DEA 1.1-</option>
                </select>
                <input value={form.microchipId} onChange={(event) => setForm((prev) => ({ ...prev, microchipId: event.target.value }))} placeholder='Microchip ID' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
                <select value={form.neutered} onChange={(event) => setForm((prev) => ({ ...prev, neutered: event.target.value as 'yes' | 'no' | 'none' }))} className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'>
                  <option value='none'>Triệt sản: Không rõ</option>
                  <option value='yes'>Đã triệt sản</option>
                  <option value='no'>Chưa triệt sản</option>
                </select>
              </div>
              <div className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-[10px] text-[#7a756e] uppercase tracking-wider'>Ghi chú</p>
                  <span className='text-[10px] text-[#7a756e]'>{form.specialNotes.length}/55</span>
                </div>
                <textarea
                  rows={3}
                  value={form.specialNotes}
                  maxLength={55}
                  onChange={(event) => setForm((prev) => ({ ...prev, specialNotes: event.target.value }))}
                  placeholder='Lưu ý dưới 55 ký tự'
                  className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white resize-none'
                />
              </div>
              <button onClick={() => void savePet()} disabled={saving} className='w-full py-3 rounded-xl bg-[#6b8f5e] text-white text-sm border border-[#2d2a26] disabled:opacity-60'>
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

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listCustomers(segmentFilter === 'all' ? undefined : segmentFilter);
        if (mounted) {
          setCustomers(data);
          setSelectedId((current) => {
            if (!current) {
              return null;
            }
            return data.some((item) => item.id === current) ? current : null;
          });
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
    let mounted = true;
    const run = async () => {
      try {
        const data = await getCustomerById(selectedId);
        if (mounted) {
          setDetail(data);
        }
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
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

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Quản lý khách hàng</h1>
          <p className='text-sm text-[#7a756e] mt-1'>CRM 360° — {customers.length} khách hàng</p>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]' />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm theo tên, SĐT...' className='pl-9 pr-4 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm w-64' />
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-4'>
          <p className='text-sm text-[#7a756e]'>Khách VIP</p>
          <p className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{summary.vip}</p>
        </div>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-4'>
          <p className='text-sm text-[#7a756e]'>Thân thiết</p>
          <p className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{summary.loyal}</p>
        </div>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-4'>
          <p className='text-sm text-[#7a756e]'>Khách thường</p>
          <p className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{summary.regular}</p>
        </div>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-4'>
          <p className='text-sm text-[#7a756e]'>Tổng LTV</p>
          <p className='text-3xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            {formatCurrency(summary.totalLtv)}
          </p>
        </div>
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl p-3 flex flex-wrap items-center gap-2'>
        {(['all', 'vip', 'loyal', 'regular', 'new'] as const).map((segment) => (
          <button key={segment} onClick={() => setSegmentFilter(segment)} className={`px-3 py-1.5 rounded-xl text-xs border ${segmentFilter === segment ? 'bg-[#6b8f5e] text-white border-[#2d2a26]' : 'bg-[#faf9f6] text-[#2d2a26] border-[#2d2a26]/20'}`}>
            {segment === 'all'
              ? `Tất cả (${customers.length})`
              : `${segmentLabel(segment)} (${customers.filter((item) => item.segment === segment).length})`}
          </button>
        ))}
      </div>

      <div className='flex flex-col lg:flex-row gap-5'>
        <div className={`${detailOpen ? 'lg:w-[45%]' : 'w-full'} transition-all`}>
          <div className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden min-h-[340px]'>
            <div className='divide-y divide-[#2d2a26]/10'>
              {filtered.map((customer) => {
                const isSelected = selectedId === customer.id;
                const petCount = customer.pets?.length ?? 0;
                return (
                  <div
                    key={customer.id}
                    onClick={() => openDetail(customer.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-[#faf9f6] ${
                      isSelected ? 'bg-[#6b8f5e]/5 border-l-[3px] border-l-[#6b8f5e]' : ''
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-[#c67d5b] flex items-center justify-center flex-shrink-0 border border-[#2d2a26]/20'>
                        <span className='text-white text-xs' style={{ fontWeight: 600 }}>
                          {customer.name.split(' ').filter(Boolean).slice(-1)[0]?.charAt(0).toUpperCase() || 'K'}
                        </span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-xl text-[#2d2a26] truncate' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                            {customer.name}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${segmentClass(customer.segment)}`} style={{ fontWeight: 600 }}>
                            {segmentLabel(customer.segment)}
                          </span>
                        </div>
                        <div className='flex items-center gap-3 text-sm text-[#7a756e] mt-0.5'>
                          <span>{customer.phone}</span>
                          <span>{petCount} thú cưng</span>
                        </div>
                      </div>
                      <div className='text-right hidden sm:block'>
                        <p className='text-xs text-[#7a756e]'>LTV</p>
                        <p className='text-3xl text-[#6b8f5e]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                          {formatCurrency(customer.totalSpent)}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetail(customer.id);
                        }}
                        className='p-1.5 rounded-lg border border-[#2d2a26]/20 hover:bg-[#f0ede8] transition-colors'
                        aria-label='Xem chi tiết khách hàng'
                      >
                        <MoreHorizontal className='w-4 h-4 text-[#7a756e]' />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {loading ? <p className='p-4 text-sm text-[#7a756e]'>Đang tải danh sách khách hàng...</p> : null}
            {!loading && filtered.length === 0 ? <p className='p-4 text-sm text-[#7a756e]'>Không có khách hàng phù hợp.</p> : null}
          </div>
        </div>

        {detailOpen && selectedId && detail ? (
          <div className='lg:w-[55%] space-y-4'>
            <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-4'>
                  <div className='w-14 h-14 rounded-full bg-[#c67d5b] flex items-center justify-center border-2 border-[#2d2a26]'>
                    <span className='text-white text-lg' style={{ fontWeight: 700 }}>
                      {detail.name.split(' ').filter(Boolean).slice(-1)[0]?.charAt(0).toUpperCase() || 'K'}
                    </span>
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h2 className='text-4xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {detail.name}
                      </h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${segmentClass(detail.segment)}`} style={{ fontWeight: 600 }}>
                        {segmentLabel(detail.segment)}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-sm text-[#7a756e] mt-1'>
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
                  className='p-1 hover:bg-[#f0ede8] rounded-lg'
                >
                  <X className='w-5 h-5 text-[#7a756e]' />
                </button>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              <div className='bg-white border border-[#2d2a26] rounded-2xl p-4 text-center'>
                <p className='text-[10px] text-[#7a756e] uppercase tracking-wider'>Lifetime Value</p>
                <p className='text-3xl text-[#2d2a26] mt-1' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  {formatCurrency(detail.totalSpent)}
                </p>
              </div>
              <div className='bg-white border border-[#2d2a26] rounded-2xl p-4 text-center'>
                <p className='text-[10px] text-[#7a756e] uppercase tracking-wider'>Lượt ghé thăm</p>
                <p className='text-3xl text-[#2d2a26] mt-1' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                  {detail.totalVisits}
                </p>
              </div>
              <div className='bg-white border border-[#2d2a26] rounded-2xl p-4 text-center'>
                <p className='text-[10px] text-[#7a756e] uppercase tracking-wider'>Lần cuối</p>
                <p className='text-lg text-[#2d2a26] mt-1' style={{ fontWeight: 600 }}>
                  {detail.lastVisitAt ? toDateLabel(detail.lastVisitAt) : '—'}
                </p>
              </div>
            </div>

            <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
              <h3 className='text-3xl text-[#2d2a26] mb-3' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Thú cưng ({detail.pets?.length || 0})
              </h3>
              <div className='flex gap-3 overflow-x-auto pb-1'>
                {(detail.pets || []).map((pet) => (
                  <div key={pet.id} className='flex-shrink-0 w-44 border border-[#2d2a26]/20 rounded-xl p-3 bg-[#faf9f6]'>
                    <div className='w-14 h-14 rounded-full overflow-hidden border border-[#2d2a26]/20 mx-auto mb-2'>
                      <ImageWithFallback src={pet.imageUrl || ''} alt={pet.name} className='w-full h-full object-cover' />
                    </div>
                    <p className='text-sm text-center' style={{ fontWeight: 700 }}>{pet.name}</p>
                    <p className='text-xs text-[#7a756e] text-center'>{pet.species} • {pet.breed || 'Chưa rõ'}</p>
                    <a
                      href={`/manager/pets?petId=${pet.id}`}
                      className='w-full mt-1.5 inline-flex items-center justify-center py-1 rounded-lg border border-[#2d2a26]/30 text-[11px] text-[#6b8f5e] hover:bg-[#6b8f5e]/10 transition-all'
                      style={{ fontWeight: 600 }}
                    >
                      Digital Card
                    </a>
                  </div>
                ))}
                {(detail.pets || []).length === 0 ? (
                  <p className='text-xs text-[#7a756e] py-4 w-full text-center'>Chưa có thú cưng nào</p>
                ) : null}
              </div>
            </div>

            <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
              <h3 className='text-3xl text-[#2d2a26] mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Lịch sử hoạt động
              </h3>
              <div className='space-y-2'>
                {(detail.appointments || []).slice(0, 10).map((appointment) => (
                  <div key={appointment.id} className='text-sm border border-[#2d2a26]/10 rounded-xl p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <span>{appointment.service?.name || 'Dịch vụ'} • {appointment.pet?.name || 'Thú cưng'}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                    <p className='text-[#7a756e] mt-1 text-xs'>{toDateLabel(appointment.appointmentAt)} {toTimeLabel(appointment.appointmentAt)}</p>
                  </div>
                ))}
                {(detail.appointments || []).length === 0 ? (
                  <p className='text-xs text-[#7a756e] text-center py-4'>Chưa có hoạt động nào</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


