import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
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

const thermalPrintCss = `
  @media print {
    @page {
      size: 58mm 3276mm;
      margin: 0;
    }

    html,
    body {
      width: 58mm !important;
      max-width: 58mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    body * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    #invoice-printable-area {
      width: 58mm !important;
      max-width: 58mm !important;
      margin: 0 auto !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 2.5mm 3mm !important;
    }
  }
`;

const standardPrintCss = `
  @media print {
    body * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

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
  const location = useLocation();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [payload, setPayload] = useState<InvoiceDetailsResponse | null>(null);
  const [fallbackPet, setFallbackPet] = useState<ApiPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const isThermalReceipt = location.pathname.includes('/manager/pos/receipt/');

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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(isThermalReceipt ? '/manager/pos' : '/manager/revenue-ledger');
  };

  if (loading) {
    return <div className='text-sm text-[#8b6a61]'>Đang tải hóa đơn...</div>;
  }

  if (error || !invoice) {
    return (
      <div className='space-y-4'>
        <button
          type='button'
          onClick={handleBack}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại
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

  const clinicName = clinic?.clinicName || 'PetHub Clinic';
  const clinicAddress = clinic?.address || 'Địa chỉ chưa cập nhật';
  const clinicPhone = clinic?.phone || 'N/A';
  const paymentMethod = paymentMethodLabel[invoice.paymentMethod] || invoice.paymentMethod;
  const thermalGuide = 'XP-58: Scale 100%, Margins None, Headers and footers Off, Paper 58(48) x 3276 mm.';

  if (isThermalReceipt) {
    return (
      <div className='space-y-4 print:space-y-0'>
        <style>{thermalPrintCss}</style>

        <div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
          <button
            type='button'
            onClick={handleBack}
            className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
          >
            <ArrowLeft className='w-4 h-4' />
            Quay lại
          </button>
          <button
            type='button'
            onClick={() => window.print()}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#592518] bg-[#d56756] text-white hover:-translate-y-0.5 transition-all text-sm'
          >
            <Printer className='w-4 h-4' />
            In hóa đơn nhiệt 58mm
          </button>
        </div>

        <div className='print:hidden rounded-2xl border border-[#592518]/15 bg-[#faf8f5] p-4 text-xs text-[#8b6a61]'>
          {thermalGuide}
        </div>

        <div
          id='invoice-printable-area'
          ref={invoiceRef}
          className='mx-auto w-[58mm] max-w-[58mm] bg-white border border-[#592518]/15 rounded-xl px-[3.2mm] py-[3mm] text-[11px] leading-[1.55] text-black shadow-[0_10px_24px_rgba(17,24,39,0.08)] print:rounded-none print:border-0 print:shadow-none print:px-[3mm] print:py-[2.5mm]'
        >
          <div className='border-b border-dashed border-black pb-2 text-center'>
            <BrandLockup className='justify-center' imageClassName='h-7' />
            <p className='mt-1 text-[11px]' style={{ fontWeight: 700 }}>{clinicName}</p>
            <p className='text-[10px] leading-4 text-black/80 break-words'>{clinicAddress}</p>
            <p className='text-[10px] text-black/80'>Hotline: {clinicPhone}</p>
          </div>

          <div className='py-2 text-center border-b border-dashed border-black'>
            <p className='text-[12px] tracking-[0.12em]' style={{ fontWeight: 800 }}>HÓA ĐƠN</p>
            <p className='text-[10px] text-black/75 mt-1'>Mã: {invoice.invoiceNo}</p>
            <p className='text-[10px] text-black/75'>Ngày: {formatDateTime(invoice.issuedAt)}</p>
            <p className='text-[10px] text-black/75'>Người lập: {invoice.manager?.name || 'Chưa cập nhật'}</p>
          </div>

          <div className='space-y-1 py-2 border-b border-dashed border-black'>
            <div>
              <p className='text-[10px] uppercase tracking-[0.12em] text-black/60'>Khách hàng</p>
              <p style={{ fontWeight: 700 }}>{invoice.customer.name}</p>
              <p className='text-[10px] text-black/80'>{invoice.customer.phone}</p>
            </div>
            <div className='pt-1'>
              <p className='text-[10px] uppercase tracking-[0.12em] text-black/60'>Thú cưng</p>
              <p style={{ fontWeight: 700 }}>{resolvedPet?.name || '—'}</p>
              <p className='text-[10px] text-black/80'>
                {resolvedPet ? `${resolvedPet.species} • ${resolvedPet.breed || 'Chưa rõ'}` : 'Không có thông tin thú cưng'}
              </p>
            </div>
            <div className='pt-1 text-[10px] text-black/80'>
              Thanh toán: {paymentMethod}
            </div>
          </div>

          <div className='py-2 border-b border-dashed border-black space-y-2'>
            {invoice.items.map((item) => (
              <div key={item.id} className='space-y-0.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <p className='break-words' style={{ fontWeight: 700 }}>{item.name}</p>
                    <p className='text-[10px] uppercase tracking-[0.08em] text-black/55'>
                      {item.itemType === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                    </p>
                  </div>
                  <p className='shrink-0 text-right' style={{ fontWeight: 700 }}>
                    {formatCurrency(item.total)}
                  </p>
                </div>
                <div className='flex items-center justify-between gap-2 text-[10px] text-black/75'>
                  <span>{item.qty} x {formatCurrency(item.unitPrice)}</span>
                  <span>SL: {item.qty}</span>
                </div>
              </div>
            ))}
          </div>

          <div className='space-y-1 py-2 border-b border-dashed border-black'>
            <div className='flex items-center justify-between text-[10px]'>
              <span className='text-black/75'>Tạm tính</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className='flex items-center justify-between text-[10px]'>
              <span className='text-black/75'>VAT ({Number(invoice.taxPercent)}%)</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className='flex items-center justify-between pt-1 text-[12px]'>
              <span style={{ fontWeight: 800 }}>TỔNG CỘNG</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>

          <div className='pt-2 text-center text-[10px] leading-4 text-black/80'>
            {clinic?.invoiceNote || 'Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub!'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 print:space-y-0'>
      <style>{standardPrintCss}</style>

      <div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
        <button
          type='button'
          onClick={handleBack}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#592518] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại
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
            <p className='text-sm text-[#8b6a61] mt-1'>{clinicName}</p>
            <p className='text-sm text-[#8b6a61]'>{clinicAddress}</p>
            <p className='text-sm text-[#8b6a61]'>Hotline: {clinicPhone}</p>
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
            <p className='text-sm text-[#8b6a61]'>Thanh toán: {paymentMethod}</p>
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
