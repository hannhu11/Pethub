import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import type { ApiCustomer, ApiPet, CustomerSegment } from '../types';
import { extractApiError } from '../lib/api-client';
import { formatCurrency, getStatusColor, getStatusLabel, toDateLabel, toTimeLabel } from '../lib/format';
import { createPet, getCustomerById, listCustomers, listPets, updatePet } from '../lib/pethub-api';
import { mapApiPetToCardView } from '../lib/view-models';
import { ImageWithFallback } from './figma/ImageWithFallback';

type PetFormState = {
  id: string | null;
  customerId: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
  weightKg: string;
  specialNotes: string;
};

const emptyPetForm: PetFormState = {
  id: null,
  customerId: '',
  name: '',
  species: 'Chó',
  breed: '',
  gender: '',
  dateOfBirth: '',
  weightKg: '',
  specialNotes: '',
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

export function ManagerPetsPage() {
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<PetFormState>(emptyPetForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useMemo(
    () => async () => {
      setLoading(true);
      setError('');
      try {
        const [petData, customerData] = await Promise.all([listPets(), listCustomers()]);
        setPets(petData);
        setCustomers(customerData);
      } catch (apiError) {
        setError(extractApiError(apiError));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPets = pets.filter((pet) => {
    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      pet.name.toLowerCase().includes(keyword) ||
      pet.id.toLowerCase().includes(keyword) ||
      pet.customer?.name?.toLowerCase().includes(keyword);
    const matchesCustomer = customerFilter === 'all' || pet.customerId === customerFilter;
    return matchesKeyword && matchesCustomer;
  });

  const openCreate = () => {
    setForm({ ...emptyPetForm, customerId: customers[0]?.id || '' });
    setDrawerOpen(true);
  };

  const openEdit = (pet: ApiPet) => {
    setForm({
      id: pet.id,
      customerId: pet.customerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      gender: pet.gender ?? '',
      dateOfBirth: pet.dateOfBirth ? pet.dateOfBirth.slice(0, 10) : '',
      weightKg: pet.weightKg ? String(pet.weightKg) : '',
      specialNotes: pet.specialNotes ?? '',
    });
    setDrawerOpen(true);
  };

  const savePet = async () => {
    if (!form.customerId || !form.name.trim()) {
      setError('Vui lòng nhập tên thú cưng và chủ sở hữu.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        customerId: form.customerId,
        name: form.name.trim(),
        species: form.species.trim(),
        breed: form.breed.trim() || undefined,
        gender: form.gender.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        specialNotes: form.specialNotes.trim() || undefined,
      };

      if (form.id) {
        const updated = await updatePet(form.id, payload);
        setPets((prev) => prev.map((pet) => (pet.id === updated.id ? updated : pet)));
        setMessage('Đã cập nhật hồ sơ thú cưng.');
      } else {
        const created = await createPet(payload);
        setPets((prev) => [created, ...prev]);
        setMessage('Đã tạo hồ sơ thú cưng mới.');
      }

      setDrawerOpen(false);
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Quản lý thú cưng</h1>
          <p className='text-sm text-[#7a756e] mt-1'>{pets.length} hồ sơ thú cưng</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]' />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm tên, ID, chủ...' className='pl-9 pr-4 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm w-56' />
          </div>
          <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} className='px-3 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm'>
            <option value='all'>Tất cả khách hàng</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          <button onClick={openCreate} className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b8f5e] text-white border border-[#2d2a26] text-sm'>
            <UserPlus className='w-4 h-4' />
            Thêm mới
          </button>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div> : null}

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredPets.map((pet) => {
          const view = mapApiPetToCardView(pet);
          return (
            <div key={pet.id} className='bg-white border border-[#2d2a26] rounded-2xl p-4'>
              <div className='flex gap-3'>
                <div className='w-14 h-14 rounded-xl overflow-hidden border border-[#2d2a26]'>
                  <ImageWithFallback src={view.image} alt={view.name} className='w-full h-full object-cover' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>{pet.name}</h3>
                  <p className='text-xs text-[#7a756e]'>{pet.species} • {pet.breed || 'Chưa cập nhật giống'}</p>
                  <p className='text-xs text-[#7a756e]'>{pet.customer?.name || 'Chưa có chủ'}</p>
                </div>
              </div>
              <button type='button' onClick={() => openEdit(pet)} className='mt-3 w-full px-3 py-2 rounded-xl border border-[#2d2a26]/25 text-sm hover:bg-[#f0ede8]'>Sửa hồ sơ</button>
            </div>
          );
        })}
      </div>

      {loading ? <p className='text-sm text-[#7a756e]'>Đang tải dữ liệu thú cưng...</p> : null}
      {!loading && filteredPets.length === 0 ? <div className='rounded-xl border border-[#2d2a26] bg-white p-6 text-center text-sm text-[#7a756e]'>Không có thú cưng phù hợp bộ lọc hiện tại.</div> : null}

      {drawerOpen ? (
        <div className='fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4' onClick={() => !saving && setDrawerOpen(false)}>
          <div className='w-full max-w-xl bg-[#faf9f6] border border-[#2d2a26] rounded-2xl p-5 space-y-3' onClick={(event) => event.stopPropagation()}>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{form.id ? 'Sửa hồ sơ thú cưng' : 'Thêm thú cưng mới'}</h2>
              <button onClick={() => setDrawerOpen(false)}><X className='w-5 h-5' /></button>
            </div>
            <select value={form.customerId} onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))} className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'>
              <option value=''>-- Chọn khách hàng --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name} ({customer.phone})</option>
              ))}
            </select>
            <div className='grid grid-cols-2 gap-3'>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder='Tên thú cưng' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
              <input value={form.species} onChange={(event) => setForm((prev) => ({ ...prev, species: event.target.value }))} placeholder='Loài' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
              <input value={form.breed} onChange={(event) => setForm((prev) => ({ ...prev, breed: event.target.value }))} placeholder='Giống' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
              <input value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))} placeholder='Giới tính' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
              <input type='date' value={form.dateOfBirth} onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
              <input type='number' value={form.weightKg} onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))} placeholder='Cân nặng (kg)' className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white' />
            </div>
            <textarea rows={3} value={form.specialNotes} onChange={(event) => setForm((prev) => ({ ...prev, specialNotes: event.target.value }))} placeholder='Ghi chú' className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white resize-none' />
            <button onClick={() => void savePet()} disabled={saving} className='w-full py-3 rounded-xl bg-[#6b8f5e] text-white text-sm border border-[#2d2a26] disabled:opacity-60'>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    if (!selectedId) {
      setDetail(null);
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
  }, [selectedId]);

  const filtered = customers.filter((customer) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      customer.name.toLowerCase().includes(keyword) ||
      customer.phone.includes(keyword) ||
      customer.email?.toLowerCase().includes(keyword)
    );
  });

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

      <div className='bg-white border border-[#2d2a26] rounded-2xl p-3 flex flex-wrap items-center gap-2'>
        {(['all', 'vip', 'loyal', 'regular', 'new'] as const).map((segment) => (
          <button key={segment} onClick={() => setSegmentFilter(segment)} className={`px-3 py-1.5 rounded-xl text-xs border ${segmentFilter === segment ? 'bg-[#6b8f5e] text-white border-[#2d2a26]' : 'bg-[#faf9f6] text-[#2d2a26] border-[#2d2a26]/20'}`}>
            {segment === 'all' ? 'Tất cả' : segmentLabel(segment)}
          </button>
        ))}
      </div>

      <div className='grid lg:grid-cols-2 gap-5'>
        <div className='bg-white border border-[#2d2a26] rounded-2xl divide-y divide-[#2d2a26]/10'>
          {filtered.map((customer) => (
            <button key={customer.id} onClick={() => setSelectedId(customer.id)} className='w-full text-left p-4 hover:bg-[#faf9f6]'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>{customer.name}</p>
                  <p className='text-xs text-[#7a756e]'>{customer.phone} • {customer.email || '--'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${segmentClass(customer.segment)}`}>{segmentLabel(customer.segment)}</span>
              </div>
              <p className='text-xs text-[#6b8f5e] mt-1'>LTV: {formatCurrency(customer.totalSpent)}</p>
            </button>
          ))}
          {loading ? <p className='p-4 text-sm text-[#7a756e]'>Đang tải danh sách khách hàng...</p> : null}
        </div>

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
          {!detail ? (
            <p className='text-sm text-[#7a756e]'>Chọn một khách hàng để xem chi tiết.</p>
          ) : (
            <div className='space-y-4'>
              <div>
                <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{detail.name}</h2>
                <p className='text-xs text-[#7a756e]'>LTV: {formatCurrency(detail.totalSpent)} • Visits: {detail.totalVisits}</p>
              </div>
              <div>
                <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>Thú cưng ({detail.pets?.length || 0})</p>
                <div className='space-y-2 mt-2'>
                  {(detail.pets || []).map((pet) => (
                    <div key={pet.id} className='text-xs border border-[#2d2a26]/10 rounded-xl p-2'>
                      {pet.name} • {pet.species} • {pet.breed || 'Chưa rõ'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 700 }}>Lịch sử gần nhất</p>
                <div className='space-y-2 mt-2'>
                  {(detail.appointments || []).slice(0, 8).map((appointment) => (
                    <div key={appointment.id} className='text-xs border border-[#2d2a26]/10 rounded-xl p-2'>
                      <div className='flex items-center justify-between gap-2'>
                        <span>{appointment.service?.name || 'Dịch vụ'} • {appointment.pet?.name || 'Thú cưng'}</span>
                        <span className={`px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>{getStatusLabel(appointment.status)}</span>
                      </div>
                      <p className='text-[#7a756e] mt-1'>{toDateLabel(appointment.appointmentAt)} {toTimeLabel(appointment.appointmentAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
