import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { extractApiError } from '../lib/api-client';
import { downloadElementAsPdf } from './export-utils';
import { getInvoiceById, type InvoiceDetailsResponse } from '../lib/pethub-api';

const paymentMethodLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ',
  payos: 'payOS',
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
  return date.toLocaleString('vi-VN');
}

export function ManagerInvoicePage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [payload, setPayload] = useState<InvoiceDetailsResponse | null>(null);
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
    return <div className='text-sm text-[#7a756e]'>Đang tải hóa đơn...</div>;
  }

  if (error || !invoice) {
    return (
      <div className='space-y-4'>
        <button
          type='button'
          onClick={() => navigate('/manager/pos')}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại POS
        </button>
        <div className='bg-white border border-[#2d2a26] rounded-2xl p-8 text-center'>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Không tìm thấy hóa đơn
          </h1>
          <p className='text-sm text-[#7a756e] mt-2'>{error || 'Hóa đơn không tồn tại hoặc không thuộc clinic hiện tại.'}</p>
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
          className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
        >
          <ArrowLeft className='w-4 h-4' />
          Quay lại POS
        </button>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => window.print()}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
          >
            <Printer className='w-4 h-4' />
            In hóa đơn
          </button>
          <button
            type='button'
            onClick={() => void handleDownloadPdf()}
            disabled={downloading}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all text-sm'
          >
            <Download className='w-4 h-4' />
            {downloading ? 'Đang tạo PDF...' : 'Tải PDF'}
          </button>
        </div>
      </div>

      <div
        id='invoice-printable-area'
        ref={invoiceRef}
        className='bg-white border border-[#2d2a26] rounded-2xl p-6 md:p-8 max-w-4xl mx-auto print:max-w-none print:mx-0 print:rounded-none print:border-0 print:p-0 print:text-black'
      >
        <div className='flex items-start justify-between gap-4 border-b border-[#2d2a26]/20 pb-4'>
          <div>
            <p className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Pet<span className='text-[#c67d5b]'>Hub</span>
            </p>
            <p className='text-sm text-[#7a756e] mt-1'>{clinic?.clinicName || 'PetHub Clinic'}</p>
            <p className='text-sm text-[#7a756e]'>{clinic?.address || 'Địa chỉ chưa cập nhật'}</p>
            <p className='text-sm text-[#7a756e]'>Hotline: {clinic?.phone || 'N/A'}</p>
          </div>
          <div className='text-right'>
            <p className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              HÓA ĐƠN THANH TOÁN
            </p>
            <p className='text-sm text-[#7a756e] mt-1'>Mã: {invoice.invoiceNo}</p>
            <p className='text-sm text-[#7a756e]'>Ngày: {formatDateTime(invoice.issuedAt)}</p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4 mt-4'>
          <div className='border border-[#2d2a26]/20 rounded-xl p-4'>
            <p className='text-xs uppercase tracking-wider text-[#7a756e]'>Khách hàng</p>
            <p className='text-base text-[#2d2a26] mt-1' style={{ fontWeight: 600 }}>{invoice.customer.name}</p>
            <p className='text-sm text-[#7a756e]'>{invoice.customer.phone}</p>
            <p className='text-sm text-[#7a756e]'>{invoice.customer.email || 'Chưa có email'}</p>
          </div>
          <div className='border border-[#2d2a26]/20 rounded-xl p-4'>
            <p className='text-xs uppercase tracking-wider text-[#7a756e]'>Thú cưng</p>
            <p className='text-base text-[#2d2a26] mt-1' style={{ fontWeight: 600 }}>
              {invoice.appointment?.pet?.name || '—'}
            </p>
            <p className='text-sm text-[#7a756e]'>
              {invoice.appointment?.pet
                ? `${invoice.appointment.pet.species} • ${invoice.appointment.pet.breed || 'Chưa rõ'}`
                : 'Không có thông tin thú cưng'}
            </p>
            <p className='text-sm text-[#7a756e]'>
              Thanh toán: {paymentMethodLabel[invoice.paymentMethod] || invoice.paymentMethod}
            </p>
          </div>
        </div>

        <div className='mt-5 overflow-hidden rounded-xl border border-[#2d2a26]'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-[#f5f0eb] border-b border-[#2d2a26]'>
                <th className='text-left px-3 py-2'>Mục</th>
                <th className='text-left px-3 py-2'>Loại</th>
                <th className='text-right px-3 py-2'>SL</th>
                <th className='text-right px-3 py-2'>Đơn giá</th>
                <th className='text-right px-3 py-2'>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className='border-b last:border-b-0 border-[#2d2a26]/10'>
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

        <div className='mt-4 border border-[#2d2a26]/20 rounded-xl p-4 space-y-2 max-w-sm ml-auto'>
          <div className='flex justify-between text-sm'>
            <span className='text-[#7a756e]'>Tạm tính</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-[#7a756e]'>VAT ({Number(invoice.taxPercent)}%)</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className='border-t border-[#2d2a26]/20 pt-2 flex justify-between text-lg'>
            <span style={{ fontWeight: 600 }}>Tổng cộng</span>
            <span className='text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {formatCurrency(invoice.grandTotal)}
            </span>
          </div>
        </div>

        <div className='mt-4 text-xs text-[#7a756e] text-center print:text-black'>
          {clinic?.invoiceNote || 'Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub!'}
        </div>
      </div>
    </div>
  );
}
