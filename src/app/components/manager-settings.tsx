import { useState } from 'react';
import { motion } from 'motion/react';
import {
  User, Building2, CreditCard, BellRing, Save, Check,
  Crown, Zap, PawPrint, BarChart3, Mail, Smartphone
} from 'lucide-react';

const settingsTabs = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'clinic', label: 'Thông tin phòng khám', icon: Building2 },
  { id: 'subscription', label: 'Gói & Thanh toán', icon: CreditCard },
  { id: 'notifications', label: 'Thông báo', icon: BellRing },
];

export function ManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    name: 'Phạm Hương',
    email: 'huong.pham@email.com',
    phone: '0934567890',
    role: 'Quản trị viên',
  });

  // Clinic form
  const [clinic, setClinic] = useState({
    name: 'PetHub Clinic',
    taxId: '0123456789',
    phone: '028-1234-5678',
    address: '123 Nguyễn Huệ, Q.1, TP.HCM',
    invoiceNote: 'Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub!',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailBooking: true,
    emailReminder: true,
    smsBooking: false,
    smsReminder: true,
    dailyReport: true,
    weeklyReport: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          {"Cài đặt"}
        </h1>
        <p className="text-sm text-[#7a756e] mt-1">{"Quản lý thông tin tài khoản và phòng khám"}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Nav Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden">
            {settingsTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all border-b border-[#2d2a26]/10 last:border-b-0 ${
                  activeTab === tab.id
                    ? 'bg-[#6b8f5e] text-white'
                    : 'text-[#2d2a26] hover:bg-[#f0ede8]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {"Hồ sơ cá nhân"}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{"Thông tin tài khoản quản trị của bạn"}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#c67d5b] flex items-center justify-center border-2 border-[#2d2a26]">
                    <span className="text-white text-xl" style={{ fontWeight: 600 }}>PH</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>{profile.name}</p>
                    <p className="text-xs text-[#7a756e]">{profile.role}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{"Họ và tên"}</label>
                    <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">Email</label>
                    <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{"Số điện thoại"}</label>
                    <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{"Vai trò"}</label>
                    <input value={profile.role} disabled
                      className="w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-[#f0ede8] text-[#7a756e]" />
                  </div>
                </div>
                <div className="pt-3">
                  <button onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CLINIC TAB */}
          {activeTab === 'clinic' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {"Thông tin phòng khám"}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{"Thông tin hiển thị trên hóa đơn và trang công khai"}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{"Tên phòng khám"}</label>
                    <input value={clinic.name} onChange={e => setClinic({ ...clinic, name: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{"Mã số thuế"}</label>
                    <input value={clinic.taxId} onChange={e => setClinic({ ...clinic, taxId: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{"Số điện thoại"}</label>
                    <input value={clinic.phone} onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">{"Địa chỉ"}</label>
                  <input value={clinic.address} onChange={e => setClinic({ ...clinic, address: e.target.value })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">{"Ghi chú hóa đơn"}</label>
                  <textarea value={clinic.invoiceNote} onChange={e => setClinic({ ...clinic, invoiceNote: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6] resize-none" />
                </div>
                <div className="pt-3">
                  <button onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === 'subscription' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6">
              {/* Current Plan Status */}
              <div className="bg-white border border-[#2d2a26] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#7a756e]">{"Gói hiện tại"}</p>
                    <p className="text-lg text-[#2d2a26] mt-1" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      Basic (Miễn phí)
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#f0ede8] border border-[#2d2a26]/20 text-xs" style={{ fontWeight: 500 }}>
                    {"Đang sử dụng"}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-[#7a756e]">
                  <span>{"Bắt đầu: 01/01/2026"}</span>
                  <span>&bull;</span>
                  <span>{"Thú cưng: 10/10 (đã dùng hết)"}</span>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Basic Plan */}
                <div className="bg-white border border-[#2d2a26] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PawPrint className="w-5 h-5 text-[#7a756e]" />
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>Basic</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {"Miễn phí"}
                    </span>
                  </div>
                  <ul className="space-y-2.5 mb-6 text-sm text-[#7a756e]">
                    {[
                      'Tối đa 10 thú cưng',
                      'Quản lý lịch hẹn cơ bản',
                      'Hóa đơn & thanh toán',
                      'Báo cáo doanh thu',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#6b8f5e]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-2.5 rounded-xl border border-[#2d2a26]/30 text-center text-sm text-[#7a756e]">
                    {"Gói hiện tại"}
                  </div>
                </div>

                {/* Premium Plan */}
                <div className="bg-[#6b8f5e]/5 border-2 border-[#6b8f5e] rounded-2xl p-6 relative">
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-[#6b8f5e] text-white text-[10px]" style={{ fontWeight: 600 }}>
                    {"PHỔ BIẾN NHẤT"}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-[#c67d5b]" />
                    <h3 className="text-sm text-[#6b8f5e]" style={{ fontWeight: 600 }}>Premium</h3>
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      249.000
                    </span>
                    <span className="text-sm text-[#7a756e] ml-1">VND/tháng</span>
                  </div>
                  <p className="text-xs text-[#7a756e] mb-4">{"Thanh toán hàng tháng, hủy bất cứ lúc nào"}</p>
                  <ul className="space-y-2.5 mb-6 text-sm">
                    {[
                      { text: 'Không giới hạn thú cưng', highlight: true },
                      { text: 'CRM Automations', highlight: true },
                      { text: 'Digital Pet Card', highlight: true },
                      { text: 'Smart Reminders', highlight: false },
                      { text: 'Báo cáo nâng cao', highlight: false },
                      { text: 'Hỗ trợ ưu tiên 24/7', highlight: false },
                    ].map(f => (
                      <li key={f.text} className={`flex items-center gap-2 ${f.highlight ? 'text-[#2d2a26]' : 'text-[#7a756e]'}`}>
                        <Zap className={`w-4 h-4 ${f.highlight ? 'text-[#c67d5b]' : 'text-[#6b8f5e]'}`} />
                        <span style={f.highlight ? { fontWeight: 500 } : {}}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full py-3 rounded-xl bg-[#6b8f5e] text-white text-sm border border-[#2d2a26] hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer"
                    style={{ fontWeight: 600 }}
                  >
                    {"Nâng cấp lên Premium"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {"Cài đặt thông báo"}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{"Quản lý cách nhận thông báo từ hệ thống"}</p>
              </div>
              <div className="divide-y divide-[#2d2a26]/10">
                {/* Email */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-[#6b8f5e]" />
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>Email</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'emailBooking' as const, label: 'Thông báo lịch hẹn mới', desc: 'Nhận email khi có lịch hẹn mới từ khách hàng' },
                      { key: 'emailReminder' as const, label: 'Nhắc nhở lịch hẹn', desc: 'Email nhắc nhở trước giờ hẹn 1 tiếng' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <p className="text-xs text-[#7a756e]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => toggleNotif(item.key)}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            notifications[item.key] ? 'bg-[#6b8f5e]' : 'bg-[#e8e4de]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white border border-[#2d2a26]/20 absolute top-1 transition-all ${
                            notifications[item.key] ? 'left-5' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SMS */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-4 h-4 text-[#c67d5b]" />
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>SMS</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'smsBooking' as const, label: 'SMS lịch hẹn mới', desc: 'Nhận SMS khi có lịch hẹn mới' },
                      { key: 'smsReminder' as const, label: 'SMS nhắc nhở khách hàng', desc: 'Tự động gửi SMS nhắc nhở cho khách' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <p className="text-xs text-[#7a756e]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => toggleNotif(item.key)}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            notifications[item.key] ? 'bg-[#6b8f5e]' : 'bg-[#e8e4de]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white border border-[#2d2a26]/20 absolute top-1 transition-all ${
                            notifications[item.key] ? 'left-5' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reports */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-[#4a90d9]" />
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>{"Báo cáo"}</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'dailyReport' as const, label: 'Báo cáo hàng ngày', desc: 'Tổng hợp doanh thu và lịch hẹn cuối mỗi ngày' },
                      { key: 'weeklyReport' as const, label: 'Báo cáo hàng tuần', desc: 'Phân tích chi tiết hiệu suất mỗi tuần' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <p className="text-xs text-[#7a756e]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => toggleNotif(item.key)}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            notifications[item.key] ? 'bg-[#6b8f5e]' : 'bg-[#e8e4de]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white border border-[#2d2a26]/20 absolute top-1 transition-all ${
                            notifications[item.key] ? 'left-5' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-[#2d2a26]/10">
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
