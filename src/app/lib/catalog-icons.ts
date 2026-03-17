import type { ElementType } from 'react';
import {
  Bone,
  Droplets,
  Gamepad2,
  HeartPulse,
  Home,
  Package,
  Pill,
  Scissors,
  Shield,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Syringe,
  Wind,
} from 'lucide-react';

export type CatalogIconName =
  | 'checkup'
  | 'spa'
  | 'grooming'
  | 'vaccine'
  | 'medical'
  | 'boarding'
  | 'play'
  | 'training'
  | 'wellness'
  | 'drying'
  | 'nutrition'
  | 'product'
  | 'retail'
  | 'pharmacy';

export type CatalogIconOption = {
  key: CatalogIconName;
  label: string;
  color: string;
  bgColor: string;
  icon: ElementType;
};

export const CATALOG_ICON_OPTIONS: CatalogIconOption[] = [
  { key: 'checkup', label: 'Khám tổng quát', color: '#6b8f5e', bgColor: '#6b8f5e20', icon: Stethoscope },
  { key: 'spa', label: 'Tắm & Spa', color: '#4a90d9', bgColor: '#4a90d920', icon: Droplets },
  { key: 'grooming', label: 'Cắt tỉa lông', color: '#c67d5b', bgColor: '#c67d5b20', icon: Scissors },
  { key: 'vaccine', label: 'Tiêm phòng', color: '#d4940a', bgColor: '#d4940a20', icon: Shield },
  { key: 'medical', label: 'Điều trị', color: '#4f8f8a', bgColor: '#4f8f8a20', icon: Syringe },
  { key: 'boarding', label: 'Lưu trú', color: '#8b6f47', bgColor: '#8b6f4720', icon: Home },
  { key: 'play', label: 'Vui chơi', color: '#4f7fa8', bgColor: '#4f7fa820', icon: Gamepad2 },
  { key: 'training', label: 'Huấn luyện', color: '#7d8f5a', bgColor: '#7d8f5a20', icon: Sparkles },
  { key: 'wellness', label: 'Chăm sóc sức khỏe', color: '#bf6f7e', bgColor: '#bf6f7e20', icon: HeartPulse },
  { key: 'drying', label: 'Sấy khô', color: '#5a7ea2', bgColor: '#5a7ea220', icon: Wind },
  { key: 'nutrition', label: 'Dinh dưỡng', color: '#8e6a46', bgColor: '#8e6a4620', icon: Bone },
  { key: 'product', label: 'Sản phẩm', color: '#6f7b8a', bgColor: '#6f7b8a20', icon: Package },
  { key: 'retail', label: 'Bán lẻ', color: '#678074', bgColor: '#67807420', icon: ShoppingBag },
  { key: 'pharmacy', label: 'Dược phẩm', color: '#b37757', bgColor: '#b3775720', icon: Pill },
];

export const FALLBACK_CATALOG_ICON_NAME: CatalogIconName = 'checkup';

const catalogIconMap = new Map<string, CatalogIconOption>(
  CATALOG_ICON_OPTIONS.map((option) => [option.key, option]),
);

export function resolveCatalogIcon(iconName?: string | null): CatalogIconOption {
  if (!iconName) {
    return catalogIconMap.get(FALLBACK_CATALOG_ICON_NAME)!;
  }

  return catalogIconMap.get(iconName) ?? catalogIconMap.get(FALLBACK_CATALOG_ICON_NAME)!;
}

export function filterCatalogIconOptions(keyword: string): CatalogIconOption[] {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return CATALOG_ICON_OPTIONS;
  }

  return CATALOG_ICON_OPTIONS.filter((option) => {
    return option.label.toLowerCase().includes(normalized) || option.key.toLowerCase().includes(normalized);
  });
}
