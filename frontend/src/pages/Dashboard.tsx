import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../services/api';
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { let active = true; api<{ user: User }>('me').then(data => { if (active) setUser(data.user); }).catch(() => { if (active) navigate('/login', { replace: true }); }); return () => { active = false; }; }, [navigate]);
  async function logout() { setBusy(true); try { await api('logout', {}); navigate('/login', { replace: true }); } catch { setError('Unable to sign out. Please try again.'); } finally { setBusy(false); } }
  if (!user) return <p role="status">Loading your workspace…</p>;
  return <main className="dashboard"><header><Link className="brand" to="/dashboard">Property<span>CRM</span></Link><button disabled={busy} onClick={logout}>{busy ? 'Signing out…' : 'Sign out'}</button></header><p className="eyebrow">YOUR WORKSPACE</p><h1>Welcome, {user.name.split(' ')[0]}.</h1><p className="description">Your account is ready. Let's build your next opportunity.</p><div className="dashboard-grid">{[['Properties', 'Organize your portfolio'], ['Leads', 'Build better connections'], ['Follow-ups', 'Stay a step ahead']].map(([title, text]) => <article key={title}><span className="coming-soon">COMING NEXT</span><h2>{title}</h2><p>{text}</p><small>This module has not been implemented yet.</small></article>)}</div><section className="profile"><h2>Account details</h2><dl><dt>Name</dt><dd>{user.name}</dd><dt>Email</dt><dd>{user.email}</dd><dt>Mobile</dt><dd>{user.phone}</dd></dl></section>{error && <p role="alert">{error}</p>}</main>;
}
