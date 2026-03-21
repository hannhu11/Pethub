import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { extractApiError } from '../lib/api-client';
import { downloadElementAsPdf } from './export-utils';
import { getInvoiceById, listPets, type InvoiceDetailsResponse } from '../lib/pethub-api';
import type { ApiPet } from '../types';
import { BrandLockup } from './brand-lockup';

const paymentMethodLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ',
  payos: 'Chuyển khoản QR',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
};

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

export function ManagerInvoicePage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [payload, setPayload] = useState<InvoiceDetailsResponse | null>(null);
  const [fallbackPet, setFallbackPet] = useState<ApiPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!invoiceId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await getInvoiceById(invoiceId);
        if (mounted) {
          setPayload(data);
        }
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
  }, [invoiceId]);

  const invoice = payload?.invoice;
  const clinic = payload?.clinic;
  const appointmentPet = invoice?.appointment?.pet ?? null;
  const fallbackPetId = invoice?.items.find((item) => item.petId)?.petId ?? null;
  const resolvedPet = appointmentPet
    ? {
        name: appointmentPet.name,
        species: appointmentPet.species,
        breed: appointmentPet.breed,
      }
    : fallbackPet
      ? {
          name: fallbackPet.name,
          species: fallbackPet.species,
          breed: fallbackPet.breed ?? null,
        }
      : null;

  useEffect(() => {
    let mounted = true;

    const loadFallbackPet = async () => {
      if (!invoice || appointmentPet || !fallbackPetId) {
        setFallbackPet(null);
        return;
      }

      try {
        const customerPets = await listPets(invoice.customerId);
        if (!mounted) {
          return;
        }
        setFallbackPet(customerPets.find((pet) => pet.id === fallbackPetId) ?? null);
      } catch {
        if (mounted) {
          setFallbackPet(null);
        }
      }
    };

    void loadFallbackPet();

    return () => {
      mounted = false;
    };
  }, [appointmentPet, fallbackPetId, invoice]);

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || downloading || !invoice) return;
    setDownloading(true);
    try {
      await downloadElementAsPdf(invoiceRef.current, {
        fileName: `${invoice.invoiceNo.toLowerCase()}.pdf`,
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className='text-sm text-[#8b6a61]'>Đang tải hóa đơn...</div>;
  }

  if (error || !invoice) {
    return (
      <div className='space-y-4'>
        <button
          type='button'
          onClick={() => navigate('/manager/pos')}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại POS
        </button>
        <div className='bg-white border border-[#592518] rounded-2xl p-8 text-center'>
          <h1 className='text-2xl text-[#592518]' style={{ fontWeight: 700 }}>
            Không tìm thấy hóa đơn
          </h1>
          <p className='text-sm text-[#8b6a61] mt-2'>{error || 'Hóa đơn không tồn tại hoặc không thuộc clinic hiện tại.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 print:space-y-0'>
      <div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
        <button
          type='button'
          onClick={() => navigate('/manager/pos')}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại POS
        </button>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => window.print()}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
          >
            <Printer className='w-4 h-4' />
            In hóa đơn
          </button>
          <button
            type='button'
            onClick={() => void handleDownloadPdf()}
            disabled={downloading}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#592518] bg-[#d56756] text-white hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all text-sm'
          >
            <Download className='w-4 h-4' />
            {downloading ? 'Đang tạo PDF...' : 'Tải PDF'}
          </button>
        </div>
      </div>

      <div
        id='invoice-printable-area'
        ref={invoiceRef}
        className='bg-white border border-[#592518] rounded-2xl p-6 md:p-8 max-w-4xl mx-auto print:max-w-none print:mx-0 print:rounded-none print:border-0 print:p-0 print:text-black'
      >
        <div className='flex items-start justify-between gap-4 border-b border-[#592518]/20 pb-4'>
          <div>
            <BrandLockup imageClassName='h-10 md:h-11' />
            <p className='text-sm text-[#8b6a61] mt-1'>{clinic?.clinicName || 'PetHub Clinic'}</p>
            <p className='text-sm text-[#8b6a61]'>{clinic?.address || 'Địa chỉ chưa cập nhật'}</p>
            <p className='text-sm text-[#8b6a61]'>Hotline: {clinic?.phone || 'N/A'}</p>
          </div>
          <div className='text-right'>
            <p className='text-lg text-[#592518]' style={{ fontWeight: 700 }}>
              HÓA ĐƠN THANH TOÁN
            </p>
            <p className='text-sm text-[#8b6a61] mt-1'>Mã: {invoice.invoiceNo}</p>
            <p className='text-sm text-[#8b6a61]'>Ngày: {formatDateTime(invoice.issuedAt)}</p>
            <p className='text-sm text-[#8b6a61]'>Người lập: {invoice.manager?.name || 'Chưa cập nhật'}</p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4 mt-4'>
          <div className='border border-[#592518]/20 rounded-xl p-4'>
            <p className='text-xs uppercase tracking-wider text-[#8b6a61]'>Khách hàng</p>
            <p className='text-base text-[#592518] mt-1' style={{ fontWeight: 600 }}>{invoice.customer.name}</p>
            <p className='text-sm text-[#8b6a61]'>{invoice.customer.phone}</p>
            <p className='text-sm text-[#8b6a61]'>{invoice.customer.email || 'Chưa có email'}</p>
          </div>
          <div className='border border-[#592518]/20 rounded-xl p-4'>
            <p className='text-xs uppercase tracking-wider text-[#8b6a61]'>Thú cưng</p>
            <p className='text-base text-[#592518] mt-1' style={{ fontWeight: 600 }}>
              {resolvedPet?.name || '—'}
            </p>
            <p className='text-sm text-[#8b6a61]'>
              {resolvedPet
                ? `${resolvedPet.species} • ${resolvedPet.breed || 'Chưa rõ'}`
                : 'Không có thông tin thú cưng'}
            </p>
            <p className='text-sm text-[#8b6a61]'>
              Thanh toán: {paymentMethodLabel[invoice.paymentMethod] || invoice.paymentMethod}
            </p>
          </div>
        </div>

        <div className='mt-5 overflow-hidden rounded-xl border border-[#592518]'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-[#f6eee7] border-b border-[#592518]'>
                <th className='text-left px-3 py-2'>Mục</th>
                <th className='text-left px-3 py-2'>Loại</th>
                <th className='text-right px-3 py-2'>SL</th>
                <th className='text-right px-3 py-2'>Đơn giá</th>
                <th className='text-right px-3 py-2'>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className='border-b last:border-b-0 border-[#592518]/10'>
                  <td className='px-3 py-2'>{item.name}</td>
                  <td className='px-3 py-2'>{item.itemType === 'service' ? 'Dịch vụ' : 'Sản phẩm'}</td>
                  <td className='px-3 py-2 text-right'>{item.qty}</td>
                  <td className='px-3 py-2 text-right'>{formatCurrency(item.unitPrice)}</td>
                  <td className='px-3 py-2 text-right'>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='mt-4 border border-[#592518]/20 rounded-xl p-4 space-y-2 max-w-sm ml-auto'>
          <div className='flex justify-between text-sm'>
            <span className='text-[#8b6a61]'>Tạm tính</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-[#8b6a61]'>VAT ({Number(invoice.taxPercent)}%)</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className='border-t border-[#592518]/20 pt-2 flex justify-between text-lg'>
            <span style={{ fontWeight: 600 }}>Tổng cộng</span>
            <span className='text-[#592518]' style={{ fontWeight: 700 }}>
              {formatCurrency(invoice.grandTotal)}
            </span>
          </div>
        </div>

        <div className='mt-4 text-xs text-[#8b6a61] text-center print:text-black'>
          {clinic?.invoiceNote || 'Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub!'}
        </div>
      </div>
    </div>
  );
}

