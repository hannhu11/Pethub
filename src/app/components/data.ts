// ============ MOCK DATA FOR PETHUB ============

import luckyImage from '../../assets/images/pets/lucky.jpg';
import mimiImage from '../../assets/images/pets/mimi.jpg';
import bongImage from '../../assets/images/pets/bong.jpg';
import snowballImage from '../../assets/images/pets/snowball.jpg';
import serviceCheckupImage from '../../assets/images/services/checkup.jpg';
import serviceSpaImage from '../../assets/images/services/spa.jpg';
import serviceGroomingImage from '../../assets/images/services/grooming.jpg';
import serviceVaccineImage from '../../assets/images/services/vaccine.jpg';
import serviceSpecialistImage from '../../assets/images/services/specialist.jpg';
import serviceBoardingImage from '../../assets/images/services/boarding.jpg';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'manager';
  avatar?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  dob: string;
  weight: string;
  color: string;
  microchipId: string;
  bloodType: string;
  neutered: boolean;
  vaccinationLevel: string;
  lastCheckup: string;
  specialNotes?: string;
  image: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  hasDigitalCard: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  image: string;
  duration: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
  stock: number;
}

export interface Appointment {
  id: string;
  petId: string;
  petName: string;
  userId: string;
  userName: string;
  userPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  note?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
  notes: string;
  nextVisit?: string;
}

export interface Transaction {
  id: string;
  appointmentId: string;
  services: { name: string; price: number }[];
  products: { name: string; price: number; quantity: number }[];
  total: number;
  date: string;
}

