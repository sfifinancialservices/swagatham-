import { useEffect, useState } from 'react';
import * as api from '../api/sessionApi';
import { useSession } from '../context/SessionContext';

export default function UserNotificationBanner() {
  const { token, isLoggedIn } = useSession();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setItems([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await api.fetchUserNotifications(token);
        if (!cancelled) setItems(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token]);

  const unread = items.filter((n) => !n.read_at);
  if (unread.length === 0) return null;

  return (
    <div className="user-notification-stack" role="region" aria-label="Messages from Swagatham">
      {unread.map((n) => (
        <div key={n.id} className="user-notification-banner">
          <p>{n.message}</p>
          <button
            type="button"
            className="user-notification-dismiss"
            onClick={async () => {
              try {
                await api.markNotificationRead(token, n.id);
                setItems((prev) =>
                  prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                );
              } catch {
                /* ignore */
              }
            }}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
