import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutTemplate,
  Mail,
  Plus,
  Search,
  Send,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import type { ApiCustomer, ApiPet, ReminderStatus } from '../types';
import { extractApiError } from '../lib/api-client';
import {
  cancelReminder,
  createReminderFromTemplate,
  listCustomers,
  listManagerReminders,
  listPets,
  type ApiReminder,
  type ApiReminderMetrics,
} from '../lib/pethub-api';

type ReminderFilter = 'all' | ReminderStatus;
type ReminderType = 'vaccine' | 'checkup' | 'grooming' | 'medication';

const reminderTypes: Record<ReminderType, string> = {
  vaccine: 'Tiêm vaccine',
  checkup: 'Tái khám',
  grooming: 'Cắt tỉa lông',
  medication: 'Uống thuốc',
};

const statusLabelMap: Record<ReminderStatus, string> = {
  scheduled: 'Đã lên lịch',
  sent: 'Đã gửi',
  failed: 'Lỗi gửi',
  cancelled: 'Đã hủy',
};

const statusColorMap: Record<ReminderStatus, string> = {
  scheduled: 'bg-amber-50 text-amber-700 border-amber-300',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  failed: 'bg-red-50 text-red-700 border-red-300',
  cancelled: 'bg-[#f4ece4] text-[#8b6a61] border-[#592518]/15',
};

const getStatusIcon = (status: ReminderStatus) => {
  if (status === 'sent') return CheckCircle2;
  if (status === 'failed') return XCircle;
  if (status === 'cancelled') return AlertCircle;
  return Clock;
};

