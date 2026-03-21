import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Package, Plus, ShoppingBag, Stethoscope, Trash2, X } from 'lucide-react';
import { extractApiError } from '../lib/api-client';
import { filterCatalogIconOptions, resolveCatalogIcon } from '../lib/catalog-icons';
import {
  deleteCatalogProduct,
  deleteCatalogService,
  listCatalogProducts,
  listCatalogServices,
  type ApiProduct,
  type ApiService,
  upsertCatalogProduct,
  upsertCatalogService,
} from '../lib/pethub-api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

type CatalogTab = 'services' | 'products' | 'categories';

type ServiceFormState = {
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  iconName: string;
  durationMin: string;
  price: string;
};

type ProductFormState = {
  sku: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  iconName: string;
  price: string;
  stock: string;
};

type DeleteTarget = {
  type: 'service' | 'product';
  id: string;
  name: string;
};

const emptyServiceForm: ServiceFormState = {
  code: '',
  name: '',
  description: '',
  imageUrl: '',
  iconName: 'checkup',
  durationMin: '30',
  price: '',
};

const emptyProductForm: ProductFormState = {
  sku: '',
  name: '',
  category: '',
  description: '',
  imageUrl: '',
  iconName: 'product',
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc ảnh tải lên.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

const MAX_CATALOG_IMAGE_BYTES = 700_000;

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.floor((base64.length * 3) / 4);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể xử lý ảnh tải lên.'));
    };
    image.src = objectUrl;
  });
}

