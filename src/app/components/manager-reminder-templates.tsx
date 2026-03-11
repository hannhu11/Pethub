import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Mail, MessageSquare, Send } from 'lucide-react';
import { mockPets, mockUsers } from './data';
import { createReminder, reminderTemplates } from './manager-reminders-store';

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
  const customers = mockUsers.filter((user) => user.role === 'customer');

  const [templateId, setTemplateId] = useState(reminderTemplates[0]?.id ?? '');
  const [customerId, setCustomerId] = useState('');
  const [petId, setPetId] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [scheduledDate, setScheduledDate] = useState(todayISO());
  const [message, setMessage] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const selectedTemplate = reminderTemplates.find((item) => item.id === templateId) ?? reminderTemplates[0];
  const selectedCustomer = customers.find((item) => item.id === customerId);
  const customerPets = useMemo(() => mockPets.filter((pet) => pet.ownerId === customerId), [customerId]);
  const selectedPet = customerPets.find((pet) => pet.id === petId);

  const hydrateMessage = (nextTemplateId: string, nextCustomerId: string, nextPetId: string) => {
    const nextTemplate = reminderTemplates.find((item) => item.id === nextTemplateId);
    const nextCustomer = customers.find((item) => item.id === nextCustomerId);
    const nextPet = mockPets.find((item) => item.id === nextPetId);
    const nextMessage = applyPlaceholders(
      nextTemplate?.messageTemplate ?? '',
      nextCustomer?.name ?? '',
      nextPet?.name ?? '',
    );
    setMessage(nextMessage);
  };

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

  const submitReminder = (mode: 'sent' | 'scheduled') => {
    if (!selectedTemplate || !selectedCustomer || !selectedPet || !message.trim()) return;
    const dateValue = mode === 'sent' ? todayISO() : scheduledDate || todayISO();
    createReminder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      petId: selectedPet.id,
      petName: selectedPet.name,
      type: selectedTemplate.type,
      typeName: selectedTemplate.name,
      status: mode,
      scheduledDate: dateValue,
      sentDate: mode === 'sent' ? dateValue : undefined,
      channel,
      message: message.trim(),
    });
    setSavedMessage(mode === 'sent' ? 'Đã gửi nhắc nhở (mock)' : 'Đã lên lịch nhắc nhở');
    window.setTimeout(() => {
      navigate('/manager/reminders');
    }, 550);
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
          <p className='text-sm text-[#7a756e] mt-1'>Chọn mẫu, review nội dung rồi gửi Gmail/SMS theo mock workflow</p>
        </div>
      </div>

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
              <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>{item.name}</p>
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
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.phone}
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
                {customerPets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.breed})
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
              onClick={() => submitReminder('scheduled')}
              className='inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
              style={{ fontWeight: 600 }}
            >
              Lên lịch gửi
            </button>
            <button
              type='button'
              onClick={() => submitReminder('sent')}
              className='inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all text-sm'
              style={{ fontWeight: 700 }}
            >
              <Send className='w-4 h-4' />
              Gửi ngay (mock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

