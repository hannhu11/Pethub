import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Printer, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getInvoiceById } from './manager-checkout-store';
import { formatCurrency, mockPets, mockUsers } from './data';
import { downloadElementAsPdf } from './export-utils';

const paymentMethodLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ',
};

export function ManagerInvoicePage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const invoice = useMemo(() => (invoiceId ? getInvoiceById(invoiceId) : undefined), [invoiceId]);

  if (!invoice) {
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
          <p className='text-sm text-[#7a756e] mt-2'>Mã hóa đơn không tồn tại hoặc đã bị xóa khỏi bộ nhớ mock.</p>
        </div>
      </div>
    );
  }

  const customer = mockUsers.find((user) => user.id === invoice.customerId);
  const pet = mockPets.find((item) => item.id === invoice.petId);

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadElementAsPdf(invoiceRef.current, {
        fileName: `${invoice.id.toLowerCase()}.pdf`,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
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
            onClick={handleDownloadPdf}
            disabled={downloading}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-[#6b8f5e] text-white hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all text-sm'
          >
            <Download className='w-4 h-4' />
            {downloading ? 'Đang tạo PDF...' : 'Tải PDF'}
          </button>
        </div>
      </div>

      <div ref={invoiceRef} className='bg-white border border-[#2d2a26] rounded-2xl p-6 md:p-8 max-w-4xl mx-auto'>
        <div className='flex items-start justify-between gap-4 border-b border-[#2d2a26]/20 pb-4'>
          <div>
            <p className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Pet<span className='text-[#c67d5b]'>Hub</span>
            </p>
            <p className='text-sm text-[#7a756e] mt-1'>PetHub Clinic, TP. Hồ Chí Minh</p>
            <p className='text-sm text-[#7a756e]'>Hotline: 1900-PETHUB</p>
          </div>
          <div className='text-right'>
            <p className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              HÓA ĐƠN THANH TOÁN
            </p>
            <p className='text-sm text-[#7a756e] mt-1'>Mã: {invoice.id}</p>
            <p className='text-sm text-[#7a756e]'>Ngày: {invoice.createdAt}</p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4 mt-4'>
          <div className='border border-[#2d2a26]/20 rounded-xl p-4'>
            <p className='text-xs uppercase tracking-wider text-[#7a756e]'>Khách hàng</p>
            <p className='text-base text-[#2d2a26] mt-1' style={{ fontWeight: 600 }}>{customer?.name ?? 'Khách lẻ'}</p>
            <p className='text-sm text-[#7a756e]'>{customer?.phone ?? 'Chưa có SĐT'}</p>
            <p className='text-sm text-[#7a756e]'>{customer?.email ?? 'Chưa có email'}</p>
          </div>
          <div className='border border-[#2d2a26]/20 rounded-xl p-4'>
            <p className='text-xs uppercase tracking-wider text-[#7a756e]'>Thú cưng</p>
            <p className='text-base text-[#2d2a26] mt-1' style={{ fontWeight: 600 }}>{pet?.name ?? '—'}</p>
            <p className='text-sm text-[#7a756e]'>{pet ? `${pet.species} • ${pet.breed}` : 'Không có thông tin thú cưng'}</p>
            <p className='text-sm text-[#7a756e]'>Thanh toán: {paymentMethodLabel[invoice.paymentMethod] ?? invoice.paymentMethod}</p>
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
                <tr key={`${item.type}-${item.name}`} className='border-b last:border-b-0 border-[#2d2a26]/10'>
                  <td className='px-3 py-2'>{item.name}</td>
                  <td className='px-3 py-2'>{item.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}</td>
                  <td className='px-3 py-2 text-right'>{item.qty}</td>
                  <td className='px-3 py-2 text-right'>{formatCurrency(item.unitPrice)}</td>
                  <td className='px-3 py-2 text-right'>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='mt-4 grid md:grid-cols-2 gap-4 items-end'>
          <div className='border border-[#2d2a26]/20 rounded-xl p-4 flex flex-col items-center gap-2'>
            <div className='w-28 h-28 bg-white border border-[#2d2a26]/20 rounded-lg p-2'>
              <QRCodeSVG
                value={`BANK_TRANSFER|INVOICE:${invoice.id}|TOTAL:${invoice.grandTotal}`}
                size={96}
                level='M'
              />
            </div>
            <p className='text-xs text-[#7a756e] flex items-center gap-1'>
              <QrCode className='w-3.5 h-3.5' />
              Quét mã để chuyển khoản
            </p>
          </div>
          <div className='border border-[#2d2a26]/20 rounded-xl p-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-[#7a756e]'>Tạm tính</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-[#7a756e]'>VAT (8%)</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className='border-t border-[#2d2a26]/20 pt-2 flex justify-between text-lg'>
              <span style={{ fontWeight: 600 }}>Tổng cộng</span>
              <span className='text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {formatCurrency(invoice.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className='mt-4 text-xs text-[#7a756e] text-center'>
          Cảm ơn quý khách đã sử dụng dịch vụ tại PetHub.
          <span className='block mt-1'>
            Xem lại lịch sử tại <Link to='/manager/pos' className='underline text-[#6b8f5e]'>trang POS</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

