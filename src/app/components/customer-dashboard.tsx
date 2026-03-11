import { useRef, useState } from 'react';
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
import {
  mockPets,
  mockAppointments,
  mockMedicalRecords,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
} from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BackButton } from './back-button';
import { PetDigitalCard } from './pet-digital-card';
import { PetProfileDetailPanel } from './pet-profile-detail-panel';
import { downloadElementAsPng } from './export-utils';

export function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@email.com',
    phone: '0901234567',
  });

  return (
    <div className='py-12'>
      <div className='max-w-2xl mx-auto px-4'>
        <h1 className='text-2xl text-[#2d2a26] mb-8' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Hồ sơ cá nhân
        </h1>

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-6'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='w-16 h-16 rounded-full bg-[#6b8f5e] flex items-center justify-center'>
              <User className='w-8 h-8 text-white' />
            </div>
            <div>
              <h2 className='text-lg'>{profile.name}</h2>
              <p className='text-sm text-[#7a756e]'>Khách hàng</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className='ml-auto p-2 rounded-xl border border-[#2d2a26] hover:-translate-y-0.5 transition-all'
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
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                  readOnly={!editing}
                  className={`w-full p-3 rounded-xl border ${
                    editing ? 'border-[#6b8f5e] bg-white' : 'border-[#2d2a26]/20 bg-[#f0ede8]'
                  } focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]`}
                />
              </div>
            ))}
          </div>

          {editing && (
            <button
              onClick={() => setEditing(false)}
              className='w-full mt-6 py-3 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26]'
            >
              Lưu thay đổi
            </button>
          )}
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
  const pets = mockPets.filter((p) => p.ownerId === 'u1');
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [showMedical, setShowMedical] = useState(false);

  const pet = pets.find((p) => p.id === selectedPet);
  const records = mockMedicalRecords.filter((r) => r.petId === selectedPet);

  return (
    <div className='py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <h1 className='text-2xl text-[#2d2a26] mb-8' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Thú cưng của tôi
        </h1>

        <div className='grid md:grid-cols-2 gap-6'>
          {pets.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden hover:-translate-y-1 transition-all'
            >
              <div className='flex p-4 gap-4'>
                <div className='w-24 h-24 rounded-2xl overflow-hidden border border-[#2d2a26] flex-shrink-0'>
                  <ImageWithFallback src={p.image} alt={p.name} className='w-full h-full object-cover' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {p.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.species === 'Chó' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {p.species}
                    </span>
                  </div>
                  <div className='space-y-1 text-xs text-[#7a756e]'>
                    <p>Giống: {p.breed}</p>
                    <p>
                      Giới tính: {p.gender} • {p.weight}
                    </p>
                    <p>Sinh: {p.dob}</p>
                    <p className='text-[10px] text-[#7a756e]/70'>ID: {p.id}</p>
                  </div>
                </div>
              </div>
              <div className='flex border-t border-[#2d2a26]/10'>
                <button
                  onClick={() => {
                    setSelectedPet(p.id);
                    setShowMedical(false);
                  }}
                  className='flex-1 py-3 text-sm text-[#6b8f5e] hover:bg-[#6b8f5e]/5 flex items-center justify-center gap-1'
                >
                  <Eye className='w-4 h-4' /> Chi tiết
                </button>
                <div className='w-px bg-[#2d2a26]/10' />
                <button
                  onClick={() => {
                    setSelectedPet(p.id);
                    setShowMedical(true);
                  }}
                  className='flex-1 py-3 text-sm text-[#c67d5b] hover:bg-[#c67d5b]/5 flex items-center justify-center gap-1'
                >
                  <FileText className='w-4 h-4' /> Bệnh án
                </button>
                {p.hasDigitalCard && (
                  <>
                    <div className='w-px bg-[#2d2a26]/10' />
                    <Link
                      to={`/customer/digital-card/${p.id}`}
                      className='flex-1 py-3 text-sm text-[#2d2a26] hover:bg-[#f0ede8] flex items-center justify-center gap-1'
                    >
                      <CreditCard className='w-4 h-4' /> Thẻ
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {selectedPet && pet && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4' onClick={() => setSelectedPet(null)}>
            <div
              className='bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between p-5 border-b border-[#2d2a26]/20'>
                <h2 className='text-lg' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {showMedical ? `Bệnh án - ${pet.name}` : `Chi tiết - ${pet.name}`}
                </h2>
                <button onClick={() => setSelectedPet(null)} className='p-1 hover:bg-[#f0ede8] rounded-lg'>
                  <X className='w-5 h-5' />
                </button>
              </div>

              {!showMedical ? (
                <div className='p-5'>
                  <div className='flex items-center gap-4 mb-6'>
                    <div className='w-20 h-20 rounded-2xl overflow-hidden border border-[#2d2a26]'>
                      <ImageWithFallback src={pet.image} alt={pet.name} className='w-full h-full object-cover' />
                    </div>
                    <div>
                      <h3 className='text-xl' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                        {pet.name}
                      </h3>
                      <p className='text-sm text-[#7a756e]'>{pet.breed}</p>
                    </div>
                  </div>
                  <PetProfileDetailPanel pet={pet} />
                </div>
              ) : (
                <div className='p-5'>
                  {records.length > 0 ? (
                    <div className='space-y-4'>
                      {records.map((r) => (
                        <div key={r.id} className='bg-white border border-[#2d2a26]/20 rounded-xl p-4'>
                          <div className='flex items-center gap-2 mb-2'>
                            <Calendar className='w-4 h-4 text-[#6b8f5e]' />
                            <span className='text-sm' style={{ fontWeight: 600 }}>
                              {r.date}
                            </span>
                            <span className='text-xs text-[#7a756e]'>- {r.doctor}</span>
                          </div>
                          <div className='space-y-2 text-sm'>
                            <div>
                              <span className='text-[#7a756e]'>Chẩn đoán:</span> {r.diagnosis}
                            </div>
                            <div>
                              <span className='text-[#7a756e]'>Điều trị:</span> {r.treatment}
                            </div>
                            <div>
                              <span className='text-[#7a756e]'>Ghi chú:</span> {r.notes}
                            </div>
                            {r.nextVisit && (
                              <div className='mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700'>
                                Tái khám: {r.nextVisit}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-[#7a756e]'>
                      <FileText className='w-12 h-12 mx-auto mb-3 opacity-30' />
                      <p>Chưa có hồ sơ bệnh án</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BookingListPage() {
  const bookings = mockAppointments.filter((a) => a.userId === 'u1');
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className='py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <h1 className='text-2xl text-[#2d2a26] mb-6' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Lịch hẹn của tôi
        </h1>

        <div className='flex flex-wrap gap-2 mb-6'>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ xác nhận' },
            { key: 'confirmed', label: 'Đã xác nhận' },
            { key: 'completed', label: 'Hoàn thành' },
            { key: 'cancelled', label: 'Đã hủy' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm border transition-all hover:-translate-y-0.5 ${
                filter === f.key ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]' : 'bg-white text-[#2d2a26] border-[#2d2a26]/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className='space-y-4'>
          {filtered.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className='bg-white border border-[#2d2a26] rounded-2xl p-5'
            >
              <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {b.serviceName}
                    </h3>
                    <span className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(b.status)}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-4 text-sm text-[#7a756e]'>
                    <span className='flex items-center gap-1'>
                      <Calendar className='w-4 h-4' />
                      {b.date}
                    </span>
                    <span>{b.time}</span>
                    <span className='flex items-center gap-1'>
                      <PawPrint className='w-4 h-4' />
                      {b.petName}
                    </span>
                  </div>
                  {b.note && <p className='text-xs text-[#7a756e] mt-2 italic'>"{b.note}"</p>}
                </div>
                <div className='text-right'>
                  <p className='text-lg text-[#6b8f5e]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                    {formatCurrency(b.servicePrice)}
                  </p>
                  {b.status === 'pending' && <button className='mt-2 text-xs text-[#c44040] hover:underline'>Hủy lịch</button>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className='text-center py-16 text-[#7a756e]'>
            <Calendar className='w-16 h-16 mx-auto mb-4 opacity-30' />
            <p>Không có lịch hẹn nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DigitalCardPage() {
  const { petId } = useParams();
  const pet = mockPets.find((item) => item.id === petId) || mockPets[0];
  const cardExportRef = useRef<HTMLDivElement>(null);

  return (
    <div className='py-12'>
      <div className='max-w-3xl mx-auto px-4'>
        <div className='mb-5'>
          <BackButton fallbackPath='/customer/my-pets' />
        </div>

        <h1 className='text-2xl text-[#2d2a26] mb-6 text-center' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          PETHUB DIGITAL PET CARD
        </h1>

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
      </div>
    </div>
  );
}
