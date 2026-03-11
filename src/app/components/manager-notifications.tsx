import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Circle, Filter } from 'lucide-react';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, subscribeNotificationUpdates } from './manager-notifications-store';

type NotificationFilter = 'all' | 'unread' | 'read';

export function ManagerNotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState(getNotifications());

  useEffect(() => {
    return subscribeNotificationUpdates(() => {
      setNotifications(getNotifications());
    });
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((item) => !item.read);
    if (filter === 'read') return notifications.filter((item) => item.read);
    return notifications;
  }, [filter, notifications]);

  const openNotification = (notificationId: number, to: string) => {
    markNotificationAsRead(notificationId);
    navigate(to);
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl text-[#2d2a26]' style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Trung tâm thông báo
          </h1>
          <p className='text-sm text-[#7a756e] mt-1'>Quản lý toàn bộ thông báo vận hành theo thời gian thực</p>
        </div>
        <button
          type='button'
          onClick={markAllNotificationsAsRead}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2d2a26] bg-white hover:-translate-y-0.5 transition-all text-sm'
          style={{ fontWeight: 600 }}
        >
          <CheckCheck className='w-4 h-4' />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl p-3 flex flex-wrap items-center gap-2'>
        <div className='inline-flex items-center gap-1 text-xs text-[#7a756e] mr-2'>
          <Filter className='w-3.5 h-3.5' />
          Bộ lọc
        </div>
        {[
          { id: 'all' as const, label: 'Tất cả', count: notifications.length },
          { id: 'unread' as const, label: 'Chưa đọc', count: unreadCount },
          { id: 'read' as const, label: 'Đã đọc', count: notifications.length - unreadCount },
        ].map((item) => (
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
      </div>

      <div className='bg-white border border-[#2d2a26] rounded-2xl overflow-hidden'>
        {filtered.length === 0 ? (
          <div className='py-16 text-center text-[#7a756e]'>
            <Bell className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p>Không có thông báo phù hợp</p>
          </div>
        ) : (
          <div className='divide-y divide-[#2d2a26]/10'>
            {filtered.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => openNotification(item.id, item.to)}
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
                    <p className='text-xs text-[#9b948b] mt-1'>{item.createdAt}</p>
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

