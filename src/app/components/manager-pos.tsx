import { useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, QrCode, Receipt, Search, ShoppingBag, Stethoscope, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  checkoutPos,
  getPosPrefill,
  getInvoiceById,
  listCatalogProducts,
  listCatalogServices,
  listCustomers,
  listPets,
  type ApiProduct,
  type ApiService,
  type PosCheckoutResponse,
} from '../lib/pethub-api';
import type { ApiCustomer, ApiPet } from '../types';
import { extractApiError } from '../lib/api-client';

type CatalogTab = 'service' | 'product';
type PaymentMethod = 'cash' | 'transfer' | 'card';

type CartItem = {
  key: string;
  itemType: 'service' | 'product';
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
};

const DEFAULT_TAX_PERCENT = 8;
const LAST_POS_CHECKOUT_STORAGE_KEY = 'pethub:last-pos-checkout';

function formatCurrency(value: number | string) {
  const normalized = Number(value ?? 0);
  return `${Math.round(normalized).toLocaleString('vi-VN')} ₫`;
}

function resolveQrValue(result: PosCheckoutResponse | null): string | null {
  if (!result?.paymentAction) {
    return null;
  }

  return result.paymentAction.qrCode ?? result.paymentAction.checkoutUrl;
}

export function ManagerPOSPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<CatalogTab>('service');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<PosCheckoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const appointmentId = searchParams.get('appointmentId')?.trim() || '';
  const paymentFlag = searchParams.get('payment')?.trim() || '';

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [customerData, serviceData, productData] = await Promise.all([
          listCustomers(),
          listCatalogServices(),
          listCatalogProducts(),
        ]);

        if (!mounted) {
          return;
        }

        setCustomers(customerData);
        setServices(serviceData);
        setProducts(productData);
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(LAST_POS_CHECKOUT_STORAGE_KEY);
    if (!raw) {
      if (paymentFlag === 'success') {
        setMessage('Thanh toán đã hoàn tất trên payOS. Hệ thống đang xác minh trạng thái hóa đơn...');
      }
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PosCheckoutResponse;
      if (parsed?.invoiceId) {
        setCheckoutResult(parsed);
        if (parsed.paymentStatus === 'paid') {
          navigate(`/manager/invoice/${parsed.invoiceId}`, { replace: true });
          return;
        }
        if (parsed.paymentAction) {
          navigate(`/manager/pos/transaction/${parsed.invoiceId}`, { replace: true });
          return;
        }
      }
    } catch {
      window.sessionStorage.removeItem(LAST_POS_CHECKOUT_STORAGE_KEY);
    }

    if (paymentFlag === 'success') {
      setMessage('Thanh toán đã hoàn tất trên payOS. Hệ thống đang xác minh trạng thái hóa đơn...');
    }
    if (paymentFlag === 'cancel') {
      setMessage('Khách đã hủy thanh toán trên payOS. Hóa đơn vẫn ở trạng thái chờ.');
    }
  }, [navigate, paymentFlag]);

  useEffect(() => {
    if (!appointmentId) {
      return;
    }
    let mounted = true;
    const run = async () => {
      try {
        const prefill = await getPosPrefill(appointmentId);
        if (!mounted || !prefill.appointment) {
          return;
        }

        setSelectedCustomerId(prefill.appointment.customerId);
        setSelectedPetId(prefill.appointment.petId);
        if ((prefill.suggestedItems?.length ?? 0) > 0) {
          setCart((prev) => {
            if (prev.length > 0) {
              return prev;
            }
            return (prefill.suggestedItems ?? []).map((item) => ({
              key: `${item.itemType}-${item.serviceId || item.productId || item.name}`,
              itemType: item.itemType,
              id: item.serviceId || item.productId || item.name,
              name: item.name,
              unitPrice: Number(item.unitPrice ?? 0),
              qty: item.qty,
            }));
          });
        }
        setMessage('Đã nạp dữ liệu lịch hẹn cần checkout từ màn quản lý lịch hẹn.');
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!selectedCustomerId) {
        setPets([]);
        setSelectedPetId('');
        return;
      }

      try {
        const customerPets = await listPets(selectedCustomerId);
        if (mounted) {
          setPets(customerPets);
          if (!customerPets.some((pet) => pet.id === selectedPetId)) {
            setSelectedPetId(customerPets[0]?.id ?? '');
          }
        }
      } catch (apiError) {
        if (mounted) {
          setError(extractApiError(apiError));
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [selectedCustomerId, selectedPetId]);

  useEffect(() => {
    if (!checkoutResult?.paymentAction || checkoutResult.paymentStatus === 'paid') {
      return;
    }

    let mounted = true;
    setCheckingPayment(true);

    const poll = async () => {
      try {
        const data = await getInvoiceById(checkoutResult.invoiceId);
        if (!mounted) {
          return;
        }

        if (data.invoice.paymentStatus === 'paid') {
          setCheckoutResult((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: 'paid',
                }
              : prev,
          );
          setCart([]);
          setMessage('payOS đã xác nhận giao dịch. Hóa đơn đã chuyển sang ĐÃ THANH TOÁN.');
          setCheckingPayment(false);
          window.sessionStorage.removeItem(LAST_POS_CHECKOUT_STORAGE_KEY);
          navigate(`/manager/invoice/${data.invoice.id}`, { replace: true });
          return;
        }
      } catch {
        if (mounted) {
          setCheckingPayment(false);
        }
      }
    };

    const timer = setInterval(() => {
      void poll();
    }, 3000);

    void poll();

    return () => {
      mounted = false;
      setCheckingPayment(false);
      clearInterval(timer);
    };
  }, [checkoutResult?.invoiceId, checkoutResult?.paymentAction, checkoutResult?.paymentStatus, navigate]);

  useEffect(() => {
    if (!checkoutResult) {
      window.sessionStorage.removeItem(LAST_POS_CHECKOUT_STORAGE_KEY);
      return;
    }

    if (checkoutResult.paymentStatus === 'paid') {
      window.sessionStorage.removeItem(LAST_POS_CHECKOUT_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(LAST_POS_CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutResult));
  }, [checkoutResult]);

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const source =
      tab === 'service'
        ? services.map((service) => ({
            key: `service-${service.id}`,
            itemType: 'service' as const,
            id: service.id,
            name: service.name,
            price: Number(service.price),
          }))
        : products.map((product) => ({
            key: `product-${product.id}`,
            itemType: 'product' as const,
            id: product.id,
            name: product.name,
            price: Number(product.price),
          }));

    return source.filter((item) => !keyword || item.name.toLowerCase().includes(keyword));
  }, [products, search, services, tab]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const taxAmount = (subtotal * DEFAULT_TAX_PERCENT) / 100;
  const grandTotal = subtotal + taxAmount;

  const addToCart = (item: { key: string; itemType: 'service' | 'product'; id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.key === item.key);
      if (existing) {
        return prev.map((entry) => (entry.key === item.key ? { ...entry, qty: entry.qty + 1 } : entry));
      }

      return [
        ...prev,
        {
          key: item.key,
          itemType: item.itemType,
          id: item.id,
          name: item.name,
          unitPrice: item.price,
          qty: 1,
        },
      ];
    });
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? {
                ...item,
                qty: Math.max(1, item.qty + delta),
              }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId || cart.length === 0) {
      setError('Vui lòng chọn khách hàng và ít nhất một dịch vụ/sản phẩm.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    setCheckoutResult(null);

    try {
      const result = await checkoutPos({
        appointmentId: appointmentId || undefined,
        customerId: selectedCustomerId,
        petId: selectedPetId || undefined,
        paymentMethod,
        taxPercent: DEFAULT_TAX_PERCENT,
        returnUrl: `${window.location.origin}/manager/pos?payment=success`,
        cancelUrl: `${window.location.origin}/manager/pos?payment=cancel`,
        items: cart.map((item) => ({
          itemType: item.itemType,
          serviceId: item.itemType === 'service' ? item.id : undefined,
          productId: item.itemType === 'product' ? item.id : undefined,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
      });

      setCheckoutResult(result);
      if (result.paymentStatus === 'paid') {
        setMessage('Thanh toán thành công. Hóa đơn đã được ghi nhận.');
        setCart([]);
        window.sessionStorage.removeItem(LAST_POS_CHECKOUT_STORAGE_KEY);
        navigate(`/manager/invoice/${result.invoiceId}`);
      } else {
        setMessage('Đã tạo hóa đơn chờ thanh toán. Khách vui lòng quét QR payOS để chuyển khoản.');
        if (result.paymentAction) {
          navigate(`/manager/pos/transaction/${result.invoiceId}`);
        }
      }
    } catch (apiError) {
      setError(extractApiError(apiError));
    } finally {
      setSubmitting(false);
    }
  };

  const qrValue = resolveQrValue(checkoutResult);

  return (
    <div className='space-y-4'>
      <div>
        <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Thanh toán POS
        </h1>
        <p className='text-sm text-[#7a756e]'>Checkout backend thật. QR chuyển khoản dùng payOS và xác nhận qua webhook.</p>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}
      {message ? (
        <div className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</div>
      ) : null}

      <div className='grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5'>
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={() => setTab('service')}
              className={`px-4 py-2 rounded-xl border text-sm ${
                tab === 'service' ? 'bg-[#2d2a26] text-white border-[#2d2a26]' : 'bg-white border-[#2d2a26]/20'
              }`}
            >
              <Stethoscope className='w-4 h-4 inline-block mr-1' />
              Dịch vụ
            </button>
            <button
              type='button'
              onClick={() => setTab('product')}
              className={`px-4 py-2 rounded-xl border text-sm ${
                tab === 'product' ? 'bg-[#2d2a26] text-white border-[#2d2a26]' : 'bg-white border-[#2d2a26]/20'
              }`}
            >
              <ShoppingBag className='w-4 h-4 inline-block mr-1' />
              Sản phẩm
            </button>
          </div>

          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a756e]' />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Tìm theo tên...'
              className='w-full pl-9 pr-3 py-3 rounded-xl border border-[#2d2a26] bg-white text-sm'
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
            {visibleItems.map((item) => (
              <button
                key={item.key}
                type='button'
                onClick={() => addToCart(item)}
                className='bg-white border border-[#2d2a26] rounded-xl p-3 text-left hover:-translate-y-0.5 transition-all'
              >
                <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>
                  {item.name}
                </p>
                <p className='text-sm text-[#6b8f5e] mt-1'>{formatCurrency(item.price)}</p>
              </button>
            ))}
          </div>
          {!loading && visibleItems.length === 0 ? (
            <div className='rounded-xl border border-[#2d2a26]/20 bg-white p-4 text-sm text-[#7a756e]'>
              {tab === 'service'
                ? 'Chưa có dịch vụ backend thật trong catalog. Vui lòng vào mục Sản phẩm & Dịch vụ để thêm dịch vụ.'
                : 'Chưa có sản phẩm backend thật trong catalog.'}
            </div>
          ) : null}
          {loading ? <p className='text-sm text-[#7a756e]'>Đang tải dữ liệu POS...</p> : null}
        </div>

        <div>
          <div className='bg-white border-2 border-[#2d2a26] rounded-2xl overflow-hidden'>
            <div className='bg-[#2d2a26] text-white p-4 flex items-center gap-2'>
              <Receipt className='w-4 h-4' />
              <p className='text-sm' style={{ fontWeight: 700 }}>
                HÓA ĐƠN
              </p>
            </div>

            <div className='p-4 space-y-3 border-b border-[#2d2a26]/10'>
              <div>
                <label className='text-xs text-[#7a756e]'>Khách hàng</label>
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className='w-full mt-1 p-2.5 rounded-xl border border-[#2d2a26] text-sm bg-white'
                >
                  <option value=''>-- Chọn khách hàng --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='text-xs text-[#7a756e]'>Thú cưng</label>
                <select
                  value={selectedPetId}
                  onChange={(event) => setSelectedPetId(event.target.value)}
                  disabled={pets.length === 0}
                  className='w-full mt-1 p-2.5 rounded-xl border border-[#2d2a26] text-sm bg-white'
                >
                  <option value=''>-- Chọn thú cưng --</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
                {!selectedCustomerId ? (
                  <p className='text-xs text-[#7a756e] mt-1'>Chọn khách hàng để tải danh sách thú cưng.</p>
                ) : null}
              </div>
            </div>

            <div className='max-h-64 overflow-y-auto'>
              {cart.length === 0 ? (
                <p className='p-4 text-sm text-[#7a756e]'>Chưa có mục nào trong giỏ.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.key} className='p-3 border-b border-[#2d2a26]/10'>
                    <div className='flex justify-between items-start gap-2'>
                      <div>
                        <p className='text-sm text-[#2d2a26]' style={{ fontWeight: 600 }}>
                          {item.name}
                        </p>
                        <p className='text-xs text-[#7a756e]'>{formatCurrency(item.unitPrice)} / mục</p>
                      </div>
                      <button type='button' onClick={() => removeFromCart(item.key)} className='text-red-500'>
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                    <div className='mt-2 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <button type='button' onClick={() => updateQty(item.key, -1)} className='w-7 h-7 rounded-lg border border-[#2d2a26]/20'>
                          -
                        </button>
                        <span className='text-sm'>{item.qty}</span>
                        <button type='button' onClick={() => updateQty(item.key, 1)} className='w-7 h-7 rounded-lg border border-[#2d2a26]/20'>
                          +
                        </button>
                      </div>
                      <p className='text-sm text-[#6b8f5e]' style={{ fontWeight: 700 }}>
                        {formatCurrency(item.unitPrice * item.qty)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className='p-4 space-y-2 border-t border-[#2d2a26]/15'>
              <div className='flex justify-between text-sm'>
                <span className='text-[#7a756e]'>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-[#7a756e]'>VAT ({DEFAULT_TAX_PERCENT}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className='flex justify-between text-lg'>
                <span style={{ fontWeight: 600 }}>Tổng cộng</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className='px-4 pb-2'>
              <p className='text-xs text-[#7a756e] mb-2'>Phương thức thanh toán</p>
              <div className='grid grid-cols-3 gap-2'>
                {[
                  { id: 'cash' as const, label: 'Tiền mặt', icon: Banknote },
                  { id: 'transfer' as const, label: 'QR Bank', icon: QrCode },
                  { id: 'card' as const, label: 'Thẻ', icon: CreditCard },
                ].map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => setPaymentMethod(item.id)}
                    className={`py-2 rounded-xl border text-xs ${
                      paymentMethod === item.id
                        ? 'bg-[#2d2a26] text-white border-[#2d2a26]'
                        : 'bg-white border-[#2d2a26]/20 text-[#2d2a26]'
                    }`}
                  >
                    <item.icon className='w-4 h-4 inline-block mr-1' />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='p-4'>
              <button
                type='button'
                onClick={() => void handleCheckout()}
                disabled={submitting || cart.length === 0 || !selectedCustomerId}
                className='w-full py-3 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white text-sm disabled:opacity-60'
                style={{ fontWeight: 700 }}
              >
                {submitting ? 'Đang tạo giao dịch...' : 'Hoàn tất thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {checkoutResult ? (
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
          <h2 className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Trạng thái giao dịch
          </h2>
          <div className='mt-3 grid md:grid-cols-2 gap-4'>
            <div className='space-y-2 text-sm'>
              <p>
                Hóa đơn: <span style={{ fontWeight: 600 }}>{checkoutResult.invoiceNo}</span>
              </p>
              <p>
                Mã đơn payOS: <span style={{ fontWeight: 600 }}>{checkoutResult.paymentAction?.orderCode || '--'}</span>
              </p>
              <p>
                Trạng thái:{' '}
                <span className={checkoutResult.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'} style={{ fontWeight: 700 }}>
                  {checkoutResult.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                </span>
              </p>
              {checkoutResult.paymentAction ? (
                <p className='text-xs text-[#7a756e]'>
                  payOS xác nhận qua webhook `POST /api/payments/payos/webhook`. Khi ngân hàng chuyển thành công, trạng thái sẽ tự cập nhật.
                </p>
              ) : null}
              {checkingPayment && checkoutResult.paymentStatus !== 'paid' ? (
                <p className='text-xs text-[#7a756e]'>Đang kiểm tra xác nhận thanh toán từ payOS...</p>
              ) : null}
            </div>

            {checkoutResult.paymentAction ? (
              <div className='border border-[#2d2a26]/15 rounded-xl p-4 flex flex-col items-center gap-3'>
                {qrValue?.startsWith('http') || qrValue?.startsWith('data:image') ? (
                  <img src={qrValue} alt='payOS QR' className='w-52 h-52 object-contain border border-[#2d2a26]/10 rounded-lg p-2 bg-white' />
                ) : qrValue ? (
                  <div className='w-56 h-56 border border-[#2d2a26]/10 rounded-lg p-2 bg-white flex items-center justify-center'>
                    <QRCodeSVG value={qrValue} size={200} />
                  </div>
                ) : (
                  <div className='w-52 h-52 border border-dashed border-[#2d2a26]/20 rounded-lg flex items-center justify-center text-xs text-[#7a756e]'>
                    Chưa có QR từ payOS
                  </div>
                )}
                <a
                  href={checkoutResult.paymentAction.checkoutUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-sm text-[#6b8f5e] underline'
                >
                  Mở link thanh toán payOS
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
