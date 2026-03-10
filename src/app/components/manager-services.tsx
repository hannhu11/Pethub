import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, Search, X, Save, PawPrint,
  Stethoscope, Download, Share2, Sparkles, Shield, Phone, Mail,
  CalendarDays, DollarSign, Clock, ChevronRight, Eye, CreditCard,
  UserPlus, FileText, Tag
} from 'lucide-react';
import { mockServices, mockCategories, mockProducts, mockPets, mockUsers, mockAppointments, mockMedicalRecords, formatCurrency, type Service, type Product, type Category } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { QRCodeSVG } from 'qrcode.react';

// ============ COMBINED CATALOG PAGE (Services + Products + Categories) ============
type CatalogTab = 'services' | 'products' | 'categories';

export function ManagerCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('services');

  const tabs: { id: CatalogTab; label: string; icon: typeof Stethoscope }[] = [
    { id: 'services', label: 'Dịch vụ', icon: Stethoscope },
    { id: 'products', label: 'Sản phẩm', icon: Tag },
    { id: 'categories', label: 'Danh mục', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Sản phẩm & Dịch vụ
          </h1>
          <p className="text-sm text-[#7a756e] mt-1">Quản lý toàn bộ catalog phòng khám</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#f0ede8] p-1 rounded-xl w-fit border border-[#2d2a26]/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#2d2a26] border border-[#2d2a26]/20'
                : 'text-[#7a756e] hover:text-[#2d2a26]'
            }`}
            style={activeTab === tab.id ? { fontWeight: 600 } : {}}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
    </div>
  );
}

// --- Services Tab ---
function ServicesTab() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', duration: '' });

  const handleDelete = (id: string) => setServices(prev => prev.filter(s => s.id !== id));
  const openAdd = () => { setEditingId(null); setFormData({ name: '', price: '', description: '', duration: '' }); setShowForm(true); };
  const openEdit = (s: Service) => { setEditingId(s.id); setFormData({ name: s.name, price: s.price.toString(), description: s.description, duration: s.duration }); setShowForm(true); };

  const handleSave = () => {
    if (editingId) {
      setServices(prev => prev.map(s => s.id === editingId ? {
        ...s, name: formData.name, price: parseInt(formData.price) || 0,
        description: formData.description, duration: formData.duration,
      } : s));
    } else {
      const newService: Service = {
        id: `s${Date.now()}`, name: formData.name, price: parseInt(formData.price) || 0,
        description: formData.description, icon: 'stethoscope', image: '', duration: formData.duration, active: true,
      };
      setServices(prev => [...prev, newService]);
    }
    setShowForm(false); setEditingId(null); setFormData({ name: '', price: '', description: '', duration: '' });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7a756e]">{services.length} dịch vụ</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] text-sm">
          <Plus className="w-4 h-4" /> Thêm dịch vụ
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#2d2a26]/20">
              <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                {editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[#f0ede8] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Tên dịch vụ</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên dịch vụ" className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Giá (VND)</label>
                  <input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="200000" type="number" className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Thời lượng</label>
                  <input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="30 phút" className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả dịch vụ..." rows={3} className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e] resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                  <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" />{editingId ? 'Cập nhật' : 'Lưu'}</span>
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-[#2d2a26]/30 text-sm hover:-translate-y-0.5 transition-all">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-[#2d2a26] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6b8f5e]/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-[#6b8f5e]" />
                </div>
                <div>
                  <h3 className="text-sm" style={{ fontWeight: 600 }}>{s.name}</h3>
                  <p className="text-xs text-[#7a756e]">{s.duration}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-[#f0ede8] transition-colors" title="Sửa"><Edit3 className="w-4 h-4 text-[#7a756e]" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
            <p className="text-xs text-[#7a756e] mb-3 line-clamp-2">{s.description}</p>
            <p className="text-lg text-[#6b8f5e]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {formatCurrency(s.price)}
            </p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// --- Products Tab (with inline category filter) ---
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', categoryId: '', stock: '' });
  const [filterCat, setFilterCat] = useState('all');

  const handleDelete = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const openAdd = () => { setEditingId(null); setFormData({ name: '', price: '', categoryId: '', stock: '' }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditingId(p.id); setFormData({ name: p.name, price: p.price.toString(), categoryId: p.categoryId, stock: p.stock.toString() }); setShowForm(true); };

  const handleSave = () => {
    const cat = mockCategories.find(c => c.id === formData.categoryId);
    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? {
        ...p, name: formData.name, price: parseInt(formData.price) || 0,
        categoryId: formData.categoryId, categoryName: cat?.name || p.categoryName,
        stock: parseInt(formData.stock) || 0,
      } : p));
    } else {
      const newProd: Product = {
        id: `p${Date.now()}`, name: formData.name, price: parseInt(formData.price) || 0,
        categoryId: formData.categoryId, categoryName: cat?.name || '', stock: parseInt(formData.stock) || 0,
      };
      setProducts(prev => [...prev, newProd]);
    }
    setShowForm(false); setEditingId(null); setFormData({ name: '', price: '', categoryId: '', stock: '' });
  };

  const filteredProducts = filterCat === 'all' ? products : products.filter(p => p.categoryId === filterCat);

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-[#7a756e]">{filteredProducts.length} sản phẩm</p>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="text-xs px-3 py-1.5 border border-[#2d2a26]/20 rounded-lg bg-white"
          >
            <option value="all">Tất cả danh mục</option>
            {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] text-sm">
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#faf9f6] border border-[#2d2a26] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#2d2a26]/20">
              <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                {editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[#f0ede8] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Tên sản phẩm</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên" className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Giá (VND)</label>
                  <input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="85000" type="number" className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
                </div>
                <div>
                  <label className="text-xs text-[#7a756e] mb-1 block">Tồn kho</label>
                  <input value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="50" type="number" className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7a756e] mb-1 block">Danh mục</label>
                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]">
                  <option value="">Chọn danh mục</option>
                  {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26]">
                  <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" />{editingId ? 'Cập nhật' : 'Lưu'}</span>
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-[#2d2a26]/30 text-sm hover:-translate-y-0.5 transition-all">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2d2a26]">
              <th className="text-left py-3 px-4 text-xs text-[#7a756e]">Tên sản phẩm</th>
              <th className="text-left py-3 px-4 text-xs text-[#7a756e]">Danh mục</th>
              <th className="text-left py-3 px-4 text-xs text-[#7a756e]">Giá</th>
              <th className="text-left py-3 px-4 text-xs text-[#7a756e]">Tồn kho</th>
              <th className="text-left py-3 px-4 text-xs text-[#7a756e]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} className="border-b border-[#2d2a26]/10 hover:bg-[#faf9f6]">
                <td className="py-3 px-4" style={{ fontWeight: 500 }}>{p.name}</td>
                <td className="py-3 px-4"><span className="text-xs px-2 py-1 rounded-full bg-[#f0ede8]">{p.categoryName}</span></td>
                <td className="py-3 px-4 text-[#6b8f5e]" style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                <td className="py-3 px-4">{p.stock}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[#f0ede8] transition-colors"><Edit3 className="w-4 h-4 text-[#7a756e]" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Categories Tab ---
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newCat.trim()) return;
    setCategories(prev => [...prev, { id: `c${Date.now()}`, name: newCat }]);
    setNewCat('');
  };

  const startEdit = (c: Category) => { setEditingId(c.id); setEditName(c.name); };
  const saveEdit = () => {
    if (!editName.trim() || !editingId) return;
    setCategories(prev => prev.map(c => c.id === editingId ? { ...c, name: editName } : c));
    setEditingId(null); setEditName('');
  };
  const cancelEdit = () => { setEditingId(null); setEditName(''); };

  return (
    <>
      <div className="flex gap-3">
        <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Tên danh mục mới"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
        <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 transition-all border border-[#2d2a26] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-[#2d2a26] rounded-2xl p-4">
            {editingId === c.id ? (
              <div className="space-y-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                  className="w-full p-2 border border-[#6b8f5e] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]" />
                <div className="flex gap-1">
                  <button onClick={saveEdit} className="flex-1 py-1.5 text-xs rounded-lg bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all">Lưu</button>
                  <button onClick={cancelEdit} className="flex-1 py-1.5 text-xs rounded-lg border border-[#2d2a26]/30 hover:-translate-y-0.5 transition-all">Hủy</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ fontWeight: 500 }}>{c.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(c)} className="p-1 rounded-lg hover:bg-[#f0ede8] transition-colors"><Edit3 className="w-3.5 h-3.5 text-[#7a756e]" /></button>
                  <button onClick={() => setCategories(prev => prev.filter(cat => cat.id !== c.id))} className="p-1 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}


// ============ PET MANAGEMENT (with Digital Card + Quick Add) ============
export function ManagerPetsPage() {
  const [search, setSearch] = useState('');
  const [pets, setPets] = useState(mockPets.map(p => ({ ...p })));
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'medical' | 'card'>('info');
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Quick Add form
  const [addForm, setAddForm] = useState({
    ownerName: '', ownerPhone: '', ownerEmail: '',
    petName: '', petSpecies: 'Chó', petBreed: '', petGender: 'Đực', petDob: '', petWeight: '',
    existingOwner: '',
  });
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new');

  const filtered = pets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(search.toLowerCase())
  );
  const selectedPet = pets.find(p => p.id === selectedPetId);

  const handleCreateCard = (petId: string) => {
    setPets(prev => prev.map(p => p.id === petId ? { ...p, hasDigitalCard: true } : p));
  };

  const handleShare = (petId: string) => {
    setShareNotice(petId);
    setTimeout(() => setShareNotice(null), 2000);
  };

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date('2026-03-10');
    const years = now.getFullYear() - birth.getFullYear();
    if (years > 0) return `${years} tuổi`;
    return 'Dưới 1 tuổi';
  };

  const petMedicalRecords = selectedPetId ? mockMedicalRecords.filter(r => r.petId === selectedPetId) : [];
  const customers = mockUsers.filter(u => u.role === 'customer');

  const handleAddPet = () => {
    let ownerId = '', ownerName = '', ownerPhone = '';
    if (addMode === 'existing' && addForm.existingOwner) {
      const customer = customers.find(c => c.id === addForm.existingOwner);
      if (customer) { ownerId = customer.id; ownerName = customer.name; ownerPhone = customer.phone; }
    } else {
      ownerId = `u${Date.now()}`;
      ownerName = addForm.ownerName;
      ownerPhone = addForm.ownerPhone;
    }

    if (!addForm.petName.trim() || !ownerName) return;

    const newPet = {
      id: `PH-2026-${String(pets.length + 1).padStart(3, '0')}`,
      name: addForm.petName,
      species: addForm.petSpecies,
      breed: addForm.petBreed || 'Chưa xác định',
      gender: addForm.petGender,
      dob: addForm.petDob || '2025-01-01',
      weight: addForm.petWeight || 'Chưa cân',
      image: addForm.petSpecies === 'Chó'
        ? 'https://images.unsplash.com/photo-1609348490161-a879e4327ae9?w=400'
        : 'https://images.unsplash.com/photo-1707065359514-5aa48a8eebee?w=400',
      ownerId,
      ownerName,
      ownerPhone,
      hasDigitalCard: false,
    };

    setPets(prev => [...prev, newPet]);
    setShowAddDrawer(false);
    setAddForm({ ownerName: '', ownerPhone: '', ownerEmail: '', petName: '', petSpecies: 'Chó', petBreed: '', petGender: 'Đực', petDob: '', petWeight: '', existingOwner: '' });
    setAddMode('new');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Quản lý thú cưng
          </h1>
          <p className="text-sm text-[#7a756e] mt-1">{pets.length} thú cưng • {pets.filter(p => p.hasDigitalCard).length} Digital Card</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, ID, chủ..."
              className="pl-9 pr-4 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm w-56 focus:outline-none focus:bg-[#faf9f6]" />
          </div>
          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6b8f5e] text-white hover:-translate-y-0.5 transition-all border border-[#2d2a26] text-sm whitespace-nowrap"
            style={{ fontWeight: 600 }}
          >
            <UserPlus className="w-4 h-4" /> Thêm nhanh
          </button>
        </div>
      </div>

      {/* Pet Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white border border-[#2d2a26] rounded-2xl p-4 hover:-translate-y-0.5 transition-all cursor-pointer"
            onClick={() => { setSelectedPetId(p.id); setDetailTab('info'); }}
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#2d2a26] flex-shrink-0">
                <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm truncate" style={{ fontWeight: 600 }}>{p.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.species === 'Chó' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.species}
                  </span>
                  {p.hasDigitalCard && <CreditCard className="w-3.5 h-3.5 text-[#6b8f5e]" />}
                </div>
                <div className="text-xs text-[#7a756e] space-y-0.5">
                  <p>{p.breed} • {p.gender}</p>
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.ownerName}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pet Detail Slide-over */}
      <AnimatePresence>
        {selectedPetId && selectedPet && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedPetId(null)}>
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#faf9f6] border-l border-[#2d2a26] h-full overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#faf9f6] border-b border-[#2d2a26]/15 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#2d2a26]">
                    <ImageWithFallback src={selectedPet.image} alt={selectedPet.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      {selectedPet.name}
                    </h2>
                    <p className="text-xs text-[#7a756e]">{selectedPet.breed} • {selectedPet.species}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPetId(null)} className="p-1.5 hover:bg-[#f0ede8] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-5 pt-4 pb-2">
                {[
                  { id: 'info' as const, label: 'Hồ sơ' },
                  { id: 'medical' as const, label: 'Bệnh án' },
                  { id: 'card' as const, label: 'Digital Card' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs transition-all ${
                      detailTab === tab.id
                        ? 'bg-[#2d2a26] text-white'
                        : 'text-[#7a756e] hover:bg-[#f0ede8]'
                    }`}
                    style={detailTab === tab.id ? { fontWeight: 600 } : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                {/* Info Tab */}
                {detailTab === 'info' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Loài', value: selectedPet.species },
                        { label: 'Giống', value: selectedPet.breed },
                        { label: 'Giới tính', value: selectedPet.gender },
                        { label: 'Ngày sinh', value: selectedPet.dob },
                        { label: 'Cân nặng', value: selectedPet.weight },
                        { label: 'Tuổi', value: getAge(selectedPet.dob) },
                      ].map(item => (
                        <div key={item.label} className="p-3 bg-white rounded-xl border border-[#2d2a26]/10">
                          <p className="text-[10px] text-[#7a756e] mb-1 uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm" style={{ fontWeight: 500 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-[#2d2a26]/10 p-4">
                      <p className="text-[10px] text-[#7a756e] mb-2 uppercase tracking-wider">Chủ sở hữu</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#c67d5b] flex items-center justify-center">
                          <span className="text-white text-xs" style={{ fontWeight: 600 }}>{selectedPet.ownerName.split(' ').pop()?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm" style={{ fontWeight: 500 }}>{selectedPet.ownerName}</p>
                          <p className="text-xs text-[#7a756e]">{selectedPet.ownerPhone}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#7a756e] font-mono">ID: {selectedPet.id}</p>
                  </>
                )}

                {/* Medical Records Tab */}
                {detailTab === 'medical' && (
                  <>
                    {petMedicalRecords.length === 0 ? (
                      <div className="text-center py-8 text-[#7a756e]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Chưa có bệnh án nào</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {petMedicalRecords.map(r => (
                          <div key={r.id} className="bg-white rounded-xl border border-[#2d2a26]/15 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarDays className="w-4 h-4 text-[#6b8f5e]" />
                              <span className="text-sm" style={{ fontWeight: 600 }}>{r.date}</span>
                              <span className="text-xs text-[#7a756e]">— {r.doctor}</span>
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <p><span className="text-[#7a756e]">Chẩn đoán:</span> <span style={{ fontWeight: 500 }}>{r.diagnosis}</span></p>
                              <p><span className="text-[#7a756e]">Điều trị:</span> {r.treatment}</p>
                              <p><span className="text-[#7a756e]">Ghi chú:</span> {r.notes}</p>
                            </div>
                            {r.nextVisit && (
                              <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                                <span className="text-xs text-amber-700" style={{ fontWeight: 500 }}>Tái khám: {r.nextVisit}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Digital Card Tab */}
                {detailTab === 'card' && (
                  <>
                    {!selectedPet.hasDigitalCard ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#c67d5b]/10 flex items-center justify-center mx-auto">
                          <Sparkles className="w-8 h-8 text-[#c67d5b]" />
                        </div>
                        <div>
                          <p className="text-sm" style={{ fontWeight: 500 }}>Chưa có Digital Card</p>
                          <p className="text-xs text-[#7a756e] mt-1">Tạo thẻ định danh điện tử cho {selectedPet.name}</p>
                        </div>
                        <button
                          onClick={() => handleCreateCard(selectedPet.id)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6b8f5e] text-white text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all border border-[#2d2a26]"
                          style={{ fontWeight: 700 }}
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Digital Smart Card
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Premium Card */}
                        <div
                          className="relative rounded-2xl overflow-hidden border-2 border-[#2d2a26]"
                          style={{ aspectRatio: '1.586/1' }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              background: selectedPet.species === 'Chó'
                                ? 'linear-gradient(160deg, #f7f0e4 0%, #efe3d0 40%, #e8dbc5 100%)'
                                : 'linear-gradient(160deg, #eef3fb 0%, #dde8f6 40%, #cdddf0 100%)',
                            }}
                          />
                          <div className="absolute inset-0 opacity-[0.04]">
                            {Array.from({ length: 8 }).map((_, j) => (
                              <div key={j} className="absolute border border-[#2d2a26]" style={{
                                width: `${60 + j * 25}px`, height: `${60 + j * 25}px`, borderRadius: '50%',
                                right: `${-20 + j * 5}px`, bottom: `${-30 + j * 5}px`,
                              }} />
                            ))}
                          </div>
                          <div className="relative h-8 bg-[#2d2a26] flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                              <PawPrint className="w-3.5 h-3.5 text-[#6b8f5e]" />
                              <span className="text-[9px] text-white tracking-[0.2em] uppercase" style={{ fontWeight: 600 }}>
                                PetHub Digital Pet Card
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-[#6b8f5e]" />
                              <span className="text-[8px] text-[#6b8f5e]" style={{ fontWeight: 600 }}>VERIFIED</span>
                            </div>
                          </div>
                          <div className="relative flex h-[calc(100%-32px)]">
                            <div className="flex-[65] p-4 flex flex-col justify-between">
                              <div className="flex items-start gap-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#2d2a26] flex-shrink-0 bg-white">
                                  <ImageWithFallback src={selectedPet.image} alt={selectedPet.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="pt-0.5">
                                  <h3 className="text-xl text-[#2d2a26] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                                    {selectedPet.name}
                                  </h3>
                                  <p className="text-[11px] text-[#2d2a26]/60 mt-0.5">{selectedPet.breed}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                                      selectedPet.species === 'Chó' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`} style={{ fontWeight: 600 }}>{selectedPet.species}</span>
                                    <span className="text-[9px] text-[#2d2a26]/50">{selectedPet.gender} • {getAge(selectedPet.dob)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="border-t border-[#2d2a26]/10 pt-2">
                                  <p className="text-[8px] text-[#2d2a26]/40 uppercase tracking-[0.15em]" style={{ fontWeight: 600 }}>Chủ sở hữu</p>
                                  <p className="text-[11px] text-[#2d2a26]" style={{ fontWeight: 500 }}>{selectedPet.ownerName}</p>
                                  <p className="text-[10px] text-[#2d2a26]/60">{selectedPet.ownerPhone}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] text-[#2d2a26]/30 uppercase tracking-[0.1em]">ID</span>
                                  <span className="text-[10px] text-[#2d2a26]/60 font-mono">{selectedPet.id}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-[35] flex flex-col items-center justify-center pr-4">
                              <div className="bg-white p-2.5 rounded-xl border border-[#2d2a26]">
                                <QRCodeSVG value={`https://pethub.vn/pet/${selectedPet.id}`} size={72} bgColor="transparent" fgColor="#2d2a26" level="H" />
                              </div>
                              <p className="text-[7px] text-[#2d2a26]/30 mt-2 text-center tracking-wider uppercase">Quét để xem hồ sơ</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#2d2a26] bg-white text-xs hover:-translate-y-0.5 transition-all" style={{ fontWeight: 500 }}>
                            <Download className="w-3.5 h-3.5 text-[#6b8f5e]" /> Tải PDF
                          </button>
                          <button
                            onClick={() => handleShare(selectedPet.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#2d2a26] bg-white text-xs hover:-translate-y-0.5 transition-all"
                            style={{ fontWeight: 500 }}
                          >
                            {shareNotice === selectedPet.id ? (
                              <span className="text-[#6b8f5e]">Link đã sao chép!</span>
                            ) : (
                              <><Share2 className="w-3.5 h-3.5 text-[#c67d5b]" />Chia sẻ link</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Pet & Owner Slide-over Drawer */}
      <AnimatePresence>
        {showAddDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowAddDrawer(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#faf9f6] border-l border-[#2d2a26] h-full overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#faf9f6] border-b border-[#2d2a26]/15 p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                    Thêm nhanh — Walk-in
                  </h2>
                  <p className="text-xs text-[#7a756e] mt-0.5">Đăng ký thú cưng & chủ cho khách vãng lai</p>
                </div>
                <button onClick={() => setShowAddDrawer(false)} className="p-1.5 hover:bg-[#f0ede8] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Owner Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#c67d5b]/10 flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>Thông tin chủ sở hữu</h3>
                  </div>

                  {/* Toggle mode */}
                  <div className="flex gap-1 mb-3 bg-[#f0ede8] p-0.5 rounded-lg">
                    <button
                      onClick={() => setAddMode('new')}
                      className={`flex-1 py-1.5 text-xs rounded-md transition-all ${addMode === 'new' ? 'bg-white text-[#2d2a26] border border-[#2d2a26]/15' : 'text-[#7a756e]'}`}
                      style={addMode === 'new' ? { fontWeight: 600 } : {}}
                    >
                      Khách mới
                    </button>
                    <button
                      onClick={() => setAddMode('existing')}
                      className={`flex-1 py-1.5 text-xs rounded-md transition-all ${addMode === 'existing' ? 'bg-white text-[#2d2a26] border border-[#2d2a26]/15' : 'text-[#7a756e]'}`}
                      style={addMode === 'existing' ? { fontWeight: 600 } : {}}
                    >
                      Khách cũ
                    </button>
                  </div>

                  {addMode === 'existing' ? (
                    <select
                      value={addForm.existingOwner}
                      onChange={e => setAddForm({ ...addForm, existingOwner: e.target.value })}
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none"
                    >
                      <option value="">Chọn khách hàng...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                    </select>
                  ) : (
                    <div className="space-y-2.5">
                      <input
                        value={addForm.ownerName}
                        onChange={e => setAddForm({ ...addForm, ownerName: e.target.value })}
                        placeholder="Họ và tên *"
                        className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]"
                      />
                      <input
                        value={addForm.ownerPhone}
                        onChange={e => setAddForm({ ...addForm, ownerPhone: e.target.value })}
                        placeholder="Số điện thoại *"
                        className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]"
                      />
                      <input
                        value={addForm.ownerEmail}
                        onChange={e => setAddForm({ ...addForm, ownerEmail: e.target.value })}
                        placeholder="Email (tùy chọn)"
                        className="w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Pet Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#6b8f5e]/10 flex items-center justify-center">
                      <span className="text-sm">🐾</span>
                    </div>
                    <h3 className="text-sm" style={{ fontWeight: 600 }}>Thông tin thú cưng</h3>
                  </div>
                  <div className="space-y-2.5">
                    <input
                      value={addForm.petName}
                      onChange={e => setAddForm({ ...addForm, petName: e.target.value })}
                      placeholder="Tên thú cưng *"
                      className="w-full p-3 border border-[#2d2a26] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6b8f5e]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={addForm.petSpecies}
                        onChange={e => setAddForm({ ...addForm, petSpecies: e.target.value })}
                        className="p-3 border border-[#2d2a26] rounded-xl text-sm bg-white"
                      >
                        <option value="Chó">Chó</option>
                        <option value="Mèo">Mèo</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <select
                        value={addForm.petGender}
                        onChange={e => setAddForm({ ...addForm, petGender: e.target.value })}
                        className="p-3 border border-[#2d2a26] rounded-xl text-sm bg-white"
                      >
                        <option value="Đực">Đực</option>
                        <option value="Cái">Cái</option>
                      </select>
                    </div>
                    <input
                      value={addForm.petBreed}
                      onChange={e => setAddForm({ ...addForm, petBreed: e.target.value })}
                      placeholder="Giống (VD: Golden Retriever)"
                      className="w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#7a756e] mb-1 block">Ngày sinh</label>
                        <input
                          type="date"
                          value={addForm.petDob}
                          onChange={e => setAddForm({ ...addForm, petDob: e.target.value })}
                          className="w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#7a756e] mb-1 block">Cân nặng</label>
                        <input
                          value={addForm.petWeight}
                          onChange={e => setAddForm({ ...addForm, petWeight: e.target.value })}
                          placeholder="VD: 8kg"
                          className="w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleAddPet}
                  className="w-full py-3.5 rounded-xl bg-[#6b8f5e] text-white text-sm border border-[#2d2a26] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  style={{ fontWeight: 700 }}
                >
                  <Plus className="w-4 h-4" />
                  Đăng ký & Lưu hồ sơ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ============ CUSTOMER MANAGEMENT ============
export function ManagerCustomersPage() {
  const customers = mockUsers.filter(u => u.role === 'customer');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedId);
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const getCustomerPets = (userId: string) => mockPets.filter(p => p.ownerId === userId);
  const getCustomerAppointments = (userId: string) => mockAppointments.filter(a => a.userId === userId);
  const getCustomerLTV = (userId: string) => {
    return getCustomerAppointments(userId)
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.servicePrice, 0);
  };
  const getCustomerTier = (userId: string) => {
    const ltv = getCustomerLTV(userId);
    if (ltv >= 500000) return { label: 'VIP', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (ltv >= 200000) return { label: 'Thân thiết', color: 'bg-[#6b8f5e]/10 text-[#6b8f5e] border-[#6b8f5e]/30' };
    return { label: 'Tiêu chuẩn', color: 'bg-[#f0ede8] text-[#7a756e] border-[#2d2a26]/10' };
  };

  const getTimeline = (userId: string) => {
    const appts = getCustomerAppointments(userId).sort((a, b) => b.date.localeCompare(a.date));
    return appts.map(a => ({
      id: a.id,
      date: a.date,
      time: a.time,
      title: a.serviceName,
      pet: a.petName,
      amount: a.servicePrice,
      status: a.status,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Quản lý khách hàng
          </h1>
          <p className="text-sm text-[#7a756e] mt-1">CRM 360° — {customers.length} khách hàng</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, SĐT..."
            className="pl-9 pr-4 py-2.5 border border-[#2d2a26] rounded-xl bg-white text-sm w-64 focus:outline-none focus:bg-[#faf9f6]"
          />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng khách hàng', value: customers.length.toString(), icon: '👥' },
          { label: 'Khách VIP', value: customers.filter(c => getCustomerLTV(c.id) >= 500000).length.toString(), icon: '⭐' },
          { label: 'Tổng LTV', value: formatCurrency(customers.reduce((s, c) => s + getCustomerLTV(c.id), 0)), icon: '💰' },
          { label: 'Thú cưng đăng ký', value: mockPets.length.toString(), icon: '🐾' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#2d2a26] rounded-2xl p-4">
            <div className="text-xl mb-2">{kpi.icon}</div>
            <p className="text-xs text-[#7a756e]">{kpi.label}</p>
            <p className="text-lg text-[#2d2a26] mt-0.5" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Customer List + Detail Split */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className={`${selectedId ? 'lg:w-[45%]' : 'w-full'} transition-all`}>
          <div className="bg-white border border-[#2d2a26] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#2d2a26]/10">
              {filteredCustomers.map((u, i) => {
                const tier = getCustomerTier(u.id);
                const pets = getCustomerPets(u.id);
                const ltv = getCustomerLTV(u.id);
                const isSelected = selectedId === u.id;

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedId(isSelected ? null : u.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-[#faf9f6] ${
                      isSelected ? 'bg-[#6b8f5e]/5 border-l-3 border-l-[#6b8f5e]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#c67d5b] flex items-center justify-center flex-shrink-0 border border-[#2d2a26]/20">
                        <span className="text-white text-xs" style={{ fontWeight: 600 }}>{u.name.split(' ').pop()?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm truncate" style={{ fontWeight: 600 }}>{u.name}</h3>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${tier.color}`} style={{ fontWeight: 600 }}>{tier.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#7a756e] mt-0.5">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</span>
                          <span>{pets.length} thú cưng</span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-[#7a756e]">LTV</p>
                        <p className="text-sm text-[#6b8f5e]" style={{ fontWeight: 600 }}>{formatCurrency(ltv)}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-[#7a756e] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedId && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:w-[55%] space-y-4"
            >
              <div className="bg-white border border-[#2d2a26] rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#c67d5b] flex items-center justify-center border-2 border-[#2d2a26]">
                      <span className="text-white text-lg" style={{ fontWeight: 700 }}>{selectedCustomer.name.split(' ').pop()?.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{selectedCustomer.name}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCustomerTier(selectedCustomer.id).color}`} style={{ fontWeight: 600 }}>
                          {getCustomerTier(selectedCustomer.id).label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#7a756e] mt-1">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedCustomer.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-[#f0ede8] rounded-lg">
                    <X className="w-5 h-5 text-[#7a756e]" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#2d2a26] rounded-2xl p-4 text-center">
                  <DollarSign className="w-5 h-5 text-[#6b8f5e] mx-auto mb-1" />
                  <p className="text-[10px] text-[#7a756e] uppercase tracking-wider">Lifetime Value</p>
                  <p className="text-xl text-[#2d2a26] mt-1" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{formatCurrency(getCustomerLTV(selectedCustomer.id))}</p>
                </div>
                <div className="bg-white border border-[#2d2a26] rounded-2xl p-4 text-center">
                  <CalendarDays className="w-5 h-5 text-[#c67d5b] mx-auto mb-1" />
                  <p className="text-[10px] text-[#7a756e] uppercase tracking-wider">Lượt ghé thăm</p>
                  <p className="text-xl text-[#2d2a26] mt-1" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{getCustomerAppointments(selectedCustomer.id).length}</p>
                </div>
                <div className="bg-white border border-[#2d2a26] rounded-2xl p-4 text-center">
                  <Clock className="w-5 h-5 text-[#4a90d9] mx-auto mb-1" />
                  <p className="text-[10px] text-[#7a756e] uppercase tracking-wider">Lần cuối</p>
                  <p className="text-sm text-[#2d2a26] mt-1" style={{ fontWeight: 600 }}>{getCustomerAppointments(selectedCustomer.id).sort((a, b) => b.date.localeCompare(a.date))[0]?.date || '—'}</p>
                </div>
              </div>

              <div className="bg-white border border-[#2d2a26] rounded-2xl p-5">
                <h3 className="text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  <PawPrint className="w-4 h-4 text-[#6b8f5e]" /> Thú cưng ({getCustomerPets(selectedCustomer.id).length})
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {getCustomerPets(selectedCustomer.id).map(pet => (
                    <div key={pet.id} className="flex-shrink-0 w-36 border border-[#2d2a26]/20 rounded-xl p-3 bg-[#faf9f6]">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-[#2d2a26]/20 mx-auto mb-2">
                        <ImageWithFallback src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-center" style={{ fontWeight: 600 }}>{pet.name}</p>
                      <p className="text-[10px] text-[#7a756e] text-center">{pet.species} • {pet.breed}</p>
                      {pet.hasDigitalCard && (
                        <div className="flex items-center justify-center gap-1 mt-1.5">
                          <CreditCard className="w-3 h-3 text-[#6b8f5e]" />
                          <span className="text-[9px] text-[#6b8f5e]" style={{ fontWeight: 500 }}>Digital Card</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {getCustomerPets(selectedCustomer.id).length === 0 && (
                    <p className="text-xs text-[#7a756e] py-4 w-full text-center">Chưa có thú cưng nào</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#2d2a26] rounded-2xl p-5">
                <h3 className="text-sm mb-4 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                  <Clock className="w-4 h-4 text-[#c67d5b]" /> Lịch sử hoạt động
                </h3>
                <div className="space-y-0">
                  {getTimeline(selectedCustomer.id).map((item, idx) => {
                    const statusColors: Record<string, string> = { completed: 'bg-emerald-500', confirmed: 'bg-blue-500', pending: 'bg-amber-500', cancelled: 'bg-red-400' };
                    const statusLabels: Record<string, string> = { completed: 'Hoàn thành', confirmed: 'Đã xác nhận', pending: 'Chờ duyệt', cancelled: 'Đã hủy' };
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[item.status] || 'bg-gray-300'} flex-shrink-0 mt-1.5`} />
                          {idx < getTimeline(selectedCustomer.id).length - 1 && <div className="w-px flex-1 bg-[#2d2a26]/10 my-1" />}
                        </div>
                        <div className="pb-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs" style={{ fontWeight: 500 }}>{item.title}</p>
                            <span className="text-xs text-[#6b8f5e]" style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#7a756e] mt-0.5 flex-wrap">
                            <span>{item.date} • {item.time}</span>
                            <span>•</span>
                            <span>{item.pet}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-white ${statusColors[item.status]}`}>{statusLabels[item.status]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {getTimeline(selectedCustomer.id).length === 0 && (
                    <p className="text-xs text-[#7a756e] text-center py-4">Chưa có hoạt động nào</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
