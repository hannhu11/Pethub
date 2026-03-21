import type { ElementType } from 'react';
import {
  Activity,
  Bath,
  BedDouble,
  Bone,
  Compass,
  Cross,
  Crosshair,
  Droplets,
  Dribbble,
  FlaskConical,
  Gamepad2,
  HeartPulse,
  Home,
  MapPin,
  Microscope,
  Package,
  PawPrint,
  Pill,
  Scissors,
  Shield,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Syringe,
  Tag,
  Target,
  TestTube,
  Trophy,
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
  | 'pharmacy'
  | 'diagnostics'
  | 'lab'
  | 'pathology'
  | 'emergency'
  | 'monitoring'
  | 'bathing'
  | 'premium-care'
  | 'hotel'
  | 'pickup-dropoff'
  | 'obedience'
  | 'behavior'
  | 'activity-fun'
  | 'ball-play'
  | 'accessory'
  | 'preventive';

export type CatalogIconOption = {
  key: CatalogIconName;
  label: string;
  color: string;
  bgColor: string;
  icon: ElementType;
};

export const CATALOG_ICON_OPTIONS: CatalogIconOption[] = [
  { key: 'checkup', label: 'Khám tổng quát', color: '#d56756', bgColor: '#d5675620', icon: Stethoscope },
  { key: 'diagnostics', label: 'Chẩn đoán', color: '#5f7f92', bgColor: '#5f7f9220', icon: Microscope },
  { key: 'lab', label: 'Xét nghiệm', color: '#3c86a8', bgColor: '#3c86a820', icon: TestTube },
  { key: 'pathology', label: 'Giải phẫu bệnh', color: '#546a84', bgColor: '#546a8420', icon: FlaskConical },
  { key: 'emergency', label: 'Cấp cứu', color: '#c25454', bgColor: '#c2545420', icon: Cross },
  { key: 'monitoring', label: 'Theo dõi lâm sàng', color: '#507c7a', bgColor: '#507c7a20', icon: Activity },
  { key: 'spa', label: 'Tắm & Spa', color: '#4a90d9', bgColor: '#4a90d920', icon: Droplets },
  { key: 'bathing', label: 'Tắm chuyên sâu', color: '#4a7ed9', bgColor: '#4a7ed920', icon: Bath },
  { key: 'grooming', label: 'Cắt tỉa lông', color: '#c75b4c', bgColor: '#c75b4c20', icon: Scissors },
  { key: 'premium-care', label: 'Chăm sóc cao cấp', color: '#a07d56', bgColor: '#a07d5620', icon: Sparkles },
  { key: 'vaccine', label: 'Tiêm phòng', color: '#d4940a', bgColor: '#d4940a20', icon: Shield },
  { key: 'medical', label: 'Điều trị', color: '#4f8f8a', bgColor: '#4f8f8a20', icon: Syringe },
  { key: 'boarding', label: 'Lưu trú', color: '#8b6f47', bgColor: '#8b6f4720', icon: Home },
  { key: 'hotel', label: 'Khách sạn thú cưng', color: '#8d7154', bgColor: '#8d715420', icon: BedDouble },
  { key: 'pickup-dropoff', label: 'Đưa đón', color: '#5d7892', bgColor: '#5d789220', icon: MapPin },
  { key: 'play', label: 'Vui chơi', color: '#4b78a3', bgColor: '#4b78a320', icon: Trophy },
  { key: 'activity-fun', label: 'Hoạt động giải trí', color: '#4f7fa8', bgColor: '#4f7fa820', icon: Gamepad2 },
  { key: 'ball-play', label: 'Chơi vận động', color: '#577fa0', bgColor: '#577fa020', icon: Dribbble },
  { key: 'training', label: 'Huấn luyện', color: '#6f8b4d', bgColor: '#6f8b4d20', icon: Target },
  { key: 'obedience', label: 'Rèn kỷ luật', color: '#607d4d', bgColor: '#607d4d20', icon: Crosshair },
  { key: 'behavior', label: 'Hành vi thú cưng', color: '#6c7f5d', bgColor: '#6c7f5d20', icon: Compass },
  { key: 'wellness', label: 'Chăm sóc sức khỏe', color: '#bf6f7e', bgColor: '#bf6f7e20', icon: HeartPulse },
  { key: 'preventive', label: 'Chăm sóc dự phòng', color: '#8b8d54', bgColor: '#8b8d5420', icon: PawPrint },
  { key: 'drying', label: 'Sấy khô', color: '#5a7ea2', bgColor: '#5a7ea220', icon: Wind },
  { key: 'nutrition', label: 'Dinh dưỡng', color: '#8e6a46', bgColor: '#8e6a4620', icon: Bone },
  { key: 'product', label: 'Sản phẩm', color: '#6f7b8a', bgColor: '#6f7b8a20', icon: Package },
  { key: 'retail', label: 'Bán lẻ', color: '#678074', bgColor: '#67807420', icon: ShoppingBag },
  { key: 'accessory', label: 'Phụ kiện', color: '#758296', bgColor: '#75829620', icon: Tag },
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
