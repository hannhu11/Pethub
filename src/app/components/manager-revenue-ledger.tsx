import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { extractApiError } from '../lib/api-client';
import {
  getInvoiceById,
  listInvoicesLedger,
  listPets,
  type ApiInvoiceLedgerItem,
  type InvoiceDetailsResponse,
} from '../lib/pethub-api';
import type { ApiPet } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

function formatCurrency(value: number | string) {
  const normalized = Number(value ?? 0);
  return `${Math.round(normalized).toLocaleString('vi-VN')} ₫`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const datePart = date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const timePart = date.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

function resolvePaymentMethodMeta(method: ApiInvoiceLedgerItem['paymentMethod']) {
  if (method === 'cash') {
    return {
      label: 'Tiền mặt',
      className: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    };
  }
  if (method === 'card') {
    return {
      label: 'Thẻ',
      className: 'bg-blue-50 border-blue-300 text-blue-700',
    };
  }
  if (method === 'payos' || method === 'transfer') {
    return {
      label: 'Chuyển khoản QR',
      className: 'bg-violet-50 border-violet-300 text-violet-700',
    };
  }
  return {
    label: method.toUpperCase(),
    className: 'bg-[#f6eee7] border-[#592518]/20 text-[#592518]',
  };
}

function resolvePaymentStatusMeta(status: ApiInvoiceLedgerItem['paymentStatus']) {
  if (status === 'paid') {
    return {
      label: 'Đã thanh toán',
      className: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    };
  }
  if (status === 'refunded') {
    return {
      label: 'Đã hoàn tiền',
      className: 'bg-amber-50 border-amber-300 text-amber-700',
    };
  }
  return {
    label: 'Chưa thanh toán',
    className: 'bg-[#f6eee7] border-[#592518]/20 text-[#8b6a61]',
  };
}

export function ManagerRevenueLedgerPage() {
  const [items, setItems] = useState<ApiInvoiceLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<InvoiceDetailsResponse | null>(null);
  const [detailsFallbackPet, setDetailsFallbackPet] = useState<ApiPet | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listInvoicesLedger();
        if (!mounted) {
          return;
        }
        setItems(data.items ?? []);
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

  const summary = useMemo(() => {
    const total = items.reduce((acc, item) => acc + Number(item.grandTotal ?? 0), 0);
    const paid = items.filter((item) => item.paymentStatus === 'paid').length;
    const pending = items.filter((item) => item.paymentStatus === 'unpaid').length;
    return {
      totalInvoices: items.length,
      paidInvoices: paid,
      pendingInvoices: pending,
      totalRevenue: total,
    };
  }, [items]);

  const openDetails = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedDetails(null);
    setDetailsFallbackPet(null);
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const payload = await getInvoiceById(invoiceId);
      setSelectedDetails(payload);
    } catch (apiError) {
      setDetailsError(extractApiError(apiError));
    } finally {
      setDetailsLoading(false);
    }
  };

  const detailsInvoice = selectedDetails?.invoice ?? null;
  const detailsAppointmentPet = detailsInvoice?.appointment?.pet ?? null;
  const detailsFallbackPetId = detailsInvoice?.items.find((item) => item.petId)?.petId ?? null;
  const detailsResolvedPet = detailsAppointmentPet
    ? {
        name: detailsAppointmentPet.name,
        species: detailsAppointmentPet.species,
      }
    : detailsFallbackPet
      ? {
          name: detailsFallbackPet.name,
          species: detailsFallbackPet.species,
        }
      : null;

  useEffect(() => {
    let mounted = true;

    const loadFallbackPet = async () => {
      if (!detailsInvoice || detailsAppointmentPet || !detailsFallbackPetId) {
        setDetailsFallbackPet(null);
        return;
      }

      try {
        const customerPets = await listPets(detailsInvoice.customerId);
        if (!mounted) {
          return;
        }
        setDetailsFallbackPet(customerPets.find((pet) => pet.id === detailsFallbackPetId) ?? null);
      } catch {
        if (mounted) {
          setDetailsFallbackPet(null);
        }
      }
    };

    void loadFallbackPet();

    return () => {
      mounted = false;
    };
  }, [detailsAppointmentPet, detailsFallbackPetId, detailsInvoice]);

  return (
    <div className='space-y-5'>
      <div>
        <h1 className='text-2xl text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          Đối soát doanh thu
        </h1>
        <p className='text-sm text-[#8b6a61] mt-1'>
          Sổ cái đối soát. Bảo chứng toàn vẹn dòng tiền, ngăn ngừa gian lận và chuẩn hóa dữ liệu báo cáo thuế.
        </p>
      </div>

      <div className='grid md:grid-cols-4 gap-3'>
        <div className='bg-white border border-[#592518]/20 rounded-xl p-4'>
          <p className='text-xs text-[#8b6a61]'>Tổng hóa đơn</p>
          <p className='text-xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>{summary.totalInvoices}</p>
        </div>
        <div className='bg-white border border-[#592518]/20 rounded-xl p-4'>
          <p className='text-xs text-[#8b6a61]'>Đã thanh toán</p>
          <p className='text-xl text-emerald-700 mt-1' style={{ fontWeight: 700 }}>{summary.paidInvoices}</p>
        </div>
        <div className='bg-white border border-[#592518]/20 rounded-xl p-4'>
          <p className='text-xs text-[#8b6a61]'>Chờ thanh toán</p>
          <p className='text-xl text-[#8b6a61] mt-1' style={{ fontWeight: 700 }}>{summary.pendingInvoices}</p>
        </div>
        <div className='bg-white border border-[#592518]/20 rounded-xl p-4'>
          <p className='text-xs text-[#8b6a61]'>Tổng đối soát</p>
          <p className='text-xl text-[#592518] mt-1' style={{ fontWeight: 700 }}>{formatCurrency(summary.totalRevenue)}</p>
        </div>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
          {error}
        </div>
      ) : null}

      <div className='bg-white border border-[#592518] rounded-2xl overflow-hidden'>
        {loading ? (
          <div className='py-12 text-center text-sm text-[#8b6a61]'>Đang tải sổ cái hóa đơn...</div>
        ) : items.length === 0 ? (
          <div className='py-14 text-center text-[#8b6a61]'>
            <FileText className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Chưa có hóa đơn để đối soát.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[980px] text-sm'>
              <thead className='bg-[#f6eee7] border-b border-[#592518]'>
                <tr>
                  <th className='text-left px-4 py-3'>Mã HĐ</th>
                  <th className='text-left px-4 py-3'>Thời gian</th>
                  <th className='text-left px-4 py-3'>Khách hàng</th>
                  <th className='text-left px-4 py-3'>Thú cưng</th>
                  <th className='text-left px-4 py-3'>Phương thức</th>
                  <th className='text-right px-4 py-3'>Tổng tiền</th>
                  <th className='text-left px-4 py-3'>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const methodMeta = resolvePaymentMethodMeta(item.paymentMethod);
                  const statusMeta = resolvePaymentStatusMeta(item.paymentStatus);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => void openDetails(item.id)}
                      className='border-b border-[#592518]/10 hover:bg-[#faf8f5] cursor-pointer'
                    >
                      <td className='px-4 py-3 text-[#592518]' style={{ fontWeight: 600 }}>{item.invoiceNo}</td>
                      <td className='px-4 py-3 text-[#8b6a61]'>{formatDateTime(item.issuedAt || item.createdAt)}</td>
                      <td className='px-4 py-3'>
                        <p className='text-[#592518]' style={{ fontWeight: 500 }}>{item.customer?.name ?? '—'}</p>
                        <p className='text-xs text-[#8b6a61]'>{item.customer?.phone ?? 'Không có SĐT'}</p>
                      </td>
                      <td className='px-4 py-3 text-[#592518]'>{item.pet?.name ?? 'Không có'}</td>
                      <td className='px-4 py-3'>
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${methodMeta.className}`} style={{ fontWeight: 600 }}>
                          {methodMeta.label}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right text-[#592518]' style={{ fontWeight: 700 }}>
                        {formatCurrency(item.grandTotal)}
                      </td>
                      <td className='px-4 py-3'>
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${statusMeta.className}`} style={{ fontWeight: 600 }}>
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedInvoiceId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoiceId(null);
            setSelectedDetails(null);
            setDetailsFallbackPet(null);
            setDetailsError('');
          }
        }}
      >
        <DialogContent className='max-w-[calc(100%-2rem)] sm:max-w-5xl border-[#592518] bg-[#faf8f5] p-5 max-h-[92vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Chi tiết hóa đơn đối soát
            </DialogTitle>
            <DialogDescription>
              Bản sao đối chiếu giao dịch phục vụ kiểm toán nội bộ và báo cáo thuế.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className='py-10 text-center text-sm text-[#8b6a61]'>Đang tải chi tiết hóa đơn...</div>
          ) : detailsError ? (
            <div className='rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='w-4 h-4 mt-0.5' />
                <span>{detailsError}</span>
              </div>
            </div>
          ) : detailsInvoice ? (
            <div className='space-y-4'>
              <div className='bg-white border border-[#592518] rounded-2xl p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-lg text-[#592518]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                      Hóa đơn {detailsInvoice.invoiceNo}
                    </p>
                    <p className='text-sm text-[#8b6a61] mt-1'>
                      Ngày phát hành: {formatDateTime(detailsInvoice.issuedAt)}
                    </p>
                  </div>
                  <Link
                    to={`/manager/pos/receipt/${detailsInvoice.id}`}
                    className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518] text-sm bg-white hover:-translate-y-0.5 transition-all'
                  >
                    Mở hóa đơn gốc
                    <ExternalLink className='w-4 h-4' />
                  </Link>
                </div>

                <div className='grid md:grid-cols-2 gap-3 mt-4'>
                  <div className='border border-[#592518]/20 rounded-xl p-3'>
                    <p className='text-xs text-[#8b6a61]'>Khách hàng</p>
                    <p className='text-sm text-[#592518] mt-1' style={{ fontWeight: 600 }}>
                      {detailsInvoice.customer.name}
                    </p>
                    <p className='text-xs text-[#8b6a61]'>{detailsInvoice.customer.phone}</p>
                  </div>
                  <div className='border border-[#592518]/20 rounded-xl p-3'>
                    <p className='text-xs text-[#8b6a61]'>Thú cưng</p>
                    <p className='text-sm text-[#592518] mt-1' style={{ fontWeight: 600 }}>
                      {detailsResolvedPet?.name ?? 'Không có'}
                    </p>
                    <p className='text-xs text-[#8b6a61]'>
                      {detailsResolvedPet?.species ?? 'Chưa xác định'}
                    </p>
                  </div>
                </div>

                <div className='mt-4 overflow-hidden rounded-xl border border-[#592518]/20'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='bg-[#f6eee7] border-b border-[#592518]/20'>
                        <th className='text-left px-3 py-2'>Mục</th>
                        <th className='text-right px-3 py-2'>SL</th>
                        <th className='text-right px-3 py-2'>Đơn giá</th>
                        <th className='text-right px-3 py-2'>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsInvoice.items.map((line) => (
                        <tr key={line.id} className='border-b last:border-b-0 border-[#592518]/10'>
                          <td className='px-3 py-2'>{line.name}</td>
                          <td className='px-3 py-2 text-right'>{line.qty}</td>
                          <td className='px-3 py-2 text-right'>{formatCurrency(line.unitPrice)}</td>
                          <td className='px-3 py-2 text-right'>{formatCurrency(line.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='mt-4 ml-auto max-w-xs border border-[#592518]/20 rounded-xl p-3 space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-[#8b6a61]'>Tạm tính</span>
                    <span>{formatCurrency(detailsInvoice.subtotal)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-[#8b6a61]'>VAT ({Number(detailsInvoice.taxPercent)}%)</span>
                    <span>{formatCurrency(detailsInvoice.taxAmount)}</span>
                  </div>
                  <div className='flex justify-between text-[#592518]' style={{ fontWeight: 700 }}>
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(detailsInvoice.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