async function optimizeCatalogImageForUpload(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  if (estimateDataUrlBytes(originalDataUrl) <= MAX_CATALOG_IMAGE_BYTES) {
    return originalDataUrl;
  }

  const source = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  const maxDimension = 1200;
  const largerEdge = Math.max(source.naturalWidth, source.naturalHeight);
  let width = source.naturalWidth;
  let height = source.naturalHeight;
  if (largerEdge > maxDimension) {
    const ratio = maxDimension / largerEdge;
    width = Math.max(320, Math.round(width * ratio));
    height = Math.max(320, Math.round(height * ratio));
  }

  const qualitySteps = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.4];
  let bestAttempt = originalDataUrl;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    canvas.width = Math.max(320, Math.round(width));
    canvas.height = Math.max(320, Math.round(height));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    for (const quality of qualitySteps) {
      const output = canvas.toDataURL('image/jpeg', quality);
      bestAttempt = output;
      if (estimateDataUrlBytes(output) <= MAX_CATALOG_IMAGE_BYTES) {
        return output;
      }
    }

    width *= 0.82;
    height *= 0.82;
  }

  return bestAttempt;
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
  const [serviceIconSearch, setServiceIconSearch] = useState('');
  const [productIconSearch, setProductIconSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setServiceIconSearch('');
    setServiceDialogOpen(true);
  };

  const openEditService = (service: ApiService) => {
    setServiceForm({
      code: service.code,
      name: service.name,
      description: service.description ?? '',
      imageUrl: service.imageUrl ?? '',
      iconName: service.iconName ?? 'checkup',
      durationMin: String(service.durationMin || 30),
      price: String(Number(service.price ?? 0)),
    });
    setServiceIconSearch('');
    setServiceDialogOpen(true);
  };

  const openCreateProduct = () => {
    setProductForm(emptyProductForm);
    setProductIconSearch('');
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: ApiProduct) => {
    setProductForm({
      sku: product.sku,
      name: product.name,
      category: product.category ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      iconName: product.iconName ?? 'product',
      price: String(Number(product.price ?? 0)),
      stock: String(product.stock ?? 0),
    });
    setProductIconSearch('');
    setProductDialogOpen(true);
  };

  const serviceIconChoices = useMemo(
    () => filterCatalogIconOptions(serviceIconSearch),
    [serviceIconSearch],
  );
  const productIconChoices = useMemo(
    () => filterCatalogIconOptions(productIconSearch),
    [productIconSearch],
  );

  const handleServiceImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await optimizeCatalogImageForUpload(file);
      if (estimateDataUrlBytes(dataUrl) > MAX_CATALOG_IMAGE_BYTES) {
        throw new Error('Ảnh quá lớn sau khi nén. Vui lòng chọn ảnh nhẹ hơn.');
      }
      setServiceForm((prev) => ({
        ...prev,
        imageUrl: dataUrl,
      }));
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      event.target.value = '';
    }
  };

  const handleProductImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await optimizeCatalogImageForUpload(file);
      if (estimateDataUrlBytes(dataUrl) > MAX_CATALOG_IMAGE_BYTES) {
        throw new Error('Ảnh quá lớn sau khi nén. Vui lòng chọn ảnh nhẹ hơn.');
      }
      setProductForm((prev) => ({
        ...prev,
        imageUrl: dataUrl,
      }));
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      event.target.value = '';
    }
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
        imageUrl: serviceForm.imageUrl.trim() || undefined,
        iconName: serviceForm.iconName.trim() || undefined,
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
        imageUrl: productForm.imageUrl.trim() || undefined,
        iconName: productForm.iconName.trim() || undefined,
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

  const requestDelete = (type: 'service' | 'product', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');
    setMessage('');
    try {
      if (deleteTarget.type === 'service') {
        await deleteCatalogService(deleteTarget.id);
        setMessage(`Đã xóa dịch vụ "${deleteTarget.name}" khỏi danh mục hoạt động.`);
      } else {
        await deleteCatalogProduct(deleteTarget.id);
        setMessage(`Đã xóa sản phẩm "${deleteTarget.name}" khỏi danh mục hoạt động.`);
      }
      setDeleteTarget(null);
      await loadCatalog();
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Sản phẩm & Dịch vụ
          </h1>
          <p className='text-sm text-[#8b6a61] mt-1'>
            Hệ thống quản lý danh mục thông minh. Kiểm soát dịch vụ và sản phẩm đồng bộ, chính xác, linh hoạt.
          </p>
        </div>
        <button
          type='button'
          onClick={() => void loadCatalog(false)}
          className='px-4 py-2.5 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          Làm mới dữ liệu
        </button>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
      ) : null}

      <div className='inline-flex items-center gap-1 border border-[#592518]/20 bg-white rounded-2xl p-1'>
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
              tab === item.id ? 'bg-[#f4ece4] border border-[#592518]/20' : 'hover:bg-[#faf8f5]'
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
            <p className='text-sm text-[#8b6a61]'>{services.length} dịch vụ</p>
            <button
              type='button'
              onClick={openCreateService}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#592518] bg-[#d56756] text-white text-sm'
            >
              <Plus className='w-4 h-4' />
              Thêm dịch vụ
            </button>
          </div>

          <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {services.map((service, index) => {
              const iconOption = resolveCatalogIcon(service.iconName);
              const ServiceIcon = iconOption.icon;
              const hasImage = Boolean(service.imageUrl);
              return (
                <motion.button
                  key={service.id}
                  type='button'
                  onClick={() => openEditService(service)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className='bg-white border border-[#592518] rounded-2xl p-4 text-left hover:-translate-y-0.5 transition-all'
                >
                  <div className='flex items-start gap-3'>
                    <div className='w-16 h-16 rounded-xl border border-[#592518]/15 overflow-hidden bg-[#f4ece4] shrink-0'>
                      {hasImage ? (
                        <ImageWithFallback
                          src={service.imageUrl || ''}
                          alt={service.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div
                          className='w-full h-full flex items-center justify-center'
                          style={{ backgroundColor: iconOption.bgColor }}
                        >
                          <ServiceIcon className='w-5 h-5' style={{ color: iconOption.color }} />
                        </div>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span
                          className='w-7 h-7 rounded-lg flex items-center justify-center shrink-0'
                          style={{ backgroundColor: iconOption.bgColor }}
                        >
                          <ServiceIcon className='w-4 h-4' style={{ color: iconOption.color }} />
                        </span>
                        <p className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>{service.code}</p>
                        <button
                          type='button'
                          onClick={(event) => {
                            event.stopPropagation();
                            requestDelete('service', service.id, service.name);
                          }}
                          className='ml-auto w-7 h-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center'
                          aria-label={`Xóa dịch vụ ${service.name}`}
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                      <p className='text-base text-[#592518] mt-1 line-clamp-1' style={{ fontWeight: 700 }}>
                        {service.name}
                      </p>
                      <p className='text-sm text-[#8b6a61] mt-1 line-clamp-2'>{service.description || 'Chưa có mô tả.'}</p>
                    </div>
                  </div>
                  <div className='mt-3 flex items-center justify-between'>
                    <span className='text-xs text-[#8b6a61]'>{service.durationMin} phút</span>
                    <span className='text-base text-[#d56756]' style={{ fontWeight: 700 }}>
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {!loading && services.length === 0 ? (
            <div className='rounded-2xl border border-[#592518] bg-white p-6 text-sm text-[#8b6a61]'>
              Chưa có dịch vụ nào. Hãy thêm dịch vụ đầu tiên để mở đặt lịch cho khách hàng.
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'products' ? (
        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-sm text-[#8b6a61]'>{products.length} sản phẩm</p>
            <button
              type='button'
              onClick={openCreateProduct}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#592518] bg-[#d56756] text-white text-sm'
            >
              <Plus className='w-4 h-4' />
              Thêm sản phẩm
            </button>
          </div>

          <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {products.map((product, index) => {
              const iconOption = resolveCatalogIcon(product.iconName);
              const ProductIcon = iconOption.icon;
              const hasImage = Boolean(product.imageUrl);
              return (
                <motion.button
                  key={product.id}
                  type='button'
                  onClick={() => openEditProduct(product)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className='bg-white border border-[#592518] rounded-2xl p-4 text-left hover:-translate-y-0.5 transition-all'
                >
                  <div className='flex items-start gap-3'>
                    <div className='w-16 h-16 rounded-xl border border-[#592518]/15 overflow-hidden bg-[#f4ece4] shrink-0'>
                      {hasImage ? (
                        <ImageWithFallback
                          src={product.imageUrl || ''}
                          alt={product.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div
                          className='w-full h-full flex items-center justify-center'
                          style={{ backgroundColor: iconOption.bgColor }}
                        >
                          <ProductIcon className='w-5 h-5' style={{ color: iconOption.color }} />
                        </div>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span
                          className='w-7 h-7 rounded-lg flex items-center justify-center shrink-0'
                          style={{ backgroundColor: iconOption.bgColor }}
                        >
                          <ProductIcon className='w-4 h-4' style={{ color: iconOption.color }} />
                        </span>
                        <p className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>{product.sku}</p>
                        <button
                          type='button'
                          onClick={(event) => {
                            event.stopPropagation();
                            requestDelete('product', product.id, product.name);
                          }}
                          className='ml-auto w-7 h-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center'
                          aria-label={`Xóa sản phẩm ${product.name}`}
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                      <p className='text-base text-[#592518] mt-1 line-clamp-1' style={{ fontWeight: 700 }}>
                        {product.name}
                      </p>
                      <p className='text-sm text-[#8b6a61] mt-1 line-clamp-2'>
                        {product.description || 'Chưa có mô tả.'}
                      </p>
                    </div>
                  </div>
                  <div className='mt-3 flex items-center justify-between text-xs text-[#8b6a61]'>
                    <span>{product.category || 'Chưa phân loại'}</span>
                    <span>Tồn kho: {product.stock}</span>
                  </div>
                  <p className='text-base text-[#d56756] mt-2' style={{ fontWeight: 700 }}>
                    {formatCurrency(product.price)}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {!loading && products.length === 0 ? (
            <div className='rounded-2xl border border-[#592518] bg-white p-6 text-sm text-[#8b6a61]'>
              Chưa có sản phẩm nào trong catalog.
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'categories' ? (
        <section className='bg-white border border-[#592518] rounded-2xl p-5 space-y-3'>
          <h2 className='text-lg text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Danh mục hiện có
          </h2>
          <p className='text-sm text-[#8b6a61]'>
            Danh mục sản phẩm đang lấy trực tiếp từ các sản phẩm thật trong hệ thống.
          </p>
          <div className='flex flex-wrap gap-2'>
            {Array.from(new Set(products.map((item) => item.category?.trim()).filter(Boolean))).map((category) => (
              <span
                key={category}
                className='inline-flex items-center px-3 py-1 rounded-full border border-[#592518]/20 bg-[#faf8f5] text-xs text-[#592518]'
              >
                {category}
              </span>
            ))}
            {products.every((item) => !item.category?.trim()) ? (
              <span className='text-sm text-[#8b6a61]'>Chưa có danh mục sản phẩm nào.</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {loading ? <p className='text-sm text-[#8b6a61]'>Đang tải catalog...</p> : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className='bg-[#faf8f5] border border-[#592518]'>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription className='text-[#6c675f]'>
              Bạn có chắc chắn muốn xóa{' '}
              <span className='font-semibold text-[#592518]'>
                {deleteTarget?.type === 'service' ? 'dịch vụ' : 'sản phẩm'} "{deleteTarget?.name || ''}"
              </span>
              ? Hành động này sẽ gỡ mục này khỏi trang Khách hàng và POS. Dữ liệu hóa đơn cũ vẫn được giữ nguyên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              className='bg-red-600 text-white border border-red-700 hover:bg-red-700'
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {serviceDialogOpen ? (
        <div
          className='fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4'
          onClick={() => !saving && setServiceDialogOpen(false)}
        >
          <div
            className='w-full max-w-xl bg-[#faf8f5] border border-[#592518] rounded-2xl p-5 space-y-3'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-lg text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
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
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                value={serviceForm.name}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='Tên dịch vụ'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={1}
                value={serviceForm.durationMin}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, durationMin: event.target.value }))}
                placeholder='Thời lượng (phút)'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={0}
                value={serviceForm.price}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder='Giá tiền'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
            </div>
            <div className='grid sm:grid-cols-[136px_1fr] gap-3'>
              <div className='space-y-2'>
                <p className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>Ảnh dịch vụ</p>
                <div className='w-[136px] h-[96px] rounded-xl overflow-hidden border border-[#592518]/20 bg-[#f4ece4]'>
                  {serviceForm.imageUrl ? (
                    <ImageWithFallback src={serviceForm.imageUrl} alt='Service preview' className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-[11px] text-[#8b6a61] text-center px-3'>
                      Chưa có ảnh
                    </div>
                  )}
                </div>
              </div>
              <div className='space-y-2'>
                <label className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>Tải ảnh từ máy</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(event) => void handleServiceImageUpload(event)}
                  className='block w-full text-sm text-[#592518] file:mr-3 file:rounded-lg file:border file:border-[#592518]/30 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-[#592518]'
                />
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setServiceForm((prev) => ({ ...prev, imageUrl: '' }))}
                    className='px-3 py-1.5 rounded-lg border border-[#592518]/25 text-xs text-[#592518] bg-white'
                  >
                    Xóa ảnh
                  </button>
                  <span className='text-xs text-[#8b6a61]'>Ảnh sẽ đồng bộ sang trang khách hàng.</span>
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <p className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>Icon dịch vụ</p>
              <input
                value={serviceIconSearch}
                onChange={(event) => setServiceIconSearch(event.target.value)}
                placeholder='Tìm icon: spa, grooming, vaccine...'
                className='w-full p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <div className='max-h-40 overflow-auto rounded-xl border border-[#592518]/15 bg-white p-2 grid grid-cols-2 sm:grid-cols-3 gap-2'>
                {serviceIconChoices.map((option) => {
                  const OptionIcon = option.icon;
                  const selected = serviceForm.iconName === option.key;
                  return (
                    <button
                      key={option.key}
                      type='button'
                      onClick={() => setServiceForm((prev) => ({ ...prev, iconName: option.key }))}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        selected
                          ? 'border-[#592518] bg-[#f4ece4]'
                          : 'border-[#592518]/15 bg-white hover:bg-[#faf8f5]'
                      }`}
                    >
                      <span className='inline-flex items-center gap-2'>
                        <span className='w-7 h-7 rounded-lg flex items-center justify-center' style={{ backgroundColor: option.bgColor }}>
                          <OptionIcon className='w-4 h-4' style={{ color: option.color }} />
                        </span>
                        <span className='text-xs text-[#592518]'>{option.label}</span>
                      </span>
                    </button>
                  );
                })}
                {serviceIconChoices.length === 0 ? (
                  <p className='text-xs text-[#8b6a61] px-1 py-2 col-span-full'>Không tìm thấy icon phù hợp.</p>
                ) : null}
              </div>
            </div>
            <textarea
              value={serviceForm.description}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder='Mô tả dịch vụ'
              className='w-full p-3 border border-[#592518]/30 rounded-xl text-sm bg-white resize-none'
            />
            <button
              type='button'
              onClick={() => void saveService()}
              disabled={saving}
              className='w-full py-3 rounded-xl bg-[#d56756] text-white text-sm border border-[#592518] disabled:opacity-60'
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
            className='w-full max-w-xl bg-[#faf8f5] border border-[#592518] rounded-2xl p-5 space-y-3'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-lg text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
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
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='Tên sản phẩm'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder='Danh mục'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={0}
                value={productForm.stock}
                onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
                placeholder='Tồn kho'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <input
                type='number'
                min={0}
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder='Giá bán'
                className='p-3 border border-[#592518]/30 rounded-xl text-sm bg-white sm:col-span-2'
              />
            </div>
            <div className='grid sm:grid-cols-[136px_1fr] gap-3'>
              <div className='space-y-2'>
                <p className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>Ảnh sản phẩm</p>
                <div className='w-[136px] h-[96px] rounded-xl overflow-hidden border border-[#592518]/20 bg-[#f4ece4]'>
                  {productForm.imageUrl ? (
                    <ImageWithFallback src={productForm.imageUrl} alt='Product preview' className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-[11px] text-[#8b6a61] text-center px-3'>
                      Chưa có ảnh
                    </div>
                  )}
                </div>
              </div>
              <div className='space-y-2'>
                <label className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>Tải ảnh từ máy</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(event) => void handleProductImageUpload(event)}
                  className='block w-full text-sm text-[#592518] file:mr-3 file:rounded-lg file:border file:border-[#592518]/30 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-[#592518]'
                />
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                    className='px-3 py-1.5 rounded-lg border border-[#592518]/25 text-xs text-[#592518] bg-white'
                  >
                    Xóa ảnh
                  </button>
                  <span className='text-xs text-[#8b6a61]'>Ảnh dùng cho hiển thị catalog đồng bộ.</span>
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <p className='text-xs text-[#8b6a61] uppercase tracking-[0.08em]'>Icon sản phẩm</p>
              <input
                value={productIconSearch}
                onChange={(event) => setProductIconSearch(event.target.value)}
                placeholder='Tìm icon: product, retail, pharmacy...'
                className='w-full p-3 border border-[#592518]/30 rounded-xl text-sm bg-white'
              />
              <div className='max-h-40 overflow-auto rounded-xl border border-[#592518]/15 bg-white p-2 grid grid-cols-2 sm:grid-cols-3 gap-2'>
                {productIconChoices.map((option) => {
                  const OptionIcon = option.icon;
                  const selected = productForm.iconName === option.key;
                  return (
                    <button
                      key={option.key}
                      type='button'
                      onClick={() => setProductForm((prev) => ({ ...prev, iconName: option.key }))}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        selected
                          ? 'border-[#592518] bg-[#f4ece4]'
                          : 'border-[#592518]/15 bg-white hover:bg-[#faf8f5]'
                      }`}
                    >
                      <span className='inline-flex items-center gap-2'>
                        <span className='w-7 h-7 rounded-lg flex items-center justify-center' style={{ backgroundColor: option.bgColor }}>
                          <OptionIcon className='w-4 h-4' style={{ color: option.color }} />
                        </span>
                        <span className='text-xs text-[#592518]'>{option.label}</span>
                      </span>
                    </button>
                  );
                })}
                {productIconChoices.length === 0 ? (
                  <p className='text-xs text-[#8b6a61] px-1 py-2 col-span-full'>Không tìm thấy icon phù hợp.</p>
                ) : null}
              </div>
            </div>
            <textarea
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder='Mô tả sản phẩm'
              className='w-full p-3 border border-[#592518]/30 rounded-xl text-sm bg-white resize-none'
            />
            <button
              type='button'
              onClick={() => void saveProduct()}
              disabled={saving}
              className='w-full py-3 rounded-xl bg-[#d56756] text-white text-sm border border-[#592518] disabled:opacity-60'
            >
              {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
