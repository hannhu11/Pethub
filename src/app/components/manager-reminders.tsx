import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell, Mail, Clock, CheckCircle2, AlertCircle, XCircle,
  Plus, Edit3, X, Search, Send, Calendar, TrendingUp
} from 'lucide-react';
import { mockPets, mockUsers } from './data';

interface Reminder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  petId: string;
  petName: string;
  type: 'vaccine' | 'checkup' | 'grooming' | 'medication';
  typeName: string;
  status: 'sent' | 'pending' | 'failed';
  scheduledDate: string;
  sentDate?: string;
  channel: 'email' | 'sms';
}

const reminderTypes: Record<string, string> = {
  vaccine: 'Tiêm vaccine',
  checkup: 'Tái khám',
  grooming: 'Cắt tỉa lông',
  medication: 'Uống thuốc',
};

const mockReminders: Reminder[] = [
  { id: 'r1', customerId: 'u1', customerName: 'Nguyễn Văn An', customerPhone: '0901234567', petId: 'PH-2026-001', petName: 'Lucky', type: 'vaccine', typeName: 'Tiêm vaccine dại', status: 'sent', scheduledDate: '2026-03-05', sentDate: '2026-03-05', channel: 'email' },
  { id: 'r2', customerId: 'u1', customerName: 'Nguyễn Văn An', customerPhone: '0901234567', petId: 'PH-2026-002', petName: 'Mimi', type: 'checkup', typeName: 'Tái khám định kỳ', status: 'pending', scheduledDate: '2026-03-12', channel: 'email' },
  { id: 'r3', customerId: 'u2', customerName: 'Trần Thị Bình', customerPhone: '0912345678', petId: 'PH-2026-003', petName: 'Bông', type: 'grooming', typeName: 'Cắt tỉa lông định kỳ', status: 'sent', scheduledDate: '2026-03-08', sentDate: '2026-03-08', channel: 'sms' },
  { id: 'r4', customerId: 'u3', customerName: 'Lê Minh Đức', customerPhone: '0923456789', petId: 'PH-2026-004', petName: 'Snowball', type: 'vaccine', typeName: 'Tiêm phòng 5 bệnh', status: 'pending', scheduledDate: '2026-03-15', channel: 'email' },
  { id: 'r5', customerId: 'u2', customerName: 'Trần Thị Bình', customerPhone: '0912345678', petId: 'PH-2026-003', petName: 'Bông', type: 'checkup', typeName: 'Tái khám tiêu hóa', status: 'failed', scheduledDate: '2026-03-07', channel: 'email' },
  { id: 'r6', customerId: 'u1', customerName: 'Nguyễn Văn An', customerPhone: '0901234567', petId: 'PH-2026-001', petName: 'Lucky', type: 'medication', typeName: 'Nhắc uống thuốc', status: 'sent', scheduledDate: '2026-03-09', sentDate: '2026-03-09', channel: 'sms' },
  { id: 'r7', customerId: 'u3', customerName: 'Lê Minh Đức', customerPhone: '0923456789', petId: 'PH-2026-004', petName: 'Snowball', type: 'checkup', typeName: 'Khám tổng quát', status: 'pending', scheduledDate: '2026-03-16', channel: 'email' },
  { id: 'r8', customerId: 'u1', customerName: 'Nguyễn Văn An', customerPhone: '0901234567', petId: 'PH-2026-002', petName: 'Mimi', type: 'vaccine', typeName: 'Tiêm vaccine tổng hợp', status: 'sent', scheduledDate: '2026-03-03', sentDate: '2026-03-03', channel: 'email' },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'sent': return { label: 'Đã gửi', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 };
    case 'pending': return { label: 'Chờ gửi', color: 'bg-amber-50 text-amber-700 border-amber-300', icon: Clock };
    case 'failed': return { label: 'Thất bại', color: 'bg-red-50 text-red-700 border-red-300', icon: XCircle };
    default: return { label: status, color: 'bg-gray-50 text-gray-700 border-gray-300', icon: AlertCircle };
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'vaccine': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'checkup': return 'bg-[#6b8f5e]/10 text-[#6b8f5e] border-[#6b8f5e]/30';
    case 'grooming': return 'bg-[#c67d5b]/10 text-[#c67d5b] border-[#c67d5b]/30';
    case 'medication': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export function ManagerRemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '', petId: '', type: 'vaccine' as Reminder['type'], typeName: '', scheduledDate: '', channel: 'email' as Reminder['channel'],
  });

  const sentCount = reminders.filter(r => r.status === 'sent').length;
  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const openRate = sentCount > 0 ? Math.round((sentCount / reminders.length) * 100) : 0;

  const filtered = reminders.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.customerName.toLowerCase().includes(search.toLowerCase()) && !r.petName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCancel = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleRetry = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' as const } : r));
  };

  const handleCreate = () => {
    const customer = mockUsers.find(u => u.id === formData.customerId);
    const pet = mockPets.find(p => p.id === formData.petId);
    if (!customer || !pet) return;

    const newReminder: Reminder = {
      id: `r${Date.now()}`,
      customerId: formData.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      petId: formData.petId,
      petName: pet.name,
      type: formData.type,
      typeName: formData.typeName || reminderTypes[formData.type],
      status: 'pending',
      scheduledDate: formData.scheduledDate,
      channel: formData.channel,
    };
    setReminders(prev => [...prev, newReminder]);
    setShowForm(false);
    setFormData({ customerId: '', petId: '', type: 'vaccine', typeName: '', scheduledDate: '', channel: 'email' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Smart Reminders & Automations
          </h1>
          <p className="text-sm text-[#7a756e]">Quản lý chiến dịch nhắc lịch tự động cho khách hàng</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] text-sm">
          <Plus className="w-4 h-4" /> Tạo nhắc nhở
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Mail, label: 'Email/SMS đã gửi', value: sentCount.toString(), sub: 'tháng này', color: '#6b8f5e' },
          { icon: Clock, label: 'Nhắc nhở sắp tới', value: pendingCount.toString(), sub: '7 ngày tới', color: '#c67d5b' },
          { icon: TrendingUp, label: 'Tỷ lệ gửi thành công', value: `${openRate}%`, sub: 'tháng 3/2026', color: '#4a90d9' },
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

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ gửi' },
            { key: 'sent', label: 'Đã gửi' },
            { key: 'failed', label: 'Thất bại' },
          ].map(f => (
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

      {/* Data Table */}
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
              {filtered.map((r, i) => {
                const statusConfig = getStatusConfig(r.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]"
                  >
                    <td className="py-3 px-3">
                      <div>
                        <p style={{ fontWeight: 500 }}>{r.customerName}</p>
                        <p className="text-xs text-[#7a756e]">{r.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3" style={{ fontWeight: 500 }}>{r.petName}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${getTypeColor(r.type)}`}>
                        {r.typeName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-xs text-[#7a756e]">
                        {r.channel === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        {r.channel === 'email' ? 'Email' : 'SMS'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border whitespace-nowrap ${statusConfig.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#7a756e]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {r.scheduledDate}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {r.status === 'pending' && (
                          <button onClick={() => handleCancel(r.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Hủy">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === 'failed' && (
                          <button onClick={() => handleRetry(r.id)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs" title="Gửi lại">
                            <Send className="w-4 h-4" /> Gửi lại
                          </button>
                        )}
                        {r.status === 'sent' && (
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

      {/* Create Reminder Modal */}
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
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]">
                  <option value="">Chọn khách hàng</option>
                  {mockUsers.filter(u => u.role === 'customer').map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Thú cưng</label>
                <select value={formData.petId} onChange={e => setFormData({ ...formData, petId: e.target.value })}
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]">
                  <option value="">Chọn thú cưng</option>
                  {mockPets.filter(p => !formData.customerId || p.ownerId === formData.customerId).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.breed})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Loại nhắc nhở</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as Reminder['type'], typeName: reminderTypes[e.target.value] })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]">
                    {Object.entries(reminderTypes).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Kênh gửi</label>
                  <select value={formData.channel} onChange={e => setFormData({ ...formData, channel: e.target.value as Reminder['channel'] })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Chi tiết nhắc nhở</label>
                <input value={formData.typeName} onChange={e => setFormData({ ...formData, typeName: e.target.value })} placeholder="VD: Tiêm vaccine dại lần 2"
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Ngày gửi</label>
                <input type="date" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
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
