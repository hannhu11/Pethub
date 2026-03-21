import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import {
  User, Building2, CreditCard, BellRing, Save, Check,
  Crown, PawPrint, BarChart3, Mail, LockKeyhole
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  getClinicSettings,
  getProfileSettings,
  getSubscriptionSettings,
  hydrateManagerSettings,
  saveClinicSettings,
  saveProfileSettings,
  subscribeManagerSettingsUpdates,
} from './manager-settings-store';
import type { SensitiveSaveConfirmState } from '../types';
import { extractApiError } from '../lib/api-client';
import {
  getManagerSettings,
  updateClinicSettings,
  updateNotificationSettings,
  updatePasswordSettings,
  updateProfileSettings,
} from '../lib/pethub-api';
import {
  pricingPlanDefinitions,
  subscriptionPlanLabels,
  normalizeSubscriptionPlan,
} from '../constants/pricing';

const settingsTabs = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'clinic', label: 'Thông tin phòng khám', icon: Building2 },
  { id: 'password', label: 'Đổi mật khẩu', icon: LockKeyhole },
  { id: 'subscription', label: 'Gói & Thanh toán', icon: CreditCard },
  { id: 'notifications', label: 'Thông báo', icon: BellRing },
] as const;

type SettingsTabId = (typeof settingsTabs)[number]['id'];

function toRoleLabel(role: 'customer' | 'manager') {
  return role === 'manager' ? 'Quản trị viên' : 'Khách hàng';
}

