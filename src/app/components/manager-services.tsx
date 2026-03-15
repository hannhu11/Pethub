import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Package, Plus, ShoppingBag, Stethoscope, X } from 'lucide-react';
import { extractApiError } from '../lib/api-client';
import {
  listCatalogProducts,
  listCatalogServices,
  type ApiProduct,
  type ApiService,
  upsertCatalogProduct,
  upsertCatalogService,
} from '../lib/pethub-api';

type CatalogTab = 'services' | 'products' | 'categories';

type ServiceFormState = {
  code: string;
  name: string;
  description: string;
  durationMin: string;
  price: string;
};

type ProductFormState = {
  sku: string;
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
};

const emptyServiceForm: ServiceFormState = {
  code: '',
  name: '',
  description: '',
  durationMin: '30',
  price: '',
};

const emptyProductForm: ProductFormState = {
  sku: '',
  name: '',
  category: '',
  description: '',
  price: '',
  stock: '0',
};

function formatCurrency(value: number | string) {
  const normalized = Number(value ?? 0);
  return `${Math.round(normalized).toLocaleString('vi-VN')} ₫`;
}

function normalizeCode(raw: string) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferServiceCode(name: string, existingCodes: Set<string>) {
  const seed = normalizeCode(name).replace(/-/g, '').slice(0, 10) || 'SVC';
  let index = 1;
  let candidate = seed;
  while (existingCodes.has(candidate)) {
    candidate = `${seed}${index}`;
    index += 1;
  }
  return candidate;
}

function inferProductSku(name: string, existingSkus: Set<string>) {
  const seed = normalizeCode(name).replace(/-/g, '').slice(0, 10) || 'SKU';
  let index = 1;
  let candidate = seed;
  while (existingSkus.has(candidate)) {
    candidate = `${seed}${index}`;
    index += 1;
  }
  return candidate;
}

