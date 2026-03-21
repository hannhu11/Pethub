export type SubscriptionPlanCode = 'inactive' | 'starter' | 'professional' | 'enterprise';
export type BillableSubscriptionPlanCode = Exclude<SubscriptionPlanCode, 'inactive' | 'enterprise'>;

export type PricingPlanDefinition = {
  code: Exclude<SubscriptionPlanCode, 'inactive'>;
  title: string;
  tagline: string;
  priceLabel: string;
  priceSuffix?: string;
  features: string[];
  highlight?: boolean;
  contactOnly?: boolean;
  ctaLabel: string;
};

export const pricingPlanDefinitions: PricingPlanDefinition[] = [
  {
    code: 'starter',
    title: 'Starter',
    tagline: 'Phù hợp cho Pet Shop nhỏ, mới khởi nghiệp',
    priceLabel: '299.000',
    priceSuffix: '/tháng',
    features: [
      'Quản lý tối đa 100 khách hàng',
      'Quản lý tối đa 200 thú cưng',
      'Digital Pet Card cơ bản',
      'Lịch hẹn & nhắc nhở tự động',
      'POS thanh toán đơn giản',
      'Báo cáo doanh thu cơ bản',
      'Hỗ trợ email',
      '1 tài khoản nhân viên',
    ],
    ctaLabel: 'Bắt đầu với Starter',
  },
  {
    code: 'professional',
    title: 'Professional',
    tagline: 'Tốt nhất cho Pet Shop & Phòng khám vừa',
    priceLabel: '599.000',
    priceSuffix: '/tháng',
    features: [
      'Khách hàng & thú cưng không giới hạn',
      'Digital Pet Card Premium (Branding riêng)',
      'Lịch hẹn nâng cao + SMS/Zalo tự động',
      'POS đa dạng + In hóa đơn',
      'Báo cáo & phân tích chi tiết',
      'Quản lý tồn kho sản phẩm',
      'Hỗ trợ ưu tiên (Chat + Phone)',
      'Tối đa 5 tài khoản nhân viên',
      'Tích hợp API (Zalo, Banking)',
    ],
    highlight: true,
    ctaLabel: 'Chọn Professional',
  },
  {
    code: 'enterprise',
    title: 'Enterprise',
    tagline: 'Giải pháp tùy chỉnh cho chuỗi Pet Shop',
    priceLabel: 'Liên hệ',
    features: [
      'Tất cả tính năng Professional',
      'Đa chi nhánh (Multi-store)',
      'Phân quyền nhân viên chi tiết',
      'API không giới hạn',
      'Tùy chỉnh giao diện & tính năng',
      'Đào tạo onboarding 1-1',
      'Quản lý tài khoản riêng (Account Manager)',
      'Hỗ trợ 24/7',
      'SLA đảm bảo uptime 99.9%',
    ],
    contactOnly: true,
    ctaLabel: 'Liên hệ tư vấn',
  },
];

export const subscriptionPlanLabels: Record<SubscriptionPlanCode, string> = {
  inactive: 'Chưa kích hoạt',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export const billablePlanAmounts: Record<BillableSubscriptionPlanCode, number> = {
  starter: 299000,
  professional: 599000,
};

export function isBillableSubscriptionPlan(
  plan: string | null | undefined,
): plan is BillableSubscriptionPlanCode {
  return plan === 'starter' || plan === 'professional';
}

export function normalizeSubscriptionPlan(
  planCode?: string | null,
  planName?: string | null,
  isActive?: boolean | null,
): SubscriptionPlanCode {
  const combined = `${planCode ?? ''} ${planName ?? ''}`.toLowerCase();

  if (!isActive || combined.includes('basic-free') || combined.includes('basic')) {
    return 'inactive';
  }

  if (combined.includes('starter')) {
    return 'starter';
  }

  if (combined.includes('professional') || combined.includes('premium') || (!planCode && !planName)) {
    return 'professional';
  }

  if (combined.includes('enterprise')) {
    return 'enterprise';
  }

  return 'inactive';
}