// Mock Users
export const mockUsers: User[] = [
  { id: 'u1', name: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901234567', role: 'customer' },
  { id: 'u2', name: 'Trần Thị Bình', email: 'binh.tran@email.com', phone: '0912345678', role: 'customer' },
  { id: 'u3', name: 'Lê Minh Đức', email: 'duc.le@email.com', phone: '0923456789', role: 'customer' },
  { id: 'u4', name: 'Phạm Hương', email: 'huong.pham@email.com', phone: '0934567890', role: 'manager' },
];

// Mock Pets
export const mockPets: Pet[] = [
  {
    id: 'PH-2026-001', name: 'Lucky', species: 'Chó', breed: 'Golden Retriever',
    gender: 'Đực', dob: '2022-03-15', weight: '28kg', color: 'Vàng kem',
    microchipId: 'MC-GLD-001-8891', bloodType: 'DEA 1.1+', neutered: true,
    vaccinationLevel: 'Đầy đủ (7/7)', lastCheckup: '2026-03-08',
    specialNotes: 'Dị ứng nhẹ với thức ăn nhiều đạm',
    image: luckyImage,
    ownerId: 'u1', ownerName: 'Nguyễn Văn An', ownerPhone: '0901234567', ownerEmail: 'an.nguyen@email.com', hasDigitalCard: true,
  },
  {
    id: 'PH-2026-002', name: 'Mimi', species: 'Mèo', breed: 'Anh Lông Ngắn',
    gender: 'Cái', dob: '2023-07-20', weight: '4.5kg', color: 'Đen tuyền',
    microchipId: 'MC-CAT-002-1134', bloodType: 'B', neutered: true,
    vaccinationLevel: 'Đầy đủ (5/5)', lastCheckup: '2026-03-05',
    specialNotes: 'Nhạy cảm âm thanh lớn',
    image: mimiImage,
    ownerId: 'u1', ownerName: 'Nguyễn Văn An', ownerPhone: '0901234567', ownerEmail: 'an.nguyen@email.com', hasDigitalCard: true,
  },
  {
    id: 'PH-2026-003', name: 'Bông', species: 'Chó', breed: 'Corgi',
    gender: 'Cái', dob: '2024-01-10', weight: '12kg', color: 'Nâu trắng',
    microchipId: 'MC-CRG-003-2209', bloodType: 'DEA 1.1-', neutered: false,
    vaccinationLevel: 'Đầy đủ (6/7)', lastCheckup: '2026-02-28',
    specialNotes: 'Cần kiểm soát cân nặng',
    image: bongImage,
    ownerId: 'u2', ownerName: 'Trần Thị Bình', ownerPhone: '0912345678', ownerEmail: 'binh.tran@email.com', hasDigitalCard: true,
  },
  {
    id: 'PH-2026-004', name: 'Snowball', species: 'Mèo', breed: 'Ba Tư',
    gender: 'Đực', dob: '2023-11-05', weight: '5kg', color: 'Trắng bạc',
    microchipId: 'MC-PRS-004-5550', bloodType: 'AB', neutered: false,
    vaccinationLevel: 'Cơ bản (3/5)', lastCheckup: '2026-02-20',
    specialNotes: 'Cần chải lông hằng ngày',
    image: snowballImage,
    ownerId: 'u3', ownerName: 'Lê Minh Đức', ownerPhone: '0923456789', ownerEmail: 'duc.le@email.com', hasDigitalCard: false,
  },
];

// Mock Services
export const mockServices: Service[] = [
  {
    id: 's1', name: 'Khám tổng quát', price: 200000,
    description: 'Khám sức khỏe tổng quát, kiểm tra toàn diện cho thú cưng của bạn bao gồm đo nhiệt độ, nghe tim phổi, kiểm tra răng miệng.',
    icon: 'stethoscope', image: serviceCheckupImage,
    duration: '30 phút', active: true,
  },
  {
    id: 's2', name: 'Tắm & Spa', price: 150000,
    description: 'Dịch vụ tắm rửa, vệ sinh, spa thư giãn cho thú cưng với sản phẩm chuyên dụng, an toàn.',
    icon: 'droplets', image: serviceSpaImage,
    duration: '60 phút', active: true,
  },
  {
    id: 's3', name: 'Cắt tỉa lông', price: 250000,
    description: 'Cắt tỉa, tạo kiểu lông theo yêu cầu bởi groomer chuyên nghiệp, giúp thú cưng luôn gọn gàng.',
    icon: 'scissors', image: serviceGroomingImage,
    duration: '90 phút', active: true,
  },
  {
    id: 's4', name: 'Tiêm phòng', price: 300000,
    description: 'Tiêm phòng các bệnh truyền nhiễm theo phác đồ chuẩn quốc tế, đảm bảo an toàn cho thú cưng.',
    icon: 'syringe', image: serviceVaccineImage,
    duration: '15 phút', active: true,
  },
  {
    id: 's5', name: 'Khám chuyên khoa', price: 500000,
    description: 'Khám chuyên sâu các bệnh lý phức tạp với thiết bị y tế hiện đại, tư vấn điều trị chi tiết.',
    icon: 'heart-pulse', image: serviceSpecialistImage,
    duration: '45 phút', active: true,
  },
  {
    id: 's6', name: 'Lưu chuồng', price: 180000,
    description: 'Dịch vụ lưu chuồng, chăm sóc thú cưng khi bạn vắng nhà. Phòng sạch sẽ, an toàn.',
    icon: 'home', image: serviceBoardingImage,
    duration: '1 ngày', active: true,
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  { id: 'c1', name: 'Thuốc' },
  { id: 'c2', name: 'Thức ăn' },
  { id: 'c3', name: 'Phụ kiện' },
  { id: 'c4', name: 'Vitamin & Bổ sung' },
];

// Mock Products
export const mockProducts: Product[] = [
  { id: 'p1', name: 'Thuốc tẩy giun Drontal', price: 85000, categoryId: 'c1', categoryName: 'Thuốc', stock: 50 },
  { id: 'p2', name: 'Kháng sinh Amoxicillin', price: 120000, categoryId: 'c1', categoryName: 'Thuốc', stock: 30 },
  { id: 'p3', name: 'Hạt Royal Canin 2kg', price: 350000, categoryId: 'c2', categoryName: 'Thức ăn', stock: 25 },
  { id: 'p4', name: 'Pate Whiskas hộp', price: 35000, categoryId: 'c2', categoryName: 'Thức ăn', stock: 100 },
  { id: 'p5', name: 'Vòng cổ chống ve', price: 180000, categoryId: 'c3', categoryName: 'Phụ kiện', stock: 40 },
  { id: 'p6', name: 'Dầu cá Omega-3', price: 250000, categoryId: 'c4', categoryName: 'Vitamin & Bổ sung', stock: 20 },
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  { id: 'a1', petId: 'PH-2026-001', petName: 'Lucky', userId: 'u1', userName: 'Nguyễn Văn An', userPhone: '0901234567', serviceId: 's1', serviceName: 'Khám tổng quát', servicePrice: 200000, date: '2026-03-10', time: '09:00', status: 'confirmed', note: 'Lucky bỏ ăn 2 ngày' },
  { id: 'a2', petId: 'PH-2026-002', petName: 'Mimi', userId: 'u1', userName: 'Nguyễn Văn An', userPhone: '0901234567', serviceId: 's2', serviceName: 'Tắm & Spa', servicePrice: 150000, date: '2026-03-10', time: '10:00', status: 'pending' },
  { id: 'a3', petId: 'PH-2026-003', petName: 'Bông', userId: 'u2', userName: 'Trần Thị Bình', userPhone: '0912345678', serviceId: 's3', serviceName: 'Cắt tỉa lông', servicePrice: 250000, date: '2026-03-10', time: '14:00', status: 'confirmed' },
  { id: 'a4', petId: 'PH-2026-004', petName: 'Snowball', userId: 'u3', userName: 'Lê Minh Đức', userPhone: '0923456789', serviceId: 's4', serviceName: 'Tiêm phòng', servicePrice: 300000, date: '2026-03-10', time: '15:30', status: 'pending' },
  { id: 'a5', petId: 'PH-2026-001', petName: 'Lucky', userId: 'u1', userName: 'Nguyễn Văn An', userPhone: '0901234567', serviceId: 's4', serviceName: 'Tiêm phòng', servicePrice: 300000, date: '2026-03-08', time: '09:00', status: 'completed' },
  { id: 'a6', petId: 'PH-2026-003', petName: 'Bông', userId: 'u2', userName: 'Trần Thị Bình', userPhone: '0912345678', serviceId: 's2', serviceName: 'Tắm & Spa', servicePrice: 150000, date: '2026-03-07', time: '11:00', status: 'completed' },
  { id: 'a7', petId: 'PH-2026-002', petName: 'Mimi', userId: 'u1', userName: 'Nguyễn Văn An', userPhone: '0901234567', serviceId: 's1', serviceName: 'Khám tổng quát', servicePrice: 200000, date: '2026-03-05', time: '16:00', status: 'completed' },
  { id: 'a8', petId: 'PH-2026-001', petName: 'Lucky', userId: 'u1', userName: 'Nguyễn Văn An', userPhone: '0901234567', serviceId: 's3', serviceName: 'Cắt tỉa lông', servicePrice: 250000, date: '2026-03-03', time: '10:00', status: 'completed' },
];

// Mock Medical Records
export const mockMedicalRecords: MedicalRecord[] = [
  { id: 'mr1', petId: 'PH-2026-001', date: '2026-03-08', diagnosis: 'Sức khỏe tốt, tiêm phòng dại', treatment: 'Tiêm vaccine dại Nobivac Rabies', doctor: 'BS. Phạm Hương', notes: 'Thú cưng khỏe mạnh, phản ứng tốt với vaccine', nextVisit: '2027-03-08' },
  { id: 'mr2', petId: 'PH-2026-001', date: '2026-02-15', diagnosis: 'Viêm da nhẹ vùng bụng', treatment: 'Bôi thuốc Dermacool, uống kháng sinh 5 ngày', doctor: 'BS. Phạm Hương', notes: 'Kiêng tắm 3 ngày, tái khám sau 1 tuần', nextVisit: '2026-02-22' },
  { id: 'mr3', petId: 'PH-2026-002', date: '2026-03-05', diagnosis: 'Khám tổng quát định kỳ', treatment: 'Không cần điều trị, bổ sung vitamin', doctor: 'BS. Phạm Hương', notes: 'Mèo khỏe mạnh, cân nặng ổn định' },
  { id: 'mr4', petId: 'PH-2026-003', date: '2026-02-28', diagnosis: 'Rối loạn tiêu hóa', treatment: 'Thuốc tiêu hóa Bio-MOS, đổi thức ăn', doctor: 'BS. Phạm Hương', notes: 'Theo dõi phân trong 3 ngày', nextVisit: '2026-03-07' },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  { id: 't1', appointmentId: 'a5', services: [{ name: 'Tiêm phòng', price: 300000 }], products: [{ name: 'Thuốc tẩy giun Drontal', price: 85000, quantity: 1 }], total: 385000, date: '2026-03-08' },
  { id: 't2', appointmentId: 'a6', services: [{ name: 'Tắm & Spa', price: 150000 }], products: [{ name: 'Dầu cá Omega-3', price: 250000, quantity: 1 }], total: 400000, date: '2026-03-07' },
  { id: 't3', appointmentId: 'a7', services: [{ name: 'Khám tổng quát', price: 200000 }], products: [{ name: 'Pate Whiskas hộp', price: 35000, quantity: 3 }], total: 305000, date: '2026-03-05' },
  { id: 't4', appointmentId: 'a8', services: [{ name: 'Cắt tỉa lông', price: 250000 }], products: [], total: 250000, date: '2026-03-03' },
];

// Revenue data for charts
export const revenueByMonth = [
  { month: 'Th10', revenue: 12500000 },
  { month: 'Th11', revenue: 15800000 },
  { month: 'Th12', revenue: 18200000 },
  { month: 'Th01', revenue: 14600000 },
  { month: 'Th02', revenue: 19500000 },
  { month: 'Th03', revenue: 16800000 },
];

export const revenueByWeek = [
  { week: 'T2', revenue: 2800000 },
  { week: 'T3', revenue: 3200000 },
  { week: 'T4', revenue: 4100000 },
  { week: 'T5', revenue: 3800000 },
  { week: 'T6', revenue: 5200000 },
  { week: 'T7', revenue: 6100000 },
  { week: 'CN', revenue: 4500000 },
];

// Time slots
export const timeSlots = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00','20:30',
];

// Helper
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-300';
    case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-300';
    default: return 'bg-gray-50 text-gray-700 border-gray-300';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'completed': return 'Hoàn thành';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
};