export function ManagerCatalogPage() {
  const [tab, setTab] = useState<CatalogTab>('services');
  const [services, setServices] = useState<ApiService[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const loadInFlightRef = useRef(false);

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);

  const loadCatalog = useMemo(
    () => async (silent = false) => {
      if (loadInFlightRef.current) {
        return;
      }
      loadInFlightRef.current = true;
      if (!silent) {
        setLoading(true);
        setError('');
      }
      try {
        const [serviceData, productData] = await Promise.all([
          listCatalogServices(),
          listCatalogProducts(),
        ]);
        setServices(serviceData);
        setProducts(productData);
        setError('');
      } catch (apiError) {
        if (!silent) {
          setError(extractApiError(apiError));
        }
      } finally {
        loadInFlightRef.current = false;
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadCatalog(false);
    const onFocus = () => {
      void loadCatalog(true);
    };
    window.addEventListener('focus', onFocus);

    const timer = window.setInterval(() => {
      void loadCatalog(true);
    }, 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [loadCatalog]);

  const openCreateService = () => {
    setServiceForm(emptyServiceForm);
    setServiceDialogOpen(true);
  };

  const openEditService = (service: ApiService) => {
    setServiceForm({
      code: service.code,
      name: service.name,
      description: service.description ?? '',
      durationMin: String(service.durationMin || 30),
      price: String(Number(service.price ?? 0)),
    });
    setServiceDialogOpen(true);
  };

  const openCreateProduct = () => {
    setProductForm(emptyProductForm);
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: ApiProduct) => {
    setProductForm({
      sku: product.sku,
      name: product.name,
      category: product.category ?? '',
      description: product.description ?? '',
      price: String(Number(product.price ?? 0)),
      stock: String(product.stock ?? 0),
    });
    setProductDialogOpen(true);
  };

  const saveService = async () => {
    const name = serviceForm.name.trim();
    const durationMin = Number(serviceForm.durationMin);
    const price = Number(serviceForm.price);
    if (!name || !Number.isFinite(durationMin) || durationMin <= 0 || !Number.isFinite(price) || price < 0) {
      setError('Vui lòng nhập đủ thông tin dịch vụ hợp lệ.');
      return;
    }

    const existingCodes = new Set(services.map((item) => item.code));
    const code = normalizeCode(serviceForm.code) || inferServiceCode(name, existingCodes);

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await upsertCatalogService({
        code,
        name,
        description: serviceForm.description.trim() || undefined,
        durationMin,
        price,
      });
      await loadCatalog();
      setServiceDialogOpen(false);
      setMessage('Đã lưu dịch vụ thành công. POS sẽ đồng bộ theo dữ liệu này.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async () => {
    const name = productForm.name.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
      setError('Vui lòng nhập đủ thông tin sản phẩm hợp lệ.');
      return;
    }

    const existingSkus = new Set(products.map((item) => item.sku));
    const sku = normalizeCode(productForm.sku) || inferProductSku(name, existingSkus);

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await upsertCatalogProduct({
        sku,
        name,
        category: productForm.category.trim() || undefined,
        description: productForm.description.trim() || undefined,
        price,
        stock,
      });
      await loadCatalog();
      setProductDialogOpen(false);
      setMessage('Đã lưu sản phẩm thành công. POS sẽ đồng bộ theo dữ liệu này.');
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Sản phẩm & Dịch vụ
          </h1>
          <p className='text-sm text-[#7a756e] mt-1'>
            Hệ thống quản lý danh mục thông minh. Kiểm soát dịch vụ và sản phẩm đồng bộ, chính xác, linh hoạt.
          </p>
        </div>
        <button
          type='button'
          onClick={() => void loadCatalog(false)}
          className='px-4 py-2.5 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          Làm mới dữ liệu
        </button>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
      ) : null}

      <div className='inline-flex items-center gap-1 border border-[#2d2a26]/20 bg-white rounded-2xl p-1'>
        {[
          { id: 'services' as const, label: 'Dịch vụ', icon: Stethoscope },
          { id: 'products' as const, label: 'Sản phẩm', icon: ShoppingBag },
          { id: 'categories' as const, label: 'Danh mục', icon: Package },
        ].map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              tab === item.id ? 'bg-[#f0ede8] border border-[#2d2a26]/20' : 'hover:bg-[#faf9f6]'
            }`}
            style={tab === item.id ? { fontWeight: 600 } : undefined}
          >
            <item.icon className='w-4 h-4' />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'services' ? (
        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-sm text-[#7a756e]'>{services.length} dịch vụ</p>
            <button
              type='button'
              onClick={openCreateService}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white text-sm'
            >
              <Plus className='w-4 h-4' />
              Thêm dịch vụ
            </button>
          </div>

          <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {services.map((service, index) => (
              <motion.button
                key={service.id}
                type='button'
                onClick={() => openEditService(service)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className='bg-white border border-[#2d2a26] rounded-2xl p-4 text-left hover:-translate-y-0.5 transition-all'
              >
                <p className='text-xs text-[#7a756e] uppercase tracking-[0.08em]'>{service.code}</p>
                <p className='text-base text-[#2d2a26] mt-1' style={{ fontWeight: 700 }}>
                  {service.name}
                </p>
                <p className='text-sm text-[#7a756e] mt-1 line-clamp-2'>{service.description || 'Chưa có mô tả.'}</p>
                <div className='mt-3 flex items-center justify-between'>
                  <span className='text-xs text-[#7a756e]'>{service.durationMin} phút</span>
                  <span className='text-base text-[#6b8f5e]' style={{ fontWeight: 700 }}>
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {!loading && services.length === 0 ? (
            <div className='rounded-2xl border border-[#2d2a26] bg-white p-6 text-sm text-[#7a756e]'>
              Chưa có dịch vụ nào. Hãy thêm dịch vụ đầu tiên để mở đặt lịch cho khách hàng.
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'products' ? (
        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-sm text-[#7a756e]'>{products.length} sản phẩm</p>
            <button
              type='button'
              onClick={openCreateProduct}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white text-sm'
            >
              <Plus className='w-4 h-4' />
              Thêm sản phẩm
            </button>
          </div>

          <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {products.map((product, index) => (
              <motion.button
                key={product.id}
                type='button'
                onClick={() => openEditProduct(product)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className='bg-white border border-[#2d2a26] rounded-2xl p-4 text-left hover:-translate-y-0.5 transition-all'
              >
                <p className='text-xs text-[#7a756e] uppercase tracking-[0.08em]'>{product.sku}</p>
                <p className='text-base text-[#2d2a26] mt-1' style={{ fontWeight: 700 }}>
                  {product.name}
                </p>
                <p className='text-sm text-[#7a756e] mt-1 line-clamp-2'>{product.description || 'Chưa có mô tả.'}</p>
                <div className='mt-3 flex items-center justify-between text-xs text-[#7a756e]'>
                  <span>{product.category || 'Chưa phân loại'}</span>
                  <span>Tồn kho: {product.stock}</span>
                </div>
                <p className='text-base text-[#6b8f5e] mt-2' style={{ fontWeight: 700 }}>
                  {formatCurrency(product.price)}
                </p>
              </motion.button>
            ))}
          </div>

          {!loading && products.length === 0 ? (
            <div className='rounded-2xl border border-[#2d2a26] bg-white p-6 text-sm text-[#7a756e]'>
              Chưa có sản phẩm nào trong catalog.
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'categories' ? (
        <section className='bg-white border border-[#2d2a26] rounded-2xl p-5 space-y-3'>
          <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Danh mục hiện có
          </h2>
          <p className='text-sm text-[#7a756e]'>
            Danh mục sản phẩm đang lấy trực tiếp từ các sản phẩm thật trong hệ thống.
          </p>
          <div className='flex flex-wrap gap-2'>
            {Array.from(new Set(products.map((item) => item.category?.trim()).filter(Boolean))).map((category) => (
              <span
                key={category}
                className='inline-flex items-center px-3 py-1 rounded-full border border-[#2d2a26]/20 bg-[#faf9f6] text-xs text-[#2d2a26]'
              >
                {category}
              </span>
            ))}
            {products.every((item) => !item.category?.trim()) ? (
              <span className='text-sm text-[#7a756e]'>Chưa có danh mục sản phẩm nào.</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {loading ? <p className='text-sm text-[#7a756e]'>Đang tải catalog...</p> : null}

      {serviceDialogOpen ? (
        <div
          className='fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4'
          onClick={() => !saving && setServiceDialogOpen(false)}
        >
          <div
            className='w-full max-w-xl bg-[#faf9f6] border border-[#2d2a26] rounded-2xl p-5 space-y-3'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Lưu dịch vụ
              </h2>
              <button onClick={() => setServiceDialogOpen(false)} disabled={saving}>
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='grid sm:grid-cols-2 gap-3'>
              <input
                value={serviceForm.code}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder='Mã dịch vụ (auto nếu bỏ trống)'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                value={serviceForm.name}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='Tên dịch vụ'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={1}
                value={serviceForm.durationMin}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, durationMin: event.target.value }))}
                placeholder='Thời lượng (phút)'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={0}
                value={serviceForm.price}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder='Giá tiền'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
            </div>
            <textarea
              value={serviceForm.description}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder='Mô tả dịch vụ'
              className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white resize-none'
            />
            <button
              type='button'
              onClick={() => void saveService()}
              disabled={saving}
              className='w-full py-3 rounded-xl bg-[#6b8f5e] text-white text-sm border border-[#2d2a26] disabled:opacity-60'
            >
              {saving ? 'Đang lưu...' : 'Lưu dịch vụ'}
            </button>
          </div>
        </div>
      ) : null}

      {productDialogOpen ? (
        <div
          className='fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4'
          onClick={() => !saving && setProductDialogOpen(false)}
        >
          <div
            className='w-full max-w-xl bg-[#faf9f6] border border-[#2d2a26] rounded-2xl p-5 space-y-3'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                Lưu sản phẩm
              </h2>
              <button onClick={() => setProductDialogOpen(false)} disabled={saving}>
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='grid sm:grid-cols-2 gap-3'>
              <input
                value={productForm.sku}
                onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
                placeholder='SKU (auto nếu bỏ trống)'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='Tên sản phẩm'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder='Danh mục'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={0}
                value={productForm.stock}
                onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
                placeholder='Tồn kho'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={0}
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder='Giá bán'
                className='p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white sm:col-span-2'
              />
            </div>
            <textarea
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder='Mô tả sản phẩm'
              className='w-full p-3 border border-[#2d2a26]/30 rounded-xl text-sm bg-white resize-none'
            />
            <button
              type='button'
              onClick={() => void saveProduct()}
              disabled={saving}
              className='w-full py-3 rounded-xl bg-[#6b8f5e] text-white text-sm border border-[#2d2a26] disabled:opacity-60'
            >
              {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
