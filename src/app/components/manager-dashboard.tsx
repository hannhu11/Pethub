import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, DollarSign, FileText, Stethoscope, Users } from 'lucide-react';
import {
  getAnalyticsCustomerLtvSummary,
  getAnalyticsOverview,
  type AnalyticsLtvSummaryResponse,
  type AnalyticsOverviewResponse,
} from '../lib/pethub-api';
import { extractApiError } from '../lib/api-client';

function formatCurrency(value: number | string) {
  const normalized = Number(value ?? 0);
  return `${Math.round(normalized).toLocaleString('vi-VN')} ₫`;
}

type KpiCard = {
  icon: typeof DollarSign;
  label: string;
  value: string;
  hint: string;
  color: string;
};

export function ManagerDashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [ltvSummary, setLtvSummary] = useState<AnalyticsLtvSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError('');

      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 30);

      try {
        const [overviewData, ltvData] = await Promise.all([
          getAnalyticsOverview({
            from: from.toISOString(),
            to: now.toISOString(),
          }),
          getAnalyticsCustomerLtvSummary(),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewData);
        setLtvSummary(ltvData);
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

  const totalLtv = Number(ltvSummary?.totalLtv ?? 0);
  const sumFromItems = useMemo(
    () => (ltvSummary?.items ?? []).reduce((acc, item) => acc + Number(item.totalSpent ?? 0), 0),
    [ltvSummary?.items],
  );

  const kpiCards: KpiCard[] = [
    {
      icon: Users,
      label: 'Tổng LTV khách hàng',
      value: formatCurrency(totalLtv),
      hint: `${ltvSummary?.totalCustomers ?? 0} khách hàng`,
      color: '#6b8f5e',
    },
    {
      icon: DollarSign,
      label: 'Doanh thu đã thanh toán (30 ngày)',
      value: formatCurrency(overview?.totals.paidRevenue ?? 0),
      hint: `${overview?.totals.paidInvoices ?? 0} hóa đơn đã thu`,
      color: '#4a90d9',
    },
    {
      icon: AlertTriangle,
      label: 'Lịch hẹn hoàn tất chưa thu tiền',
      value: `${overview?.totals.completedUnpaidAppointments ?? 0}`,
      hint: 'Cần xử lý tại POS',
      color: '#c67d5b',
    },
    {
      icon: Stethoscope,
      label: 'Dịch vụ doanh thu cao nhất',
      value: overview?.topServiceRevenue?.serviceName ?? 'Chưa có',
      hint: formatCurrency(overview?.topServiceRevenue?.revenue ?? 0),
      color: '#b8850a',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Tổng quan
          </h1>
          <p className='text-sm text-[#7a756e]'>Nguồn dữ liệu backend thật, đồng bộ analytics + customer LTV</p>
        </div>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className='bg-white border border-[#2d2a26] rounded-2xl p-5'
          >
            <div className='flex items-start justify-between mb-3'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ backgroundColor: `${card.color}20` }}>
                <card.icon className='w-5 h-5' style={{ color: card.color }} />
              </div>
            </div>
            <p className='text-xs text-[#7a756e] mb-1'>{card.label}</p>
            <p className='text-xl text-[#2d2a26] break-words' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {loading ? 'Đang tải...' : card.value}
            </p>
            <p className='text-xs text-[#7a756e] mt-2'>{card.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white border border-[#2d2a26] rounded-2xl p-5'>
          <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
            Khách hàng LTV cao nhất
          </h3>
          <div className='space-y-2'>
            {(ltvSummary?.items ?? []).slice(0, 8).map((item) => (
              <div
                key={item.id}
                className='flex items-center justify-between rounded-xl border border-[#2d2a26]/15 px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-sm text-[#2d2a26] truncate' style={{ fontWeight: 600 }}>
                    {item.name}
                  </p>
                  <p className='text-xs text-[#7a756e] truncate'>
                    {item.phone} • {item.email || 'Chưa cập nhật email'}
                  </p>
                </div>
                <p className='text-sm text-[#6b8f5e]' style={{ fontWeight: 700 }}>
                  {formatCurrency(item.totalSpent)}
                </p>
              </div>
            ))}
            {!loading && (ltvSummary?.items?.length ?? 0) === 0 ? (
              <p className='text-sm text-[#7a756e]'>Chưa có khách hàng phát sinh doanh thu.</p>
            ) : null}
          </div>
        </div>

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-5 space-y-3'>
          <h3 className='text-sm' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
            Đối soát số liệu
          </h3>
          <div className='rounded-xl border border-[#2d2a26]/15 p-3'>
            <p className='text-xs text-[#7a756e]'>LTV từ summary</p>
            <p className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {formatCurrency(totalLtv)}
            </p>
          </div>
          <div className='rounded-xl border border-[#2d2a26]/15 p-3'>
            <p className='text-xs text-[#7a756e]'>Tổng cộng từ danh sách khách hàng</p>
            <p className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {formatCurrency(sumFromItems)}
            </p>
          </div>
          <div className='rounded-xl border border-[#2d2a26]/15 p-3'>
            <p className='text-xs text-[#7a756e]'>Số hóa đơn paid (30 ngày)</p>
            <p className='text-lg text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              <FileText className='w-4 h-4 inline-block mr-1' />
              {overview?.totals.paidInvoices ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
