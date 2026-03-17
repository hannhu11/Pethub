import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Calendar, ChevronRight, Download, Eye, FileText, Mail, PawPrint, Phone, User } from 'lucide-react';
import { useAuthSession } from '../auth-session';
import { extractApiError } from '../lib/api-client';
import {
  getPetDigitalCard,
  listMedicalRecords,
  listPets,
  type ApiDigitalCard,
  type ApiMedicalRecord,
  type ApiPet,
} from '../lib/pethub-api';
import { BackButton } from './back-button';
import { PetDigitalCard } from './pet-digital-card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { downloadElementAsPng } from './export-utils';
import type { Pet as DigitalPet } from './pet-types';

function formatDateLabel(value: string | Date | null | undefined) {
  if (!value) {
    return 'Chưa cập nhật';
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 'Chưa cập nhật';
  }
  return date.toLocaleDateString('vi-VN');
}

function mapMedicalRecordDisplay(record: ApiMedicalRecord) {
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
      primaryLabel: 'Dịch vụ sử dụng',
      primaryValue: serviceName || diagnosis,
      secondaryLabel: 'Chi tiết thực hiện',
      secondaryValue: treatment,
    };
  }

  return {
    primaryLabel: 'Chẩn đoán',
    primaryValue: diagnosis,
    secondaryLabel: 'Điều trị',
    secondaryValue: treatment,
  };
}

function mapDigitalCardToView(card: ApiDigitalCard): DigitalPet {
  const weightNumber = Number(card.pet.weightKg ?? 0);

  return {
    id: card.pet.id,
    name: card.pet.name,
    species: card.pet.species,
    breed: card.pet.breed || 'Chưa cập nhật giống',
    gender: card.pet.gender || 'Chưa cập nhật',
    dob: formatDateLabel(card.pet.dateOfBirth),
    weight: weightNumber > 0 ? `${weightNumber}kg` : 'Chưa cập nhật',
    color: card.pet.coatColor || 'none',
    microchipId: card.pet.microchipId || 'none',
    bloodType: card.pet.bloodType || 'none',
    neutered: card.pet.neutered === 'yes' ? true : card.pet.neutered === 'no' ? false : null,
    vaccinationLevel: `Bệnh án: ${card.medical.total}`,
    lastCheckup: formatDateLabel(card.pet.lastCheckupAt),
    specialNotes: card.pet.specialNotes || undefined,
    image: card.pet.imageUrl || '',
    ownerId: card.owner.id,
    ownerName: card.owner.name,
    ownerPhone: card.owner.phone,
    ownerEmail: card.owner.email || '',
    hasDigitalCard: true,
  };
}