function initialsFromName(name: string) {
  const normalized = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
  return normalized || 'PH';
}

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
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [clinicSaving, setClinicSaving] = useState(false);
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
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailBooking: true,
    emailReminder: true,
    smsBooking: false,
    smsReminder: false,
    dailyReport: true,
    weeklyReport: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifError, setNotifError] = useState('');

  const applyManagerSettingsData = (data: Awaited<ReturnType<typeof getManagerSettings>>) => {
    const nextProfile = {
      name: data.profile.name,
      email: data.profile.email,
      phone: data.profile.phone,
      role: toRoleLabel(data.profile.role),
    };
    const nextClinic = {
      name: data.clinic?.clinicName ?? '',
      taxId: data.clinic?.taxId ?? '',
      phone: data.clinic?.phone ?? '',
      address: data.clinic?.address ?? '',
      invoiceNote: data.clinic?.invoiceNote ?? '',
    };
    const normalizedPlan = normalizeSubscriptionPlan(
      data.subscription?.planCode,
      data.subscription?.planName,
      data.subscription?.isActive,
    );
    const nextSubscription = {
      plan: normalizedPlan,
      amount: Number(data.subscription?.amount ?? getSubscriptionSettings().amount ?? 0),
      currency: 'VND' as const,
      billingCycle: 'monthly' as const,
      paymentMethod: getSubscriptionSettings().paymentMethod,
      activatedAt: data.billing?.startedAt
        ? new Date(data.billing.startedAt).toLocaleDateString('vi-VN')
        : undefined,
      expiresAt:
        normalizedPlan !== 'inactive' && data.billing?.expiresAt
          ? new Date(data.billing.expiresAt).toLocaleDateString('vi-VN')
          : undefined,
      remainingDays:
        normalizedPlan !== 'inactive' && typeof data.billing?.remainingDays === 'number'
          ? Math.max(0, Math.ceil(data.billing.remainingDays))
          : null,
      petCount: Number(data.usage?.petCount ?? getSubscriptionSettings().petCount ?? 0),
    };

    setProfile(nextProfile);
    setClinic(nextClinic);
    setSubscription(nextSubscription);
    setNotifications({
      emailBooking: data.notifications.emailBooking,
      emailReminder: data.notifications.emailReminder,
      smsBooking: data.notifications.smsBooking,
      smsReminder: data.notifications.smsReminder,
      dailyReport: data.notifications.dailyReport,
      weeklyReport: data.notifications.weeklyReport,
    });

    hydrateManagerSettings({
      profile: nextProfile,
      clinic: nextClinic,
      subscription: nextSubscription,
    });
  };

  useEffect(() => {
    if (!requestedTab || !validTabIds.includes(requestedTab as SettingsTabId)) {
      return;
    }
    setActiveTab(requestedTab as SettingsTabId);
  }, [requestedTab, validTabIds]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setSettingsLoading(true);
      setNotifLoading(true);
      setSettingsError('');
      setNotifError('');
      try {
        const data = await getManagerSettings();
        if (!mounted) {
          return;
        }
        applyManagerSettingsData(data);
      } catch (apiError) {
        if (mounted) {
          const message = extractApiError(apiError);
          setSettingsError(message);
          setNotifError(message);
        }
      } finally {
        if (mounted) {
          setSettingsLoading(false);
          setNotifLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

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

  const submitSensitiveSave = async () => {
    if (!confirmState.target) return;
    const password = confirmState.password.trim();
    if (password.length < 6) {
      setConfirmError('Vui lòng nhập mật khẩu xác nhận (tối thiểu 6 ký tự).');
      return;
    }

    setConfirmState((prev) => ({ ...prev, submitting: true }));
    setConfirmError('');
    setSettingsError('');

    try {
      if (confirmState.target === 'profile') {
        setProfileSaving(true);
        const data = await updateProfileSettings({
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
          confirmPassword: password,
        });
        const nextProfile = {
          name: data.profile.name,
          email: data.profile.email,
          phone: data.profile.phone,
          role: toRoleLabel(data.profile.role),
        };
        setProfile(nextProfile);
        saveProfileSettings(nextProfile);
        setSavedTarget('profile');
      } else {
        setClinicSaving(true);
        const data = await updateClinicSettings({
          clinicName: clinic.name.trim(),
          taxId: clinic.taxId.trim() || undefined,
          phone: clinic.phone.trim(),
          address: clinic.address.trim(),
          invoiceNote: clinic.invoiceNote.trim() || undefined,
          confirmPassword: password,
        });
        const nextClinic = {
          name: data.clinic.clinicName,
          taxId: data.clinic.taxId ?? '',
          phone: data.clinic.phone,
          address: data.clinic.address,
          invoiceNote: data.clinic.invoiceNote ?? '',
        };
        setClinic(nextClinic);
        saveClinicSettings(nextClinic);
        setSavedTarget('clinic');
      }

      // Force-read latest persisted settings to avoid stale UI after refresh (F5).
      try {
        const latest = await getManagerSettings();
        applyManagerSettingsData(latest);
      } catch {
        // Keep optimistic values when follow-up reload is temporarily unavailable.
      }

      window.setTimeout(() => {
        setSavedTarget(null);
      }, 2000);

      closeSensitiveConfirm();
    } catch (apiError) {
      setConfirmError(extractApiError(apiError));
    } finally {
      setProfileSaving(false);
      setClinicSaving(false);
      setConfirmState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const toggleNotif = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setNotifSaving(true);
    setNotifError('');
    try {
      await updateNotificationSettings(next);
    } catch (apiError) {
      setNotifications(notifications);
      setNotifError(extractApiError(apiError));
    } finally {
      setNotifSaving(false);
    }
  };

  const savePassword = async () => {
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

    setPasswordSaving(true);
    try {
      await updatePasswordSettings({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmPassword,
      });
      setPasswordSaved(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      window.setTimeout(() => {
        setPasswordSaved(false);
      }, 2000);
    } catch (apiError) {
      setPasswordError(extractApiError(apiError));
    } finally {
      setPasswordSaving(false);
    }
  };

  const currentPlanLabel = subscriptionPlanLabels[subscription.plan];
  const currentPlanStatus =
    subscription.plan === 'inactive'
      ? 'Chưa kích hoạt'
      : subscription.plan === 'enterprise'
        ? 'Enterprise tùy chỉnh'
        : `${currentPlanLabel} đang hoạt động`;
  const planCards = pricingPlanDefinitions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#592518]" style={{ fontWeight: 700 }}>
          {'Cài đặt'}
        </h1>
        <p className="text-sm text-[#8b6a61] mt-1">{'Quản lý thông tin tài khoản và phòng khám'}</p>
        {settingsLoading ? <p className='text-xs text-[#8b6a61] mt-2'>Đang đồng bộ cấu hình hệ thống...</p> : null}
        {settingsError ? <p className='text-xs text-red-600 mt-2'>{settingsError}</p> : null}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white border border-[#592518] rounded-2xl overflow-hidden">
            {settingsTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all border-b border-[#592518]/10 last:border-b-0 ${
                  activeTab === tab.id
                    ? 'bg-[#d56756] text-white'
                    : 'text-[#592518] hover:bg-[#f4ece4]'
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
              className="bg-white border border-[#592518] rounded-2xl">
              <div className="p-5 border-b border-[#592518]/10">
                <h2 className="text-lg text-[#592518]" style={{ fontWeight: 600 }}>
                  {'Hồ sơ cá nhân'}
                </h2>
                <p className="text-xs text-[#8b6a61] mt-1">{'Thông tin tài khoản quản trị của bạn (yêu cầu xác thực mật khẩu khi lưu)'}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#c75b4c] flex items-center justify-center border-2 border-[#592518]">
                    <span className="text-white text-xl" style={{ fontWeight: 600 }}>{initialsFromName(profile.name)}</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>{profile.name}</p>
                    <p className="text-xs text-[#8b6a61]">{profile.role}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">{'Họ và tên'}</label>
                    <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">Email</label>
                    <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">{'Số điện thoại'}</label>
                    <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">{'Vai trò'}</label>
                    <input value={profile.role} disabled
                      className="w-full p-3 border border-[#592518]/30 rounded-xl text-sm bg-[#f4ece4] text-[#8b6a61]" />
                  </div>
                </div>
                <div className="pt-3">
                  <button onClick={() => openSensitiveConfirm('profile')}
                    disabled={profileSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d56756] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#592518]">
                    {savedTarget === 'profile' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {savedTarget === 'profile' ? 'Đã lưu!' : profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'clinic' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#592518] rounded-2xl">
              <div className="p-5 border-b border-[#592518]/10">
                <h2 className="text-lg text-[#592518]" style={{ fontWeight: 600 }}>
                  {'Thông tin phòng khám'}
                </h2>
                <p className="text-xs text-[#8b6a61] mt-1">{'Thông tin hiển thị trên hóa đơn và trang công khai (yêu cầu xác thực mật khẩu khi lưu)'}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">{'Tên phòng khám'}</label>
                    <input value={clinic.name} onChange={e => setClinic({ ...clinic, name: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">{'Mã số thuế'}</label>
                    <input value={clinic.taxId} onChange={e => setClinic({ ...clinic, taxId: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">{'Số điện thoại'}</label>
                    <input value={clinic.phone} onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#8b6a61] mb-1 block">{'Địa chỉ'}</label>
                  <input value={clinic.address} onChange={e => setClinic({ ...clinic, address: e.target.value })}
                    className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5]" />
                </div>
                <div>
                  <label className="text-xs text-[#8b6a61] mb-1 block">{'Ghi chú hóa đơn'}</label>
                  <textarea value={clinic.invoiceNote} onChange={e => setClinic({ ...clinic, invoiceNote: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white focus:outline-none focus:bg-[#faf8f5] resize-none" />
                </div>
                <div className="pt-3">
                  <button onClick={() => openSensitiveConfirm('clinic')}
                    disabled={clinicSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d56756] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#592518]">
                    {savedTarget === 'clinic' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {savedTarget === 'clinic' ? 'Đã lưu!' : clinicSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#592518] rounded-2xl">
              <div className="p-5 border-b border-[#592518]/10">
                <h2 className="text-lg text-[#592518]" style={{ fontWeight: 600 }}>
                  {'Đổi mật khẩu'}
                </h2>
                <p className="text-xs text-[#8b6a61] mt-1">{'Chuẩn bảo mật quốc tế: tối thiểu 8 ký tự và xác nhận khớp mật khẩu mới'}</p>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs text-[#8b6a61] mb-1 block">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b6a61] mb-1 block">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full p-3 border border-[#592518] rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
                {passwordError ? <p className="text-xs text-red-600">{passwordError}</p> : null}
                {passwordSaved ? <p className="text-xs text-emerald-700">Đã cập nhật mật khẩu thành công.</p> : null}
                <div className="pt-2">
                  <button onClick={() => void savePassword()}
                    disabled={passwordSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d56756] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#592518]">
                    {passwordSaved ? <Check className="w-4 h-4" /> : <LockKeyhole className="w-4 h-4" />}
                    {passwordSaved ? 'Đã cập nhật' : passwordSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6">
              <div className="bg-white border border-[#592518] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8b6a61]">{'Gói hiện tại'}</p>
                    <p className="text-lg text-[#592518] mt-1" style={{ fontWeight: 700 }}>
                      {currentPlanLabel}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#f4ece4] border border-[#592518]/20 text-xs" style={{ fontWeight: 500 }}>
                    {currentPlanStatus}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-[#8b6a61] flex-wrap">
                  {subscription.activatedAt ? <span>{`Kích hoạt: ${subscription.activatedAt}`}</span> : null}
                  {subscription.plan !== 'inactive' ? (
                    <>
                      {subscription.expiresAt ? (
                        <>
                          <span>&bull;</span>
                          <span>{`Hết hạn: ${subscription.expiresAt}`}</span>
                        </>
                      ) : null}
                      {typeof subscription.remainingDays === 'number' ? (
                        <>
                          <span>&bull;</span>
                          <span>{`Còn: ${subscription.remainingDays} ngày`}</span>
                        </>
                      ) : null}
                    </>
                  ) : null}
                  <span>&bull;</span>
                  <span>
                    {subscription.plan === 'starter'
                      ? `Thú cưng: ${subscription.petCount}/200`
                      : subscription.plan === 'professional' || subscription.plan === 'enterprise'
                        ? `Thú cưng: ${subscription.petCount} hồ sơ (không giới hạn)`
                        : `Thú cưng: ${subscription.petCount} hồ sơ hiện có`}
                  </span>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                {planCards.map((plan) => {
                  const isCurrentPlan = subscription.plan === plan.code;
                  const isHighlight = Boolean(plan.highlight);
                  const cardIcon =
                    plan.code === 'professional' ? Crown : plan.code === 'enterprise' ? Building2 : PawPrint;

                  return (
                    <div
                      key={plan.code}
                      className={`relative rounded-2xl p-6 ${
                        isHighlight
                          ? 'bg-[#d56756]/5 border-2 border-[#d56756]'
                          : 'bg-white border border-[#592518]'
                      }`}
                    >
                      {isHighlight ? (
                        <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-[#d56756] text-white text-[10px]" style={{ fontWeight: 600 }}>
                          PHỔ BIẾN NHẤT
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2 mb-4">
                        <cardIcon className={`w-5 h-5 ${isHighlight ? 'text-[#c75b4c]' : 'text-[#8b6a61]'}`} />
                        <h3 className={`text-sm ${isHighlight ? 'text-[#d56756]' : 'text-[#592518]'}`} style={{ fontWeight: 600 }}>
                          {plan.title}
                        </h3>
                      </div>

                      <p className="text-xs text-[#8b6a61] mb-3">{plan.tagline}</p>

                      <div className="mb-4">
                        <span className={`text-3xl ${plan.contactOnly ? 'text-[#d56756]' : 'text-[#592518]'}`} style={{ fontWeight: 700 }}>
                          {plan.priceLabel}
                        </span>
                        {plan.priceSuffix ? <span className="text-sm text-[#8b6a61] ml-1">{plan.priceSuffix}</span> : null}
                      </div>

                      <ul className="space-y-2.5 mb-6 text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-[#592518]">
                            <Check className="w-4 h-4 text-[#d56756] mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type='button'
                        onClick={() => {
                          if (plan.contactOnly) {
                            window.location.href = 'mailto:support@pethub.vn?subject=Tu%20van%20goi%20Enterprise%20PetHub';
                            return;
                          }
                          navigate(`/manager/settings/upgrade-plan/${plan.code}`);
                        }}
                        disabled={isCurrentPlan}
                        className={`w-full py-3 rounded-xl text-sm border border-[#592518] transition-all ${
                          isCurrentPlan
                            ? 'bg-[#f4ece4] text-[#8b6a61] cursor-not-allowed'
                            : isHighlight
                              ? 'bg-[#d56756] text-white hover:-translate-y-1 active:translate-y-0 cursor-pointer'
                              : 'bg-white text-[#592518] hover:-translate-y-1 active:translate-y-0 cursor-pointer'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {isCurrentPlan
                          ? 'Gói hiện tại'
                          : plan.contactOnly
                            ? 'Liên hệ tư vấn'
                            : `Chọn gói ${plan.title}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#592518] rounded-2xl">
              <div className="p-5 border-b border-[#592518]/10">
                <h2 className="text-lg text-[#592518]" style={{ fontWeight: 600 }}>
                  {'Cài đặt thông báo'}
                </h2>
                <p className="text-xs text-[#8b6a61] mt-1">{'Quản lý cách nhận thông báo từ hệ thống'}</p>
                {notifLoading ? <p className='text-xs text-[#8b6a61] mt-2'>Đang tải cài đặt thông báo...</p> : null}
                {notifSaving ? <p className='text-xs text-[#d56756] mt-2'>Đang lưu thay đổi...</p> : null}
                {notifError ? <p className='text-xs text-red-600 mt-2'>{notifError}</p> : null}
              </div>
              <div className="divide-y divide-[#592518]/10">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-[#d56756]" />
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
                          <p className="text-xs text-[#8b6a61]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => void toggleNotif(item.key)}
                          disabled={notifLoading || notifSaving}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            notifications[item.key] ? 'bg-[#d56756]' : 'bg-[#efe3d7]'
                          } disabled:opacity-60`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white border border-[#592518]/20 absolute top-1 transition-all ${
                            notifications[item.key] ? 'left-5' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-[#c75b4c]" />
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
                          <p className="text-xs text-[#8b6a61]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => void toggleNotif(item.key)}
                          disabled={notifLoading || notifSaving}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            notifications[item.key] ? 'bg-[#d56756]' : 'bg-[#efe3d7]'
                          } disabled:opacity-60`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white border border-[#592518]/20 absolute top-1 transition-all ${
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
        <DialogContent className='max-w-md border-[#592518] bg-[#faf8f5]'>
          <DialogHeader>
            <DialogTitle style={{ fontWeight: 700 }}>Xác thực thay đổi nhạy cảm</DialogTitle>
            <DialogDescription>
              Vui lòng nhập mật khẩu để xác nhận lưu thay đổi {confirmState.target === 'clinic' ? 'thông tin phòng khám' : 'hồ sơ cá nhân'}.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <label className='text-xs text-[#8b6a61] mb-1 block'>Mật khẩu xác nhận</label>
              <input
                type='password'
                value={confirmState.password}
                onChange={(event) => {
                  setConfirmError('');
                  setConfirmState((prev) => ({ ...prev, password: event.target.value }));
                }}
                placeholder='Nhập mật khẩu của bạn'
                className='w-full p-3 border border-[#592518] rounded-xl text-sm bg-white'
              />
            </div>
            {confirmError ? <p className='text-xs text-red-600'>{confirmError}</p> : null}
            <div className='flex justify-end gap-2 pt-1'>
              <button
                type='button'
                onClick={closeSensitiveConfirm}
                className='px-4 py-2 rounded-xl border border-[#592518]/30 text-sm bg-white'
              >
                Hủy
              </button>
              <button
                type='button'
                onClick={submitSensitiveSave}
                disabled={confirmState.submitting}
                className='px-4 py-2 rounded-xl border border-[#592518] bg-[#d56756] text-white text-sm disabled:opacity-70'
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

