import { motion } from 'motion/react';
import {
  TrendingUp,
  CalendarDays,
  Stethoscope,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PackageSearch,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  mockAppointments,
  mockTransactions,
  revenueByMonth,
  revenueByWeek,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
} from './data';

const todayBookings = mockAppointments.filter((appointment) => appointment.date === '2026-03-10');
const completedBookings = mockAppointments.filter((appointment) => appointment.status === 'completed');

const serviceRevenuePalette = ['#6b8f5e', '#c67d5b', '#b8850a', '#4a90d9', '#7d5a4f'];

const serviceRevenueByType = Object.entries(
  completedBookings.reduce<Record<string, number>>((accumulator, appointment) => {
    accumulator[appointment.serviceName] = (accumulator[appointment.serviceName] ?? 0) + appointment.servicePrice;
    return accumulator;
  }, {}),
)
  .map(([name, revenue], index) => ({
    name,
    revenue,
    fill: serviceRevenuePalette[index % serviceRevenuePalette.length],
  }))
  .sort((left, right) => right.revenue - left.revenue);

const serviceUsageCount = Object.entries(
  mockAppointments.reduce<Record<string, number>>((accumulator, appointment) => {
    accumulator[appointment.serviceName] = (accumulator[appointment.serviceName] ?? 0) + 1;
    return accumulator;
  }, {}),
)
  .map(([name, count], index) => ({
    name,
    count,
    fill: serviceRevenuePalette[index % serviceRevenuePalette.length],
  }))
  .sort((left, right) => right.count - left.count);

const productRevenuePalette = ['#c67d5b', '#6b8f5e', '#b8850a', '#4a90d9', '#7d5a4f'];

const productRevenueByType = Object.entries(
  mockTransactions.reduce<Record<string, { revenue: number; quantity: number }>>((accumulator, transaction) => {
    transaction.products.forEach((product) => {
      const existing = accumulator[product.name] ?? { revenue: 0, quantity: 0 };
      accumulator[product.name] = {
        revenue: existing.revenue + product.price * product.quantity,
        quantity: existing.quantity + product.quantity,
      };
    });
    return accumulator;
  }, {}),
)
  .map(([productName, values], index) => ({
    productName,
    revenue: values.revenue,
    quantity: values.quantity,
    fill: productRevenuePalette[index % productRevenuePalette.length],
  }))
  .sort((left, right) => right.revenue - left.revenue)
  .slice(0, 5);

const totalServiceRevenue = completedBookings.reduce((sum, booking) => sum + booking.servicePrice, 0);
const totalProductRevenue = productRevenueByType.reduce((sum, item) => sum + item.revenue, 0);
const combinedRevenue = totalServiceRevenue + totalProductRevenue;
const serviceRevenueRatio = combinedRevenue > 0 ? Math.round((totalServiceRevenue / combinedRevenue) * 100) : 0;
const productRevenueRatio = combinedRevenue > 0 ? Math.round((totalProductRevenue / combinedRevenue) * 100) : 0;
const avgTicketValue = completedBookings.length > 0 ? Math.round(totalServiceRevenue / completedBookings.length) : 0;
const topServiceRevenue = serviceRevenueByType[0];
const hasRevenueByMonth = revenueByMonth.length > 0;
const hasServiceRevenue = serviceRevenueByType.length > 0;
const hasRevenueByWeek = revenueByWeek.length > 0;
const hasProductRevenue = productRevenueByType.length > 0;

type KpiCard = {
  icon: typeof DollarSign;
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  color: string;
};

const kpiCards: KpiCard[] = [
  {
    icon: DollarSign,
    label: 'Doanh thu tuần này',
    value: formatCurrency(combinedRevenue),
    trend: '+12.5% vs tuần trước',
    trendDirection: 'up',
    color: '#6b8f5e',
  },
  {
    icon: CalendarDays,
    label: 'Lịch hẹn hôm nay',
    value: todayBookings.length.toString(),
    trend: `${todayBookings.filter((booking) => booking.status === 'pending').length} chờ duyệt`,
    trendDirection: 'up',
    color: '#c67d5b',
  },
  {
    icon: Stethoscope,
    label: 'Doanh thu cao nhất theo dịch vụ',
    value: topServiceRevenue ? topServiceRevenue.name : 'Chưa có',
    trend: topServiceRevenue ? formatCurrency(topServiceRevenue.revenue) : '0 đ',
    trendDirection: 'up',
    color: '#4a90d9',
  },
  {
    icon: TrendingUp,
    label: 'Doanh thu trung bình / hóa đơn',
    value: formatCurrency(avgTicketValue),
    trend: '+8.1% vs tuần trước',
    trendDirection: 'up',
    color: '#b8850a',
  },
];

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className='h-full w-full flex items-center justify-center text-sm text-[#7a756e] border border-dashed border-[#2d2a26]/30 rounded-xl bg-[#fcfbf9]'>
      {message}
    </div>
  );
}

