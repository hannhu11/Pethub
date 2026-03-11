import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Bell, Mail, Clock, CheckCircle2, AlertCircle, XCircle,
  Plus, X, Search, Send, Calendar, TrendingUp, LayoutTemplate
} from 'lucide-react';
import { mockPets, mockUsers } from './data';
import {
  createReminder,
  getManagerReminders,
  markReminderCancelled,
  subscribeReminderUpdates,
  updateReminderStatus,
  type ManagerReminder,
  type ReminderType,
} from './manager-reminders-store';
import type { ReminderStatus } from '../types';

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
  cancelled: 'bg-[#f0ede8] text-[#7a756e] border-[#2d2a26]/15',
};

const getStatusIcon = (status: ReminderStatus) => {
  if (status === 'sent') return CheckCircle2;
  if (status === 'failed') return XCircle;
  if (status === 'cancelled') return AlertCircle;
  return Clock;
};

const getTypeColor = (type: ReminderType) => {
  switch (type) {
    case 'vaccine': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'checkup': return 'bg-[#6b8f5e]/10 text-[#6b8f5e] border-[#6b8f5e]/30';
    case 'grooming': return 'bg-[#c67d5b]/10 text-[#c67d5b] border-[#c67d5b]/30';
    case 'medication': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ManagerRemindersPage() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ManagerReminder[]>(getManagerReminders());
  const [filter, setFilter] = useState<'all' | ReminderStatus>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    petId: '',
    type: 'vaccine' as ReminderType,
    typeName: reminderTypes.vaccine,
    scheduledDate: todayISO(),
    channel: 'email' as 'email' | 'sms',
    message: '',
  });

  useEffect(() => {
    return subscribeReminderUpdates(() => {
      setReminders(getManagerReminders());
    });
  }, []);

  const sentCount = reminders.filter((item) => item.status === 'sent').length;
  const failedCount = reminders.filter((item) => item.status === 'failed').length;
  const scheduledCount = reminders.filter((item) => item.status === 'scheduled').length;
  const attemptedCount = sentCount + failedCount;
  const successRate = attemptedCount > 0 ? Math.round((sentCount / attemptedCount) * 100) : 0;

  const filtered = useMemo(() => {
    return reminders.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!search.trim()) return true;
      const keyword = search.trim().toLowerCase();
      return item.customerName.toLowerCase().includes(keyword) || item.petName.toLowerCase().includes(keyword);
    });
  }, [filter, reminders, search]);

  const handleCancel = (id: string) => {
    markReminderCancelled(id);
  };

  const handleRetry = (id: string) => {
    updateReminderStatus(id, 'scheduled');
  };

  const handleMarkSent = (id: string) => {
    updateReminderStatus(id, 'sent');
  };

  const handleCreate = () => {
    const customer = mockUsers.find(user => user.id === formData.customerId && user.role === 'customer');
    const pet = mockPets.find(item => item.id === formData.petId);
    if (!customer || !pet || !formData.message.trim()) return;

    createReminder({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      petId: pet.id,
      petName: pet.name,
      type: formData.type,
      typeName: formData.typeName || reminderTypes[formData.type],
      status: 'scheduled',
      scheduledDate: formData.scheduledDate || todayISO(),
      channel: formData.channel,
      message: formData.message.trim(),
    });

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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Smart Reminders & Automations
          </h1>
          <p className="text-sm text-[#7a756e]">Quản lý chiến dịch nhắc lịch tự động cho khách hàng</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <button
            onClick={() => navigate('/manager/reminders/templates')}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
            style={{ fontWeight: 600 }}
          >
            <LayoutTemplate className='w-4 h-4' />
            Tạo từ mẫu
          </button>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] text-sm">
            <Plus className="w-4 h-4" /> Tạo nhắc nhở
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Mail, label: 'Đã gửi thành công', value: sentCount.toString(), sub: 'trong kỳ hiện tại', color: '#6b8f5e' },
          { icon: Clock, label: 'Đang lên lịch gửi', value: scheduledCount.toString(), sub: 'Scheduled', color: '#c67d5b' },
          { icon: TrendingUp, label: 'Tỷ lệ gửi thành công', value: `${successRate}%`, sub: 'Sent / (Sent + Failed)', color: '#4a90d9' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#2d2a26] rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.color + '15' }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className="text-xs text-[#7a756e]">{kpi.sub}</span>
            </div>
            <p className="text-xs text-[#7a756e] mb-1">{kpi.label}</p>
            <p className="text-xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'scheduled', label: 'Đã lên lịch' },
            { key: 'sent', label: 'Đã gửi' },
            { key: 'failed', label: 'Lỗi' },
            { key: 'cancelled', label: 'Đã hủy' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as 'all' | ReminderStatus)}
              className={`px-4 py-2 rounded-xl text-sm border transition-all hover:-translate-y-0.5 ${
                filter === f.key ? 'bg-[#6b8f5e] text-white border-[#6b8f5e]' : 'bg-white text-[#2d2a26] border-[#2d2a26]/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 border border-[#2d2a26] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6b8f5e] w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d2a26]">
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Khách hàng</th>
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Thú cưng</th>
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Loại nhắc nhở</th>
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Kênh</th>
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Trạng thái</th>
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Ngày gửi</th>
                <th className="text-left py-3 px-3 text-xs text-[#7a756e]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reminder, i) => {
                const StatusIcon = getStatusIcon(reminder.status);
                return (
                  <motion.tr
                    key={reminder.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]"
                  >
                    <td className="py-3 px-3">
                      <div>
                        <p style={{ fontWeight: 500 }}>{reminder.customerName}</p>
                        <p className="text-xs text-[#7a756e]">{reminder.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3" style={{ fontWeight: 500 }}>{reminder.petName}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${getTypeColor(reminder.type)}`}>
                        {reminder.typeName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-xs text-[#7a756e]">
                        {reminder.channel === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        {reminder.channel === 'email' ? 'Gmail' : 'SMS'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${statusColorMap[reminder.status]}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusLabelMap[reminder.status]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#7a756e]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {reminder.status === 'sent' ? (reminder.sentDate ?? reminder.scheduledDate) : reminder.scheduledDate}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {reminder.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleMarkSent(reminder.id)}
                              className='px-2.5 py-1 rounded-lg text-xs border border-[#6b8f5e]/30 bg-[#6b8f5e]/10 text-[#6b8f5e] hover:bg-[#6b8f5e]/20'
                            >
                              Gửi ngay
                            </button>
                            <button onClick={() => handleCancel(reminder.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Hủy">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {reminder.status === 'failed' && (
                          <button onClick={() => handleRetry(reminder.id)} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs" title="Lên lịch lại">
                            Lên lịch lại
                          </button>
                        )}
                        {(reminder.status === 'sent' || reminder.status === 'cancelled') && (
                          <span className="text-xs text-[#7a756e] italic">—</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#7a756e]">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không có nhắc nhở nào</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#2d2a26]/20">
              <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                Tạo nhắc nhở mới
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[#f0ede8] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Khách hàng</label>
                <select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value, petId: '' })}
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white">
                  <option value="">Chọn khách hàng</option>
                  {mockUsers.filter(u => u.role === 'customer').map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Thú cưng</label>
                <select value={formData.petId} onChange={e => setFormData({ ...formData, petId: e.target.value })}
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white">
                  <option value="">Chọn thú cưng</option>
                  {mockPets.filter(p => !formData.customerId || p.ownerId === formData.customerId).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.breed})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Loại nhắc nhở</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ReminderType, typeName: reminderTypes[e.target.value as ReminderType] })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white">
                    {Object.entries(reminderTypes).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Kênh gửi</label>
                  <select value={formData.channel} onChange={e => setFormData({ ...formData, channel: e.target.value as 'email' | 'sms' })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white">
                    <option value="email">Gmail</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Chi tiết nhắc nhở</label>
                <input value={formData.typeName} onChange={e => setFormData({ ...formData, typeName: e.target.value })} placeholder="VD: Tiêm vaccine dại lần 2"
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white" />
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Nội dung</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white resize-none'
                  placeholder='Nhập nội dung nhắc nhở gửi cho khách hàng'
                />
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Ngày gửi</label>
                <input type="date" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                  <span className="flex items-center justify-center gap-2"><Send className="w-4 h-4" />Tạo nhắc nhở</span>
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-[#2d2a26]/30 text-sm hover:-translate-y-0.5 transition-all">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