const getTypeColor = (templateName: string | null) => {
  const normalized = (templateName || '').toLowerCase();
  if (normalized.includes('vacc')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (normalized.includes('tái khám') || normalized.includes('checkup')) return 'bg-[#d56756]/10 text-[#d56756] border-[#d56756]/30';
  if (normalized.includes('groom')) return 'bg-[#c75b4c]/10 text-[#c75b4c] border-[#c75b4c]/30';
  if (normalized.includes('thuốc') || normalized.includes('med')) return 'bg-violet-50 text-violet-700 border-violet-300';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

function toDateLabel(value: string | null) {
  if (!value) {
    return '--';
  }
  return new Date(value).toLocaleDateString('vi-VN');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ManagerRemindersPage() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [metrics, setMetrics] = useState<ApiReminderMetrics>({
    sent: 0,
    failed: 0,
    scheduled: 0,
    cancelled: 0,
    successRate: 0,
  });
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [workingReminderId, setWorkingReminderId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const loadInFlightRef = useRef(false);
  const [formData, setFormData] = useState({
    customerId: '',
    petId: '',
    type: 'vaccine' as ReminderType,
    typeName: reminderTypes.vaccine,
    scheduledDate: todayISO(),
    channel: 'email' as 'email' | 'sms',
    message: '',
  });

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
        const [reminderData, customerData, petData] = await Promise.all([
          listManagerReminders(),
          listCustomers(),
          listPets(),
        ]);
        setReminders(reminderData.items);
        setMetrics(reminderData.metrics);
        setCustomers(customerData);
        setPets(petData);
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

  const customerPets = useMemo(
    () => pets.filter((pet) => !formData.customerId || pet.customerId === formData.customerId),
    [formData.customerId, pets],
  );

  const filtered = useMemo(() => {
    return reminders.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!search.trim()) return true;
      const keyword = search.trim().toLowerCase();
      return item.customer.name.toLowerCase().includes(keyword) || item.pet.name.toLowerCase().includes(keyword);
    });
  }, [filter, reminders, search]);

  const handleCreate = async (sendNow: boolean) => {
    if (!formData.customerId || !formData.petId || !formData.message.trim()) {
      setError('Vui lòng chọn khách hàng, thú cưng và nhập nội dung nhắc nhở.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await createReminderFromTemplate({
        templateName: formData.typeName || reminderTypes[formData.type],
        customerId: formData.customerId,
        petId: formData.petId,
        channel: formData.channel,
        sendNow,
        scheduleAt: sendNow ? undefined : new Date(`${formData.scheduledDate}T09:00:00`).toISOString(),
        overrideMessage: formData.message.trim(),
      });
      if (sendNow && result.reminder.status !== 'sent') {
        await loadData();
        setError(result.reminder.failedReason || 'Gửi nhắc nhở thất bại. Vui lòng kiểm tra cấu hình email/SMS.');
        return;
      }
      await loadData();
      setShowForm(false);
      setFormData({
        customerId: '',
        petId: '',
        type: 'vaccine',
        typeName: reminderTypes.vaccine,
        scheduledDate: todayISO(),
        channel: 'email',
        message: '',
      });
      setMessage(sendNow ? 'Đã gửi nhắc nhở ngay.' : 'Đã lên lịch nhắc nhở.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    setWorkingReminderId(id);
    setError('');
    setMessage('');
    try {
      await cancelReminder(id);
      await loadData();
      setMessage('Đã hủy nhắc nhở.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setWorkingReminderId('');
    }
  };

  const handleResend = async (item: ApiReminder, sendNow: boolean) => {
    setWorkingReminderId(item.id);
    setError('');
    setMessage('');
    try {
      const result = await createReminderFromTemplate({
        templateName: item.templateName ?? 'manual-template',
        customerId: item.customerId,
        petId: item.petId,
        channel: item.channel,
        sendNow,
        scheduleAt: sendNow ? undefined : item.scheduledAt ?? new Date().toISOString(),
        overrideMessage: item.message,
      });
      if (sendNow && result.reminder.status !== 'sent') {
        await loadData();
        setError(result.reminder.failedReason || 'Gửi nhắc nhở thất bại. Vui lòng kiểm tra cấu hình email/SMS.');
        return;
      }
      await loadData();
      setMessage(sendNow ? 'Đã gửi nhắc nhở.' : 'Đã lên lịch lại nhắc nhở.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setWorkingReminderId('');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Smart Reminders & Automations
          </h1>
          <p className='text-sm text-[#8b6a61]'>Tự động nhắc lịch hẹn đa kênh và theo dõi trạng thái gửi theo thời gian thực.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <button
            onClick={() => navigate('/manager/reminders/templates')}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
            style={{ fontWeight: 600 }}
          >
            <LayoutTemplate className='w-4 h-4' />
            Tạo từ mẫu
          </button>
          <button
            onClick={() => setShowForm(true)}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d56756] text-white hover:-translate-y-0.5 transition-all border border-[#592518] text-sm'
          >
            <Plus className='w-4 h-4' /> Tạo nhắc nhở
          </button>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
      ) : null}

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {[
          { icon: Mail, label: 'Đã gửi thành công', value: metrics.sent.toString(), sub: 'trong kỳ hiện tại', color: '#d56756' },
          { icon: Clock, label: 'Đang lên lịch gửi', value: metrics.scheduled.toString(), sub: 'Scheduled', color: '#c75b4c' },
          { icon: TrendingUp, label: 'Tỷ lệ gửi thành công', value: `${metrics.successRate}%`, sub: 'Sent / (Sent + Failed)', color: '#8f6b5e' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className='bg-white border border-[#592518] rounded-2xl p-5'
          >
            <div className='flex items-start justify-between mb-3'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ backgroundColor: kpi.color + '15' }}>
                <kpi.icon className='w-5 h-5' style={{ color: kpi.color }} />
              </div>
              <span className='text-xs text-[#8b6a61]'>{kpi.sub}</span>
            </div>
            <p className='text-xs text-[#8b6a61] mb-1'>{kpi.label}</p>
            <p className='text-xl text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className='flex flex-col sm:flex-row gap-3 sm:items-center justify-between'>
        <div className='flex flex-wrap gap-2'>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'scheduled', label: 'Đã lên lịch' },
            { key: 'sent', label: 'Đã gửi' },
            { key: 'failed', label: 'Lỗi' },
            { key: 'cancelled', label: 'Đã hủy' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as ReminderFilter)}
              className={`px-4 py-2 rounded-xl text-sm border transition-all hover:-translate-y-0.5 ${
                filter === item.key ? 'bg-[#d56756] text-white border-[#d56756]' : 'bg-white text-[#592518] border-[#592518]/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b6a61]' />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Tìm kiếm...'
            className='pl-9 pr-4 py-2 border border-[#592518] rounded-xl bg-white text-sm w-64'
          />
        </div>
      </div>

      <div className='bg-white border border-[#592518] rounded-2xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-[#592518]'>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Khách hàng</th>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Thú cưng</th>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Loại nhắc nhở</th>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Kênh</th>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Trạng thái</th>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Ngày gửi</th>
                <th className='text-left py-3 px-3 text-xs text-[#8b6a61]'>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reminder, index) => {
                const StatusIcon = getStatusIcon(reminder.status);
                const actionWorking = workingReminderId === reminder.id;
                return (
                  <motion.tr
                    key={reminder.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className='border-b border-[#592518]/10 hover:bg-[#faf8f5]'
                  >
                    <td className='py-3 px-3'>
                      <p style={{ fontWeight: 500 }}>{reminder.customer.name}</p>
                      <p className='text-xs text-[#8b6a61]'>{reminder.customer.phone}</p>
                    </td>
                    <td className='py-3 px-3'>{reminder.pet.name}</td>
                    <td className='py-3 px-3'>
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${getTypeColor(reminder.templateName)}`}>
                        {reminder.templateName || 'Nhắc nhở'}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <span className='inline-flex items-center gap-1 text-xs text-[#8b6a61]'>
                        {reminder.channel === 'email' ? <Mail className='w-3.5 h-3.5' /> : <Bell className='w-3.5 h-3.5' />}
                        {reminder.channel === 'email' ? 'Gmail' : 'SMS'}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${statusColorMap[reminder.status]}`}>
                        <StatusIcon className='w-3.5 h-3.5' />
                        {statusLabelMap[reminder.status]}
                      </span>
                    </td>
                    <td className='py-3 px-3 text-[#8b6a61]'>
                      <div className='inline-flex items-center gap-1'>
                        <Calendar className='w-3.5 h-3.5' />
                        {toDateLabel(reminder.sentAt || reminder.scheduledAt)}
                      </div>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='flex items-center gap-1.5'>
                        {reminder.status === 'scheduled' ? (
                          <>
                            <button
                              onClick={() => void handleResend(reminder, true)}
                              disabled={actionWorking}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#d56756]/30 bg-[#d56756]/10 text-[#d56756] disabled:opacity-60'
                            >
                              Gửi ngay
                            </button>
                            <button
                              onClick={() => void handleCancel(reminder.id)}
                              disabled={actionWorking}
                              className='p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-60'
                              title='Hủy'
                            >
                              <X className='w-4 h-4' />
                            </button>
                          </>
                        ) : null}
                        {reminder.status === 'failed' ? (
                          <button
                            onClick={() => void handleResend(reminder, false)}
                            disabled={actionWorking}
                            className='px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs disabled:opacity-60'
                          >
                            Lên lịch lại
                          </button>
                        ) : null}
                        {(reminder.status === 'sent' || reminder.status === 'cancelled') ? (
                          <span className='text-xs text-[#8b6a61] italic'>—</span>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading ? <div className='py-10 text-center text-sm text-[#8b6a61]'>Đang tải nhắc nhở...</div> : null}
        {!loading && filtered.length === 0 ? (
          <div className='text-center py-12 text-[#8b6a61]'>
            <Bell className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Không có nhắc nhở nào</p>
          </div>
        ) : null}
      </div>

      {showForm ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4' onClick={() => setShowForm(false)}>
          <div className='bg-[#faf8f5] border border-[#592518] rounded-2xl w-full max-w-md' onClick={(event) => event.stopPropagation()}>
            <div className='flex items-center justify-between p-5 border-b border-[#592518]/20'>
              <h2 className='text-lg' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                Tạo nhắc nhở mới
              </h2>
              <button onClick={() => setShowForm(false)} className='p-1 hover:bg-[#f4ece4] rounded-lg'>
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='p-5 space-y-3'>
              <div>
                <label className='text-xs text-[#8b6a61] mb-1 block'>Khách hàng</label>
                <select
                  value={formData.customerId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, customerId: event.target.value, petId: '' }))}
                  className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
                >
                  <option value=''>Chọn khách hàng</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='text-xs text-[#8b6a61] mb-1 block'>Thú cưng</label>
                <select
                  value={formData.petId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, petId: event.target.value }))}
                  className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
                >
                  <option value=''>Chọn thú cưng</option>
                  {customerPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species} - {pet.breed || 'Chưa rõ'})
                    </option>
                  ))}
                </select>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs text-[#8b6a61] mb-1 block'>Loại nhắc nhở</label>
                  <select
                    value={formData.type}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: event.target.value as ReminderType,
                        typeName: reminderTypes[event.target.value as ReminderType],
                      }))
                    }
                    className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
                  >
                    {Object.entries(reminderTypes).map(([type, name]) => (
                      <option key={type} value={type}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='text-xs text-[#8b6a61] mb-1 block'>Kênh gửi</label>
                  <select
                    value={formData.channel}
                    onChange={(event) => setFormData((prev) => ({ ...prev, channel: event.target.value as 'email' | 'sms' }))}
                    className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
                  >
                    <option value='email'>Gmail</option>
                    <option value='sms'>SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className='text-xs text-[#8b6a61] mb-1 block'>Chi tiết nhắc nhở</label>
                <input
                  value={formData.typeName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, typeName: event.target.value }))}
                  placeholder='VD: Tiêm vaccine dại lần 2'
                  className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
                />
              </div>
              <div>
                <label className='text-xs text-[#8b6a61] mb-1 block'>Nội dung</label>
                <textarea
                  value={formData.message}
                  onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
                  rows={4}
                  className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white resize-none'
                  placeholder='Nhập nội dung nhắc nhở gửi cho khách hàng'
                />
              </div>
              <div>
                <label className='text-xs text-[#8b6a61] mb-1 block'>Ngày gửi</label>
                <input
                  type='date'
                  value={formData.scheduledDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                  className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
                />
              </div>
              <div className='grid grid-cols-2 gap-2 pt-2'>
                <button
                  onClick={() => void handleCreate(false)}
                  disabled={submitting}
                  className='py-2.5 rounded-xl border border-[#592518]/30 text-sm hover:-translate-y-0.5 transition-all disabled:opacity-60'
                >
                  Lên lịch gửi
                </button>
                <button
                  onClick={() => void handleCreate(true)}
                  disabled={submitting}
                  className='py-2.5 rounded-xl bg-[#d56756] text-white text-sm border border-[#592518] disabled:opacity-60'
                >
                  <span className='inline-flex items-center justify-center gap-2'>
                    <Send className='w-4 h-4' />
                    Gửi ngay
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