export function ProfilePage() {
  const { session, updateSessionProfile } = useAuthSession();
  const [searchParams] = useSearchParams();
  const onboardingRequired = Boolean(session.onboarding?.required || searchParams.get('onboarding'));
  const [editing, setEditing] = useState(onboardingRequired);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    setProfile({
      name: session.user?.name ?? '',
      email: session.user?.email ?? '',
      phone: session.user?.phone ?? '',
    });
  }, [session.user?.email, session.user?.name, session.user?.phone]);

  useEffect(() => {
    if (onboardingRequired) {
      setEditing(true);
    }
  }, [onboardingRequired]);

  const canSave = profile.name.trim().length >= 2 && profile.phone.trim().length >= 8;

  const handleSave = async () => {
    if (!canSave) {
      setError('Vui lòng nhập đầy đủ họ tên và số điện thoại hợp lệ (tối thiểu 8 số).');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const user = await updateSessionProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      });
      setProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
      }));
      setMessage('Đã cập nhật hồ sơ thành công.');
      if (!onboardingRequired) {
        setEditing(false);
      }
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='py-12'>
      <div className='max-w-2xl mx-auto px-4'>
        <h1 className='text-2xl text-[#2d2a26] mb-8' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Hồ sơ cá nhân
        </h1>

        {onboardingRequired ? (
          <div className='mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800'>
            Tài khoản mới cần hoàn thiện hồ sơ trước khi dùng Dashboard.
          </div>
        ) : null}

        {error ? <div className='mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
        {message ? (
          <div className='mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
        ) : null}

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='w-16 h-16 rounded-full bg-[#6b8f5e] flex items-center justify-center'>
              <User className='w-8 h-8 text-white' />
            </div>
            <div>
              <h2 className='text-lg'>{profile.name}</h2>
              <p className='text-sm text-[#7a756e]'>{session.user?.role === 'manager' ? 'Quản trị viên' : 'Khách hàng'}</p>
            </div>
            <button
              onClick={() => setEditing((prev) => !prev)}
              disabled={onboardingRequired || saving}
              className='ml-auto p-2 rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 transition-all'
            >
              <FileText className='w-5 h-5' />
            </button>
          </div>

          <div className='space-y-4'>
            {[
              { icon: User, label: 'Họ và tên', key: 'name' as const },
              { icon: Mail, label: 'Email', key: 'email' as const },
              { icon: Phone, label: 'Số điện thoại', key: 'phone' as const },
            ].map((field) => (
              <div key={field.key}>
                <label className='text-sm text-[#7a756e] mb-1 flex items-center gap-2'>
                  <field.icon className='w-4 h-4' />
                  {field.label}
                </label>
                <input
                  value={profile[field.key]}
                  onChange={(event) => setProfile({ ...profile, [field.key]: event.target.value })}
                  readOnly={!editing || field.key === 'email' || saving}
                  className={`w-full p-3 rounded-xl border ${
                    editing ? 'border-[#6b8f5e] bg-white' : 'border-[#2d2a26]/20 bg-[#f0ede8]'
                  } focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]`}
                />
              </div>
            ))}
          </div>

          {editing ? (
            <button
              onClick={() => void handleSave()}
              disabled={saving || !canSave}
              className='w-full mt-6 py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] disabled:opacity-60 disabled:hover:translate-y-0'
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          ) : null}
        </div>

        <div className='grid grid-cols-2 gap-4 mt-6'>
          <Link
            to='/customer/my-pets'
            className='bg-white border border-[#2d2a26] rounded-2xl p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3'
          >
            <PawPrint className='w-5 h-5 text-[#6b8f5e]' />
            <span className='text-sm'>Thú cưng của tôi</span>
            <ChevronRight className='w-4 h-4 ml-auto' />
          </Link>
          <Link
            to='/customer/appointments'
            className='bg-white border border-[#2d2a26] rounded-2xl p-4 hover:-translate-y-0.5 transition-all flex items-center gap-3'
          >
            <Calendar className='w-5 h-5 text-[#c67d5b]' />
            <span className='text-sm'>Lịch hẹn</span>
            <ChevronRight className='w-4 h-4 ml-auto' />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PetListPage() {
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [selectedPet, setSelectedPet] = useState<ApiPet | null>(null);
  const [records, setRecords] = useState<ApiMedicalRecord[]>([]);
  const [recordsForPetId, setRecordsForPetId] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const medicalRequestSeqRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listPets();
        if (mounted) {
          setPets(data);
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
  }, []);

  const resetMedicalPreview = () => {
    medicalRequestSeqRef.current += 1;
    setRecords([]);
    setRecordsForPetId(null);
    setLoadingRecords(false);
  };

  const openDetail = (pet: ApiPet) => {
    setSelectedPet(pet);
    resetMedicalPreview();
  };

  const closeDetail = () => {
    setSelectedPet(null);
    resetMedicalPreview();
  };

  const openMedical = async (pet: ApiPet) => {
    const requestSeq = medicalRequestSeqRef.current + 1;
    medicalRequestSeqRef.current = requestSeq;
    setSelectedPet(pet);
    setRecords([]);
    setRecordsForPetId(pet.id);
    setLoadingRecords(true);
    setError('');
    try {
      const data = await listMedicalRecords(pet.id);
      if (medicalRequestSeqRef.current !== requestSeq) {
        return;
      }
      setRecords(data);
      setRecordsForPetId(pet.id);
    } catch (apiError) {
      if (medicalRequestSeqRef.current !== requestSeq) {
        return;
      }
      setError(extractApiError(apiError));
    } finally {
      if (medicalRequestSeqRef.current !== requestSeq) {
        return;
      }
      setLoadingRecords(false);
    }
  };
  const visibleRecords = selectedPet && recordsForPetId === selectedPet.id ? records : [];

  return (
    <div className='py-12'>
      <div className='max-w-5xl mx-auto px-4'>
        <div className='mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Thú cưng của tôi
          </h1>
          <p className='text-xs text-[#7a756e] rounded-xl border border-[#2d2a26]/20 bg-white px-3 py-2'>
            Thú cưng được quản lý bởi quản trị viên phòng khám.
          </p>
        </div>

        {error ? <div className='mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
        {message ? (
          <div className='mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
        ) : null}

        <div className='grid md:grid-cols-2 gap-6'>
          {pets.map((pet) => (
            <div key={pet.id} className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden'>
              <div className='flex p-4 gap-4'>
                <div className='w-24 h-24 rounded-2xl overflow-hidden border border-[#2d2a26] flex-shrink-0'>
                  <ImageWithFallback src={pet.imageUrl || ''} alt={pet.name} className='w-full h-full object-cover' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                    {pet.name}
                  </h3>
                  <div className='space-y-1 text-xs text-[#7a756e] mt-1'>
                    <p>{pet.species} • {pet.breed || 'Chưa cập nhật giống'}</p>
                    <p>Giới tính: {pet.gender || 'Chưa cập nhật'}</p>
                    <p>Ngày sinh: {formatDateLabel(pet.dateOfBirth)}</p>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-3 border-t border-[#2d2a26]/10 text-sm'>
                <button type='button' onClick={() => openDetail(pet)} className='py-3 text-[#6b8f5e] hover:bg-[#6b8f5e]/5'>
                  <Eye className='w-4 h-4 inline-block mr-1' />
                  Chi tiết
                </button>
                <button type='button' onClick={() => void openMedical(pet)} className='py-3 text-[#c67d5b] hover:bg-[#c67d5b]/5 border-x border-[#2d2a26]/10'>
                  <FileText className='w-4 h-4 inline-block mr-1' />
                  Bệnh án
                </button>
                <Link to={`/customer/digital-card/${pet.id}`} className='py-3 text-[#2d2a26] hover:bg-[#f0ede8] text-center'>
                  Thẻ
                </Link>
              </div>
            </div>
          ))}
        </div>

        {loading ? <p className='text-sm text-[#7a756e] mt-4'>Đang tải thú cưng...</p> : null}
        {!loading && pets.length === 0 ? (
          <div className='text-sm text-[#7a756e] mt-4 rounded-xl border border-[#2d2a26]/20 bg-white p-4'>
            Bạn chưa có thú cưng nào. Vui lòng liên hệ quản trị viên để thêm hồ sơ thú cưng trước khi đặt lịch.
          </div>
        ) : null}

        {selectedPet ? (
          <div className='fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4' onClick={closeDetail}>
            <div className='w-full max-w-xl bg-[#faf9f6] border border-[#2d2a26] rounded-2xl p-5 max-h-[80vh] overflow-y-auto' onClick={(event) => event.stopPropagation()}>
              <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {selectedPet.name}
              </h2>
              <p className='text-sm text-[#7a756e] mb-3'>{selectedPet.species} • {selectedPet.breed || 'Chưa cập nhật giống'}</p>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='rounded-xl border border-[#2d2a26]/15 p-2'>Giới tính: {selectedPet.gender || 'Chưa cập nhật'}</div>
                <div className='rounded-xl border border-[#2d2a26]/15 p-2'>Cân nặng: {selectedPet.weightKg ? `${selectedPet.weightKg}kg` : 'Chưa cập nhật'}</div>
                <div className='rounded-xl border border-[#2d2a26]/15 p-2'>Nhóm máu: {selectedPet.bloodType || 'Chưa cập nhật'}</div>
                <div className='rounded-xl border border-[#2d2a26]/15 p-2'>Microchip: {selectedPet.microchipId || 'Chưa cập nhật'}</div>
              </div>

              <div className='mt-4'>
                <h3 className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>
                  Bệnh án gần đây
                </h3>
                {loadingRecords ? <p className='text-xs text-[#7a756e] mt-2'>Đang tải bệnh án...</p> : null}
                {!loadingRecords && visibleRecords.length === 0 ? <p className='text-xs text-[#7a756e] mt-2'>Chưa có bệnh án.</p> : null}
                <div className='space-y-2 mt-2'>
                  {visibleRecords.slice(0, 5).map((record) => {
                    const view = mapMedicalRecordDisplay(record);
                    return (
                      <div key={record.id} className='rounded-xl border border-[#2d2a26]/15 p-2 text-xs'>
                        <p className='text-[#7a756e]'>{formatDateLabel(record.recordedAt)}</p>
                        <p><span className='text-[#7a756e]'>{view.primaryLabel}:</span> {view.primaryValue}</p>
                        <p><span className='text-[#7a756e]'>{view.secondaryLabel}:</span> {view.secondaryValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

export function DigitalCardPage() {
  const { petId } = useParams();
  const cardExportRef = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<ApiDigitalCard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!petId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const payload = await getPetDigitalCard(petId);
        if (mounted) {
          setCard(payload);
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
  }, [petId]);

  const viewModel = useMemo(() => (card ? mapDigitalCardToView(card) : null), [card]);

  return (
    <div className='py-12'>
      <div className='max-w-3xl mx-auto px-4'>
        <div className='mb-5'>
          <BackButton fallbackPath='/customer/my-pets' />
        </div>

        <h1 className='text-2xl text-[#2d2a26] mb-6 text-center' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          PETHUB DIGITAL PET CARD
        </h1>

        {error ? <div className='mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
        {loading ? <p className='text-sm text-[#7a756e] text-center'>Đang tải thẻ digital...</p> : null}

        {viewModel ? (
          <>
            <div className='mx-auto max-w-2xl'>
              <PetDigitalCard pet={viewModel} />
            </div>
            <div className='fixed -left-[9999px] top-0 pointer-events-none'>
              <div ref={cardExportRef} className='inline-block'>
                <PetDigitalCard pet={viewModel} className='w-[760px]' />
              </div>
            </div>

            <div className='max-w-2xl mx-auto mt-4 flex gap-3'>
              <button
                type='button'
                onClick={() => {
                  if (!cardExportRef.current) {
                    return;
                  }
                  void downloadElementAsPng(cardExportRef.current, {
                    fileName: `${viewModel.id.toLowerCase()}-digital-card.png`,
                    backgroundColor: '#1f2327',
                  });
                }}
                className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#2d2a26] rounded-xl bg-white hover:-translate-y-0.5 transition-all'
              >
                <Download className='w-4 h-4' />
                Tải ảnh thẻ (PNG)
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
