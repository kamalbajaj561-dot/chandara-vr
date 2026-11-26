import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../services/notificationService';

const NotificationBell = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const c = await getUnreadCount();
        if (alive) setCount(c);
      } catch { /* badge is best-effort */ }
    };
    refresh();
    const t = setInterval(refresh, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <Link to="/notifications" className="relative text-gray-300 hover:text-gold" aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}>
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-gold text-darkerBlue text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
