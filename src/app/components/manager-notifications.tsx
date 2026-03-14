import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Circle, Filter } from 'lucide-react';
import { extractApiError } from '../lib/api-client';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type ApiNotification,
} from '../lib/pethub-api';

type NotificationFilter = 'all' | 'unread' | 'read';

function formatTimeAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN');
}

export function ManagerNotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useMemo(
    () => async (targetFilter: NotificationFilter, silent = false) => {
      if (!silent) {
        setLoading(true);
        setError('');
      }
      try {
        const data = await listNotifications(targetFilter);
        setNotifications(data.items);
        setUnreadCount(data.unread);
      } catch (apiError) {
        if (!silent) {
          setError(extractApiError(apiError));
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadNotifications(filter);
  }, [filter, loadNotifications]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadNotifications(filter, true);
    }, 15000);
    return () => {
      window.clearInterval(timer);
    };
  }, [filter, loadNotifications]);

  const filterOptions: Array<{ id: NotificationFilter; label: string; count: number }> = [
    { id: 'all', label: 'Tất cả', count: notifications.length },
    { id: 'unread', label: 'Chưa đọc', count: notifications.filter((item) => !item.read).length },
    { id: 'read', label: 'Đã đọc', count: notifications.filter((item) => item.read).length },
  ];
  const selectedFilterLabel = filterOptions.find((item) => item.id === filter)?.label ?? 'Tất cả';

  const openNotification = async (notification: ApiNotification) => {
    if (!notification.read) {
      try {
        const data = await markNotificationAsRead(notification.id);
        setUnreadCount(data.unread);
      } catch {
        // Keep navigation even if mark-read fails.
      }
    }
    navigate(notification.linkTo || '/manager');
  };

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications(filter, true);
    } catch (apiError) {
      setError(extractApiError(apiError));
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Trung tâm thông báo
          </h1>
          <p className='text-sm text-[#7a756e] mt-1'>Dữ liệu realtime từ backend, không dùng mock notifications.</p>
        </div>
        <button
          type='button'
          onClick={() => void markAll()}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
          style={{ fontWeight: 600 }}
        >
          <CheckCheck className='w-4 h-4' />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {error ? <div className='rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{error}</div> : null}

      <div className='bg-white border border-[#2d2a26] rounded-2xl p-3 flex flex-wrap items-center gap-2'>
        <div className='inline-flex items-center gap-1 text-xs text-[#7a756e] mr-2'>
          <Filter className='w-3.5 h-3.5' />
          Bộ lọc
        </div>
        {filterOptions.map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
              filter === item.id
                ? 'bg-[#6b8f5e] text-white border-[#2d2a26]'
                : 'bg-[#faf9f6] text-[#2d2a26] border-[#2d2a26]/20 hover:bg-[#f0ede8]'
            }`}
            style={{ fontWeight: 600 }}
          >
            {item.label} ({item.count})
          </button>
        ))}
        <span className='ml-auto text-xs text-[#7a756e]'>Đang xem: {selectedFilterLabel} • {unreadCount} chưa đọc</span>
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden'>
        {loading ? (
          <div className='py-12 text-center text-sm text-[#7a756e]'>Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className='py-16 text-center text-[#7a756e]'>
            <Bell className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Không có thông báo phù hợp</p>
          </div>
        ) : (
          <div className='divide-y divide-[#2d2a26]/10'>
            {notifications.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => void openNotification(item)}
                className='w-full text-left px-4 py-4 hover:bg-[#faf9f6] transition-colors'
              >
                <div className='flex items-start gap-3'>
                  <div className='mt-1'>
                    {!item.read ? (
                      <Circle className='w-3.5 h-3.5 fill-[#6b8f5e] text-[#6b8f5e]' />
                    ) : (
                      <Circle className='w-3.5 h-3.5 text-[#d0cbc4]' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm text-[#2d2a26]' style={!item.read ? { fontWeight: 600 } : { fontWeight: 500 }}>
                      {item.title}
                    </p>
                    <p className='text-sm text-[#7a756e] mt-0.5'>{item.body}</p>
                    <p className='text-xs text-[#9b948b] mt-1'>{formatTimeAgo(item.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
