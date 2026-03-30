import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as adminApi from '../api/adminApi';
import { useAdmin } from '../context/AdminContext';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { adminToken, adminLogout, isAdminLoggedIn } = useAdmin();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [incomplete, setIncomplete] = useState([]);
  const [complete, setComplete] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [notifyUserId, setNotifyUserId] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('Please complete your profile information.');
  const [notifyBusy, setNotifyBusy] = useState(false);

  const load = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setErr('');
    try {
      const [s, u] = await Promise.all([
        adminApi.fetchAdminStats(adminToken),
        adminApi.fetchAdminUsers(adminToken),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setIncomplete(u.incomplete || []);
      setComplete(u.complete || []);
    } catch (e) {
      setErr(e.message || 'Failed to load');
      if (e.message?.includes('403') || e.message?.includes('401')) {
        adminLogout();
        navigate('/admin', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [adminToken, adminLogout, navigate]);

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate('/admin', { replace: true });
      return;
    }
    load();
  }, [isAdminLoggedIn, navigate, load]);

  const openUser = async (id) => {
    if (!adminToken) return;
    try {
      const user = await adminApi.fetchAdminUserDetail(adminToken, id);
      setDetail(user);
    } catch (e) {
      alert(e.message);
    }
  };

  const sendNotification = async () => {
    const uid = parseInt(notifyUserId, 10);
    if (!uid || !notifyMessage.trim()) {
      alert('Select a user and enter a message');
      return;
    }
    setNotifyBusy(true);
    try {
      await adminApi.sendAdminNotification(adminToken, { userId: uid, message: notifyMessage.trim() });
      alert('Notification sent');
      setNotifyMessage('Please complete your profile information.');
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setNotifyBusy(false);
    }
  };

  if (!isAdminLoggedIn) return null;

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-brand">
          <img src="/logo-mark.svg" alt="" width={40} height={40} />
          <h1>Admin dashboard</h1>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            adminLogout();
            navigate('/donate', { replace: true });
          }}
        >
          Sign out
        </button>
      </header>

      {loading ? <p className="admin-dashboard-loading">Loading…</p> : null}
      {err ? <p className="admin-dashboard-error">{err}</p> : null}

      {stats && !loading ? (
        <section className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Users</span>
            <span className="admin-stat-value">{stats.totalUsers}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Payments</span>
            <span className="admin-stat-value">{stats.totalPayments}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total ₹</span>
            <span className="admin-stat-value">{Number(stats.totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        </section>
      ) : null}

      <section className="admin-notify-section">
        <h2>Send notification to a user</h2>
        <p className="admin-help">Message appears as a banner when the user visits the site (logged in).</p>
        <div className="admin-notify-row">
          <select
            value={notifyUserId}
            onChange={(e) => setNotifyUserId(e.target.value)}
            aria-label="Select user"
          >
            <option value="">— Select user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.phone} {u.name ? `— ${u.name}` : ''}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            placeholder="Message"
          />
          <button type="button" className="btn-primary" disabled={notifyBusy} onClick={sendNotification}>
            {notifyBusy ? 'Sending…' : 'Send'}
          </button>
        </div>
      </section>

      <div className="admin-columns">
        <section className="admin-user-list">
          <h2>Incomplete profiles ({incomplete.length})</h2>
          <ul>
            {incomplete.map((u) => (
              <li key={u.id}>
                <button type="button" className="admin-user-link" onClick={() => openUser(u.id)}>
                  {u.phone} {u.name || '—'}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-user-list">
          <h2>Complete profiles ({complete.length})</h2>
          <ul>
            {complete.map((u) => (
              <li key={u.id}>
                <button type="button" className="admin-user-link" onClick={() => openUser(u.id)}>
                  {u.phone} {u.name || '—'} · ₹{Number(u.total_paid || 0).toLocaleString('en-IN')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {detail ? (
        <div className="admin-detail-overlay" role="dialog" aria-modal>
          <div className="admin-detail-card">
            <button type="button" className="admin-detail-close" onClick={() => setDetail(null)} aria-label="Close">
              ×
            </button>
            <h2>User #{detail.id}</h2>
            <p>
              <strong>Phone:</strong> {detail.phone}
            </p>
            <p>
              <strong>Name:</strong> {detail.name || '—'}
            </p>
            <p>
              <strong>Email:</strong> {detail.email || '—'}
            </p>
            <p>
              <strong>Profile complete:</strong> {detail.profile_complete ? 'Yes' : 'No'}
            </p>
            <h3>Payments</h3>
            <ul>
              {(detail.payments || []).map((p) => (
                <li key={p.razorpay_payment_id}>
                  {p.invoice_number ? `${p.invoice_number} · ` : ''}₹{p.amount} — {p.razorpay_payment_id} —{' '}
                  {p.payment_date ? new Date(p.payment_date).toLocaleString() : ''}
                </li>
              ))}
            </ul>
            {detail.payments?.length === 0 ? <p>No payments</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
