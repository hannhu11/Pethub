import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import {
  User, Building2, CreditCard, BellRing, Save, Check,
  Crown, Zap, PawPrint, BarChart3, Mail, Smartphone, LockKeyhole
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  getClinicSettings,
  getProfileSettings,
  getSubscriptionSettings,
  saveClinicSettings,
  saveProfileSettings,
  subscribeManagerSettingsUpdates,
} from './manager-settings-store';
import type { SensitiveSaveConfirmState } from '../types';

const settingsTabs = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'clinic', label: 'Thông tin phòng khám', icon: Building2 },
  { id: 'password', label: 'Đổi mật khẩu', icon: LockKeyhole },
  { id: 'subscription', label: 'Gói & Thanh toán', icon: CreditCard },
  { id: 'notifications', label: 'Thông báo', icon: BellRing },
] as const;

type SettingsTabId = (typeof settingsTabs)[number]['id'];

export function ManagerSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabIds = useMemo(() => settingsTabs.map((tab) => tab.id), []);
  const requestedTab = searchParams.get('tab');
  const initialTab: SettingsTabId =
    requestedTab && validTabIds.includes(requestedTab as SettingsTabId) ? (requestedTab as SettingsTabId) : 'profile';

  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [savedTarget, setSavedTarget] = useState<'profile' | 'clinic' | null>(null);
  const [profile, setProfile] = useState(getProfileSettings());
  const [clinic, setClinic] = useState(getClinicSettings());
  const [subscription, setSubscription] = useState(getSubscriptionSettings());
  const [confirmState, setConfirmState] = useState<SensitiveSaveConfirmState>({
    open: false,
    target: null,
    password: '',
    submitting: false,
  });
  const [confirmError, setConfirmError] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailBooking: true,
    emailReminder: true,
    smsBooking: false,
    smsReminder: true,
    dailyReport: true,
    weeklyReport: false,
  });

  useEffect(() => {
    if (!requestedTab || !validTabIds.includes(requestedTab as SettingsTabId)) {
      return;
    }
    setActiveTab(requestedTab as SettingsTabId);
  }, [requestedTab, validTabIds]);

  useEffect(() => {
    return subscribeManagerSettingsUpdates(() => {
      setProfile(getProfileSettings());
      setClinic(getClinicSettings());
      setSubscription(getSubscriptionSettings());
    });
  }, []);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    setSearchParams(nextParams, { replace: true });
  };

  const openSensitiveConfirm = (target: 'profile' | 'clinic') => {
    setConfirmError('');
    setConfirmState({ open: true, target, password: '', submitting: false });
  };

  const closeSensitiveConfirm = () => {
    setConfirmError('');
    setConfirmState({ open: false, target: null, password: '', submitting: false });
  };

  const submitSensitiveSave = () => {
    if (!confirmState.target) return;
    const password = confirmState.password.trim();
    if (password.length < 6) {
      setConfirmError('Vui lòng nhập mật khẩu xác nhận (tối thiểu 6 ký tự).');
      return;
    }

    setConfirmState(prev => ({ ...prev, submitting: true }));
    if (confirmState.target === 'profile') {
      saveProfileSettings(profile);
      setSavedTarget('profile');
    } else {
      saveClinicSettings(clinic);
      setSavedTarget('clinic');
    }

    window.setTimeout(() => {
      setSavedTarget(null);
    }, 2000);

    closeSensitiveConfirm();
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePassword = () => {
    setPasswordError('');
    setPasswordSaved(false);

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setPasswordSaved(true);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    window.setTimeout(() => {
      setPasswordSaved(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          {'Cài đặt'}
        </h1>
        <p className="text-sm text-[#7a756e] mt-1">{'Quản lý thông tin tài khoản và phòng khám'}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden">
            {settingsTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {'Hồ sơ cá nhân'}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{'Thông tin tài khoản quản trị của bạn (yêu cầu xác thực mật khẩu khi lưu)'}</p>
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
                    <label className="text-xs text-[#7a756e] mb-1 block">{'Họ và tên'}</label>
                    <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">Email</label>
                    <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{'Số điện thoại'}</label>
                    <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{'Vai trò'}</label>
                    <input value={profile.role} disabled
                      className="w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-[#f0ede8] text-[#7a756e]" />
                  </div>
                </div>
                <div className="pt-3">
                  <button onClick={() => openSensitiveConfirm('profile')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                    {savedTarget === 'profile' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {savedTarget === 'profile' ? 'Đã lưu!' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'clinic' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {'Thông tin phòng khám'}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{'Thông tin hiển thị trên hóa đơn và trang công khai (yêu cầu xác thực mật khẩu khi lưu)'}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{'Tên phòng khám'}</label>
                    <input value={clinic.name} onChange={e => setClinic({ ...clinic, name: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{'Mã số thuế'}</label>
                    <input value={clinic.taxId} onChange={e => setClinic({ ...clinic, taxId: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">{'Số điện thoại'}</label>
                    <input value={clinic.phone} onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">{'Địa chỉ'}</label>
                  <input value={clinic.address} onChange={e => setClinic({ ...clinic, address: e.target.value })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6]" />
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">{'Ghi chú hóa đơn'}</label>
                  <textarea value={clinic.invoiceNote} onChange={e => setClinic({ ...clinic, invoiceNote: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf9f6] resize-none" />
                </div>
                <div className="pt-3">
                  <button onClick={() => openSensitiveConfirm('clinic')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                    {savedTarget === 'clinic' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {savedTarget === 'clinic' ? 'Đã lưu!' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {'Đổi mật khẩu'}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{'Chuẩn bảo mật quốc tế: tối thiểu 8 ký tự và xác nhận khớp mật khẩu mới'}</p>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a756e] mb-1 block">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
                {passwordError ? <p className="text-xs text-red-600">{passwordError}</p> : null}
                {passwordSaved ? <p className="text-xs text-emerald-700">Đã cập nhật mật khẩu thành công.</p> : null}
                <div className="pt-2">
                  <button onClick={savePassword}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                    {passwordSaved ? <Check className="w-4 h-4" /> : <LockKeyhole className="w-4 h-4" />}
                    {passwordSaved ? 'Đã cập nhật' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6">
              <div className="bg-white border border-[#2d2a26] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#7a756e]">{'Gói hiện tại'}</p>
                    <p className="text-lg text-[#2d2a26] mt-1" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {subscription.plan === 'premium' ? 'Premium' : 'Basic (Miễn phí)'}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#f0ede8] border border-[#2d2a26]/20 text-xs" style={{ fontWeight: 500 }}>
                    {subscription.plan === 'premium' ? 'Premium đang hoạt động' : 'Đang sử dụng'}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-[#7a756e]">
                  <span>{`Bắt đầu: ${subscription.activatedAt ?? '01/01/2026'}`}</span>
                  <span>&bull;</span>
                  <span>{subscription.plan === 'premium' ? 'Không giới hạn hồ sơ thú cưng' : 'Thú cưng: 10/10 (đã dùng hết)'}</span>
                  {subscription.paymentMethod ? (
                    <>
                      <span>&bull;</span>
                      <span>{`Phương thức: ${subscription.paymentMethod.toUpperCase()}`}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="bg-white border border-[#2d2a26] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PawPrint className="w-5 h-5 text-[#7a756e]" />
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>Basic</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {'Miễn phí'}
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
                    {'Gói hiện tại'}
                  </div>
                </div>

                <div className="bg-[#6b8f5e]/5 border-2 border-[#6b8f5e] rounded-2xl p-6 relative">
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-[#6b8f5e] text-white text-[10px]" style={{ fontWeight: 600 }}>
                    {'PHỔ BIẾN NHẤT'}
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
                  <p className="text-xs text-[#7a756e] mb-4">{'Thanh toán hàng tháng, hủy bất cứ lúc nào'}</p>
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
                    type='button'
                    onClick={() => navigate('/manager/settings/upgrade-premium')}
                    disabled={subscription.plan === 'premium'}
                    className={`w-full py-3 rounded-xl text-sm border border-[#2d2a26] transition-all ${
                      subscription.plan === 'premium'
                        ? 'bg-[#f0ede8] text-[#7a756e] cursor-not-allowed'
                        : 'bg-[#6b8f5e] text-white hover:-translate-y-1 active:translate-y-0 cursor-pointer'
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {subscription.plan === 'premium' ? 'Bạn đang dùng Premium' : 'Nâng cấp lên Premium'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#2d2a26] rounded-2xl">
              <div className="p-5 border-b border-[#2d2a26]/10">
                <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  {'Cài đặt thông báo'}
                </h2>
                <p className="text-xs text-[#7a756e] mt-1">{'Quản lý cách nhận thông báo từ hệ thống'}</p>
              </div>
              <div className="divide-y divide-[#2d2a26]/10">
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

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-[#4a90d9]" />
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>{'Báo cáo'}</h3>
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
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={confirmState.open} onOpenChange={(open) => (open ? undefined : closeSensitiveConfirm())}>
        <DialogContent className='max-w-md border-[#2d2a26] bg-[#faf9f6]'>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Xác thực thay đổi nhạy cảm</DialogTitle>
            <DialogDescription>
              Vui lòng nhập mật khẩu để xác nhận lưu thay đổi {confirmState.target === 'clinic' ? 'thông tin phòng khám' : 'hồ sơ cá nhân'}.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <label className='text-xs text-[#7a756e] mb-1 block'>Mật khẩu xác nhận</label>
              <input
                type='password'
                value={confirmState.password}
                onChange={(event) => {
                  setConfirmError('');
                  setConfirmState((prev) => ({ ...prev, password: event.target.value }));
                }}
                placeholder='Nhập mật khẩu của bạn'
                className='w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white'
              />
            </div>
            {confirmError ? <p className='text-xs text-red-600'>{confirmError}</p> : null}
            <div className='flex justify-end gap-2 pt-1'>
              <button
                type='button'
                onClick={closeSensitiveConfirm}
                className='px-4 py-2 rounded-xl border border-[#2d2a26]/30 text-sm bg-white'
              >
                Hủy
              </button>
              <button
                type='button'
                onClick={submitSensitiveSave}
                disabled={confirmState.submitting}
                className='px-4 py-2 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white text-sm disabled:opacity-70'
                style={{ fontWeight: 600 }}
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