export function ManagerDashboardPage() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Tổng quan
          </h1>
          <p className='text-sm text-[#7a756e]'>Hôm nay, 10 tháng 3, 2026</p>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className='bg-white border border-[#2d2a26] rounded-2xl p-5'
          >
            <div className='flex items-start justify-between mb-3'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ backgroundColor: `${kpi.color}20` }}>
                <kpi.icon className='w-5 h-5' style={{ color: kpi.color }} />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
                  kpi.trendDirection === 'up'
                    ? 'border-[#6b8f5e]/40 text-[#6b8f5e] bg-[#6b8f5e]/10'
                    : 'border-[#c44040]/40 text-[#c44040] bg-[#c44040]/10'
                }`}
              >
                {kpi.trendDirection === 'up' ? <ArrowUpRight className='w-3 h-3' /> : <ArrowDownRight className='w-3 h-3' />}
                {kpi.trend}
              </span>
            </div>
            <p className='text-xs text-[#7a756e] mb-1'>{kpi.label}</p>
            <p className='text-xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white border border-[#2d2a26] rounded-2xl p-5'>
          <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
            Doanh thu theo tháng
          </h3>
          <div className='h-72'>
            {hasRevenueByMonth ? (
              <ResponsiveContainer width='100%' height='100%' minHeight={280}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#b7afa4' strokeOpacity={0.2} />
                  <XAxis dataKey='month' tick={{ fontSize: 12 }} axisLine={{ stroke: '#6f6961', strokeWidth: 1 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#6f6961', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ border: '1px solid #2d2a26', borderRadius: '12px', fontSize: 12 }}
                  />
                  <Bar dataKey='revenue' fill='#4d7a3f' radius={[8, 8, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message='Chưa có dữ liệu doanh thu theo tháng.' />
            )}
          </div>
        </div>

        <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
          <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
            Doanh thu theo dịch vụ
          </h3>
          <div className='relative h-72'>
            {hasServiceRevenue ? (
              <ResponsiveContainer width='100%' height='100%' minHeight={280}>
                <PieChart>
                  <Pie
                    data={serviceRevenueByType}
                    dataKey='revenue'
                    nameKey='name'
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {serviceRevenueByType.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message='Chưa có dữ liệu doanh thu theo dịch vụ.' />
            )}
            <div className='absolute inset-0 pointer-events-none flex flex-col items-center justify-center'>
              <p className='text-[11px] uppercase tracking-[0.14em] text-[#7a756e]'>Dịch vụ</p>
              <p className='text-sm text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                {formatCurrency(totalServiceRevenue)}
              </p>
            </div>
          </div>
          <div className='space-y-2 mt-2'>
            {serviceRevenueByType.map((item) => (
              <div key={item.name} className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-2 min-w-0'>
                  <span className='w-2.5 h-2.5 rounded-full flex-shrink-0' style={{ backgroundColor: item.fill }} />
                  <span className='truncate'>{item.name}</span>
                </div>
                <span className='text-[#6b8f5e]' style={{ fontWeight: 600 }}>
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white border border-[#2d2a26] rounded-2xl p-5'>
          <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
            Doanh thu theo ngày trong tuần
          </h3>
          <div className='h-64'>
            {hasRevenueByWeek ? (
              <ResponsiveContainer width='100%' height='100%' minHeight={250}>
                <LineChart data={revenueByWeek}>
                  <CartesianGrid vertical={false} strokeDasharray='4 4' stroke='#b7afa4' strokeOpacity={0.2} />
                  <XAxis dataKey='week' tick={{ fontSize: 12 }} axisLine={{ stroke: '#6f6961', strokeWidth: 1 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#6f6961', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ border: '1px solid #2d2a26', borderRadius: '12px', fontSize: 12 }}
                  />
                  <Line
                    type='monotone'
                    dataKey='revenue'
                    stroke='#b55e38'
                    strokeWidth={2}
                    dot={{ fill: '#b55e38', r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message='Chưa có dữ liệu doanh thu theo tuần.' />
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
            <h3 className='text-sm mb-4 flex items-center gap-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
              <PackageSearch className='w-4 h-4 text-[#c67d5b]' />
              Top sản phẩm bán chạy
            </h3>
            <div className='h-56'>
              {hasProductRevenue ? (
                <ResponsiveContainer width='100%' height='100%' minHeight={220}>
                  <BarChart data={productRevenueByType} layout='vertical' margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray='4 4' stroke='#b7afa4' strokeOpacity={0.2} />
                    <XAxis type='number' tick={{ fontSize: 11 }} axisLine={{ stroke: '#6f6961', strokeWidth: 1 }} tickLine={false} />
                    <YAxis dataKey='productName' type='category' width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ border: '1px solid #2d2a26', borderRadius: '12px', fontSize: 12 }}
                    />
                    <Bar dataKey='revenue' radius={[0, 8, 8, 0]} isAnimationActive={false}>
                      {productRevenueByType.map((entry) => (
                        <Cell key={entry.productName} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmptyState message='Chưa có dữ liệu sản phẩm.' />
              )}
            </div>
          </div>

          <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
            <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
              Tỷ trọng doanh thu
            </h3>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <div className='flex items-center justify-between text-xs'>
                  <span>Dịch vụ</span>
                  <span style={{ fontWeight: 600 }}>{serviceRevenueRatio}%</span>
                </div>
                <div className='h-2 rounded-full bg-[#f0ede8] overflow-hidden'>
                  <div className='h-full rounded-full bg-[#6b8f5e]' style={{ width: `${serviceRevenueRatio}%` }} />
                </div>
              </div>
              <div className='space-y-1'>
                <div className='flex items-center justify-between text-xs'>
                  <span>Sản phẩm</span>
                  <span style={{ fontWeight: 600 }}>{productRevenueRatio}%</span>
                </div>
                <div className='h-2 rounded-full bg-[#f0ede8] overflow-hidden'>
                  <div className='h-full rounded-full bg-[#c67d5b]' style={{ width: `${productRevenueRatio}%` }} />
                </div>
              </div>
              <div className='pt-1 text-xs text-[#7a756e]'>
                Tổng doanh thu: <span className='text-[#2d2a26]' style={{ fontWeight: 600 }}>{formatCurrency(combinedRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
        <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
          Dịch vụ được sử dụng nhiều
        </h3>
        <div className='grid md:grid-cols-2 gap-4'>
          {serviceUsageCount.map((service) => {
            const maxUsage = Math.max(...serviceUsageCount.map((item) => item.count), 1);
            const widthPercent = (service.count / maxUsage) * 100;
            return (
              <div key={service.name} className='space-y-1'>
                <div className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <span className='w-2.5 h-2.5 rounded-full flex-shrink-0' style={{ backgroundColor: service.fill }} />
                    <span className='truncate'>{service.name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{service.count} lượt</span>
                </div>
                <div className='h-2 rounded-full bg-[#f0ede8] overflow-hidden'>
                  <div className='h-full rounded-full' style={{ width: `${widthPercent}%`, backgroundColor: service.fill }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl p-5'>
        <h3 className='text-sm mb-4' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
          Lịch hẹn hôm nay
        </h3>
        {todayBookings.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-[#2d2a26]'>
                  <th className='text-left py-2 px-2 text-xs text-[#7a756e]'>Giờ</th>
                  <th className='text-left py-2 px-2 text-xs text-[#7a756e]'>Khách hàng</th>
                  <th className='text-left py-2 px-2 text-xs text-[#7a756e]'>Thú cưng</th>
                  <th className='text-left py-2 px-2 text-xs text-[#7a756e]'>Dịch vụ</th>
                  <th className='text-left py-2 px-2 text-xs text-[#7a756e]'>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((booking) => (
                  <tr key={booking.id} className='border-b border-[#2d2a26]/10'>
                    <td className='py-3 px-2' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                      {booking.time}
                    </td>
                    <td className='py-3 px-2'>{booking.userName}</td>
                    <td className='py-3 px-2'>{booking.petName}</td>
                    <td className='py-3 px-2'>{booking.serviceName}</td>
                    <td className='py-3 px-2'>
                      <span className={`inline-block text-xs px-3 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='text-center py-12 text-[#7a756e]'>
            <CalendarDays className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Không còn lịch hẹn hôm nay.</p>
          </div>
        )}
      </div>
    </div>
  );
}
