import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  PawPrint,
  Calendar,
  ChevronRight,
  Eye,
  FileText,
  CreditCard,
  X,
  Download,
} from 'lucide-react';
import type { ApiPet } from '../types';
import { useAuthSession } from '../auth-session';
import { extractApiError } from '../lib/api-client';
import { mapApiPetToCardView } from '../lib/view-models';
import { getPetById, listPets } from '../lib/pethub-api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BackButton } from './back-button';
import { PetDigitalCard } from './pet-digital-card';
import { PetProfileDetailPanel } from './pet-profile-detail-panel';
import { downloadElementAsPng } from './export-utils';

export function ProfilePage() {
  const { session, updateSessionProfile } = useAuthSession();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');
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
  }, [session.user]);

  const handleSave = async () => {
    setSubmitting(true);
    setStatusText('');
    setErrorText('');
    try {
      await updateSessionProfile({
        name: profile.name,
        phone: profile.phone,
      });
      setEditing(false);
      setStatusText('Đã cập nhật hồ sơ thành công.');
    } catch (error) {
      setErrorText(extractApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='py-12'>
      <div className='max-w-2xl mx-auto px-4'>
        <h1 className='text-2xl text-[#2d2a26] mb-8' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Hồ sơ cá nhân
        </h1>

        {errorText ? (
          <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 mb-4'>{errorText}</div>
        ) : null}
        {statusText ? (
          <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 mb-4'>{statusText}</div>
        ) : null}

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='w-16 h-16 rounded-full bg-[#6b8f5e] flex items-center justify-center'>
              <User className='w-8 h-8 text-white' />
            </div>
            <div>
              <h2 className='text-lg'>{profile.name || 'Khách hàng PetHub'}</h2>
              <p className='text-sm text-[#7a756e]'>Khách hàng</p>
            </div>
            <button
              onClick={() => setEditing((prev) => !prev)}
              className='ml-auto p-2 rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 transition-all'
              disabled={submitting}
            >
              {editing ? <Save className='w-5 h-5' /> : <Edit3 className='w-5 h-5' />}
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
                  onChange={(event) => setProfile((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  readOnly={!editing || field.key === 'email'}
                  className={`w-full p-3 rounded-xl border ${
                    editing && field.key !== 'email'
                      ? 'border-[#6b8f5e] bg-white'
                      : 'border-[#2d2a26]/20 bg-[#f0ede8]'
                  } focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]`}
                />
              </div>
            ))}
          </div>

          {editing ? (
            <button
              onClick={handleSave}
              disabled={submitting}
              className='w-full mt-6 py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showMedical, setShowMedical] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const petData = await listPets();
        if (mounted) {
          setPets(petData);
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

  const petCards = useMemo(() => pets.map(mapApiPetToCardView), [pets]);
  const selectedPet = petCards.find((pet) => pet.id === selectedPetId) || null;

  return (
    <div className='py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <h1 className='text-2xl text-[#2d2a26] mb-8' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Thú cưng của tôi
        </h1>

        {error ? (
          <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 mb-4'>{error}</div>
        ) : null}
        {loading ? (
          <div className='rounded-xl border border-[#2d2a26] bg-white p-4 text-sm text-[#7a756e] mb-4'>Đang tải danh sách thú cưng...</div>
        ) : null}

        <div className='grid md:grid-cols-2 gap-6'>
          {petCards.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden hover:-translate-y-1 transition-all'
            >
              <div className='flex p-4 gap-4'>
                <div className='w-24 h-24 rounded-2xl overflow-hidden border border-[#2d2a26] flex-shrink-0'>
                  <ImageWithFallback src={pet.image} alt={pet.name} className='w-full h-full object-cover' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {pet.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        pet.species === 'Chó' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {pet.species}
                    </span>
                  </div>
                  <div className='space-y-1 text-xs text-[#7a756e]'>
                    <p>Giống: {pet.breed}</p>
                    <p>Giới tính: {pet.gender} • {pet.weight}</p>
                    <p>Sinh: {pet.dob}</p>
                    <p className='text-[10px] text-[#7a756e]/70'>ID: {pet.id}</p>
                  </div>
                </div>
              </div>
              <div className='flex border-t border-[#2d2a26]/10'>
                <button
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    setShowMedical(false);
                  }}
                  className='flex-1 py-3 text-sm text-[#6b8f5e] hover:bg-[#6b8f5e]/5 flex items-center justify-center gap-1'
                >
                  <Eye className='w-4 h-4' /> Chi tiết
                </button>
                <div className='w-px bg-[#2d2a26]/10' />
                <button
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    setShowMedical(true);
                  }}
                  className='flex-1 py-3 text-sm text-[#c67d5b] hover:bg-[#c67d5b]/5 flex items-center justify-center gap-1'
                >
                  <FileText className='w-4 h-4' /> Bệnh án
                </button>
                <div className='w-px bg-[#2d2a26]/10' />
                <Link
                  to={`/customer/digital-card/${pet.id}`}
                  className='flex-1 py-3 text-sm text-[#2d2a26] hover:bg-[#f0ede8] flex items-center justify-center gap-1'
                >
                  <CreditCard className='w-4 h-4' /> Thẻ
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && petCards.length === 0 ? (
          <div className='rounded-xl border border-[#2d2a26]/20 bg-white p-6 text-center text-sm text-[#7a756e] mt-4'>
            Bạn chưa có hồ sơ thú cưng nào.
          </div>
        ) : null}

        {selectedPet ? (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4' onClick={() => setSelectedPetId(null)}>
            <div
              className='bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto'
              onClick={(event) => event.stopPropagation()}
            >
              <div className='flex items-center justify-between p-5 border-b border-[#2d2a26]/20'>
                <h2 className='text-lg' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {showMedical ? `Bệnh án - ${selectedPet.name}` : `Chi tiết - ${selectedPet.name}`}
                </h2>
                <button onClick={() => setSelectedPetId(null)} className='p-1 hover:bg-[#f0ede8] rounded-lg'>
                  <X className='w-5 h-5' />
                </button>
              </div>

              {!showMedical ? (
                <div className='p-5'>
                  <div className='flex items-center gap-4 mb-6'>
                    <div className='w-20 h-20 rounded-2xl overflow-hidden border border-[#2d2a26]'>
                      <ImageWithFallback src={selectedPet.image} alt={selectedPet.name} className='w-full h-full object-cover' />
                    </div>
                    <div>
                      <h3 className='text-xl' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {selectedPet.name}
                      </h3>
                      <p className='text-sm text-[#7a756e]'>{selectedPet.breed}</p>
                    </div>
                  </div>
                  <PetProfileDetailPanel pet={selectedPet} />
                </div>
              ) : (
                <div className='p-5 text-center py-10 text-[#7a756e]'>
                  <FileText className='w-12 h-12 mx-auto mb-3 opacity-30' />
                  <p>Bệnh án điện tử sẽ được tích hợp ở Phase 2.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DigitalCardPage() {
  const { petId } = useParams();
  const [pet, setPet] = useState<ReturnType<typeof mapApiPetToCardView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cardExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!petId) {
      setLoading(false);
      setError('Thiếu mã thú cưng.');
      return;
    }

    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPetById(petId);
        if (mounted) {
          setPet(mapApiPetToCardView(data));
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

  return (
    <div className='py-12'>
      <div className='max-w-3xl mx-auto px-4'>
        <div className='mb-5'>
          <BackButton fallbackPath='/customer/my-pets' />
        </div>

        <h1 className='text-2xl text-[#2d2a26] mb-6 text-center' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          PETHUB DIGITAL PET CARD
        </h1>

        {loading ? (
          <div className='rounded-xl border border-[#2d2a26] bg-white p-4 text-sm text-[#7a756e] text-center'>Đang tải Digital Card...</div>
        ) : null}
        {error ? (
          <div className='rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 text-center'>{error}</div>
        ) : null}

        {pet ? (
          <>
            <div className='mx-auto max-w-2xl'>
              <PetDigitalCard pet={pet} />
            </div>
            <div className='fixed -left-[9999px] top-0 pointer-events-none'>
              <div ref={cardExportRef} className='inline-block'>
                <PetDigitalCard pet={pet} className='w-[760px]' />
              </div>
            </div>

            <div className='max-w-2xl mx-auto mt-4 flex gap-3'>
              <button
                type='button'
                onClick={() => {
                  if (!cardExportRef.current) return;
                  void downloadElementAsPng(cardExportRef.current, {
                    fileName: `${pet.id.toLowerCase()}-digital-card.png`,
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
