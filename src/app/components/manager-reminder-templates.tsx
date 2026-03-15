import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Mail, MessageSquare, Send } from 'lucide-react';
import type { ApiCustomer, ApiPet } from '../types';
import { extractApiError } from '../lib/api-client';
import { createReminderFromTemplate, listCustomers, listPets } from '../lib/pethub-api';

type LocalReminderTemplate = {
  id: string;
  name: string;
  type: string;
  channelDefaults: Array<'email' | 'sms'>;
  messageTemplate: string;
};

const reminderTemplates: LocalReminderTemplate[] = [
  {
    id: 'tpl-vaccine',
    name: 'Nhắc tiêm phòng',
    type: 'vaccine',
    channelDefaults: ['email', 'sms'],
    messageTemplate:
      'Kính gửi [Customer Name], bé [Pet Name] đã đến lịch tiêm phòng. Vui lòng đặt lịch tại PetHub để được hỗ trợ kịp thời.',
  },
  {
    id: 'tpl-checkup',
    name: 'Nhắc tái khám',
    type: 'checkup',
    channelDefaults: ['email'],
    messageTemplate:
      'Kính gửi [Customer Name], bé [Pet Name] sắp đến lịch tái khám định kỳ. PetHub khuyến nghị đặt lịch trong tuần này.',
  },
  {
    id: 'tpl-grooming',
    name: 'Theo dõi grooming',
    type: 'grooming',
    channelDefaults: ['sms'],
    messageTemplate:
      'PetHub xin nhắc [Customer Name]: bé [Pet Name] đã đến kỳ grooming để giữ lông và da khỏe mạnh.',
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function applyPlaceholders(template: string, customerName: string, petName: string) {
  return template
    .replaceAll('[Customer Name]', customerName || '[Customer Name]')
    .replaceAll('[Pet Name]', petName || '[Pet Name]');
}

export function ManagerReminderTemplatesPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [templateId, setTemplateId] = useState(reminderTemplates[0]?.id ?? '');
  const [customerId, setCustomerId] = useState('');
  const [petId, setPetId] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [scheduledDate, setScheduledDate] = useState(todayISO());
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  const selectedTemplate = reminderTemplates.find((item) => item.id === templateId) ?? reminderTemplates[0];
  const selectedCustomer = customers.find((item) => item.id === customerId);
  const customerPets = useMemo(() => pets.filter((pet) => pet.customerId === customerId), [pets, customerId]);
  const selectedPet = customerPets.find((pet) => pet.id === petId);

  const hydrateMessage = (nextTemplateId: string, nextCustomerId: string, nextPetId: string) => {
    const nextTemplate = reminderTemplates.find((item) => item.id === nextTemplateId);
    const nextCustomer = customers.find((item) => item.id === nextCustomerId);
    const nextPet = pets.find((item) => item.id === nextPetId);
    setMessage(
      applyPlaceholders(nextTemplate?.messageTemplate ?? '', nextCustomer?.name ?? '', nextPet?.name ?? ''),
    );
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setError('');
      try {
        const [customerData, petData] = await Promise.all([listCustomers(), listPets()]);
        if (!mounted) {
          return;
        }
        setCustomers(customerData);
        setPets(petData);
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
  }, []);

  const handleTemplateChange = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    hydrateMessage(nextTemplateId, customerId, petId);
  };

  const handleCustomerChange = (nextCustomerId: string) => {
    setCustomerId(nextCustomerId);
    setPetId('');
    hydrateMessage(templateId, nextCustomerId, '');
  };

  const handlePetChange = (nextPetId: string) => {
    setPetId(nextPetId);
    hydrateMessage(templateId, customerId, nextPetId);
  };

  const submitReminder = async (sendNow: boolean) => {
    if (!selectedTemplate || !selectedCustomer || !selectedPet || !message.trim()) {
      setError('Vui lòng chọn mẫu, khách hàng, thú cưng và nhập nội dung.');
      return;
    }

    setSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const result = await createReminderFromTemplate({
        templateName: selectedTemplate.name,
        customerId: selectedCustomer.id,
        petId: selectedPet.id,
        channel,
        sendNow,
        scheduleAt: sendNow ? undefined : new Date(`${scheduledDate}T09:00:00`).toISOString(),
        overrideMessage: message.trim(),
      });
      if (sendNow && result.reminder.status !== 'sent') {
        setError(result.reminder.failedReason || 'Gửi nhắc nhở thất bại. Vui lòng kiểm tra cấu hình email/SMS.');
        return;
      }
      setSavedMessage(sendNow ? 'Đã gửi nhắc nhở.' : 'Đã lên lịch nhắc nhở.');
      window.setTimeout(() => {
        navigate('/manager/reminders');
      }, 550);
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => navigate('/manager/reminders')}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại
        </button>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Tạo nhắc nhở từ mẫu
          </h1>
          <p className='text-sm text-[#7a756e] mt-1'>
            Thư viện kịch bản chăm sóc chuyên nghiệp. Cá nhân hóa thông điệp và tự động hóa hành trình khách hàng.
          </p>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

      <div className='grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5'>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-4 space-y-3'>
          <p className='text-xs uppercase tracking-[0.14em] text-[#7a756e]' style={{ fontWeight: 600 }}>
            Mẫu có sẵn
          </p>
          {reminderTemplates.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => handleTemplateChange(item.id)}
              className={`w-full text-left border rounded-xl p-3 transition-all ${
                templateId === item.id ? 'border-[#6b8f5e] bg-[#6b8f5e]/10' : 'border-[#2d2a26]/20 bg-white hover:bg-[#faf9f6]'
              }`}
            >
              <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>
                {item.name}
              </p>
              <p className='text-xs text-[#7a756e] mt-1'>Kênh gợi ý: {item.channelDefaults.join(' + ')}</p>
            </button>
          ))}
        </div>

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-5 space-y-4'>
          <div className='grid sm:grid-cols-2 gap-3'>
            <div>
              <label className='text-xs text-[#7a756e] mb-1 block'>Khách hàng</label>
              <select
                value={customerId}
                onChange={(event) => handleCustomerChange(event.target.value)}
                className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white'
              >
                <option value=''>Chọn khách hàng...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-xs text-[#7a756e] mb-1 block'>Thú cưng</label>
              <select
                value={petId}
                onChange={(event) => handlePetChange(event.target.value)}
                className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white'
              >
                <option value=''>Chọn thú cưng...</option>
                {customerPets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.breed || pet.species})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='grid sm:grid-cols-2 gap-3'>
            <div>
              <label className='text-xs text-[#7a756e] mb-1 block'>Kênh gửi</label>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => setChannel('email')}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border text-sm ${
                    channel === 'email'
                      ? 'border-[#6b8f5e] bg-[#6b8f5e]/10 text-[#6b8f5e]'
                      : 'border-[#2d2a26]/20 text-[#2d2a26]'
                  }`}
                >
                  <Mail className='w-4 h-4' />
                  Gmail
                </button>
                <button
                  type='button'
                  onClick={() => setChannel('sms')}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border text-sm ${
                    channel === 'sms'
                      ? 'border-[#6b8f5e] bg-[#6b8f5e]/10 text-[#6b8f5e]'
                      : 'border-[#2d2a26]/20 text-[#2d2a26]'
                  }`}
                >
                  <MessageSquare className='w-4 h-4' />
                  SMS
                </button>
              </div>
            </div>
            <div>
              <label className='text-xs text-[#7a756e] mb-1 block'>Ngày gửi (schedule)</label>
              <input
                type='date'
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white'
              />
            </div>
          </div>

          <div>
            <label className='text-xs text-[#7a756e] mb-1 block'>Nội dung review</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              placeholder='Nội dung nhắc nhở sẽ hiển thị ở đây'
              className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white resize-none'
            />
          </div>

          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='text-xs text-[#7a756e]'>
              {selectedCustomer && selectedPet
                ? `Preview cho ${selectedCustomer.name} • ${selectedPet.name}`
                : 'Chọn khách hàng + thú cưng để auto-fill đầy đủ'}
            </p>
            {savedMessage ? (
              <p className='text-xs text-emerald-700 inline-flex items-center gap-1' style={{ fontWeight: 600 }}>
                <CheckCircle2 className='w-3.5 h-3.5' />
                {savedMessage}
              </p>
            ) : null}
          </div>

          <div className='grid sm:grid-cols-2 gap-2 pt-1'>
            <button
              type='button'
              onClick={() => void submitReminder(false)}
              disabled={saving}
              className='inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm disabled:opacity-60'
              style={{ fontWeight: 600 }}
            >
              Lên lịch gửi
            </button>
            <button
              type='button'
              onClick={() => void submitReminder(true)}
              disabled={saving}
              className='inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all text-sm disabled:opacity-60'
              style={{ fontWeight: 700 }}
            >
              <Send className='w-4 h-4' />
              Gửi ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
