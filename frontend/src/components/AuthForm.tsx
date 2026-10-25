import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { api } from '../services/api';
import { getPasswordError, passwordHelp } from '../utils/validation';

type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password';
const copy = {
  login: ['Welcome back!', 'Your next opportunity starts here.', 'Sign in'],
  register: ['Make room for more.', 'Create your account. Build better connections.', 'Create account'],
  'forgot-password': ['Forgot your password?', 'We will help you get back to your workspace.', 'Request reset link'],
  'reset-password': ['A fresh start.', 'Choose a new password to keep your account safe.', 'Update password'],
};
export default function AuthForm({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  useEffect(() => { if (mode === 'reset-password' && window.location.hash) navigate('/reset-password', { replace: true }); }, [mode, navigate]);
  const confirmation = mode === 'register' || mode === 'reset-password';
  const hasPassword = mode !== 'forgot-password';
  const [title, description, action] = copy[mode];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setMessage(''); setSuccess(false); setResetUrl('');
    if (confirmation) {
      const error = getPasswordError(fields.password, fields.confirmPassword);
      if (error) return setMessage(error);
    }
    if (mode === 'register' && fields.name.trim().length < 2) return setMessage('Enter your full name.');
    setBusy(true);
    try {
      const result = await api<{ message: string; resetUrl?: string }>(mode, { ...fields, ...(mode === 'reset-password' ? { token } : {}) });
      if (mode === 'login') return navigate('/dashboard', { replace: true });
      setMessage(result.message); setSuccess(true);
      if (result.resetUrl) setResetUrl(result.resetUrl);
      form.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }
  return <AuthLayout title={title} description={description} className={mode === 'login' ? 'login-theme' : undefined}>
    {mode === 'reset-password' && !token ? <p className="message error" role="alert">Reset link missing. <Link to="/forgot-password">Request a new link</Link>.</p> : <form onSubmit={submit}>
      <fieldset disabled={busy}>
        {mode === 'register' && <div className="field-row"><div><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={100} required /></div><div><label htmlFor="phone">Mobile number</label><input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" pattern="[6-9][0-9]{9}" title="10-digit Indian mobile starting with 6–9" maxLength={10} required /></div></div>}
        {mode !== 'reset-password' && <><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete={mode === 'login' ? 'username' : 'email'} placeholder="you@example.com" maxLength={254} required /></>}
        {hasPassword && <><label htmlFor="password">{mode === 'reset-password' ? 'New password' : 'Password'}</label><div className="password-field"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" minLength={confirmation ? 8 : undefined} maxLength={128} aria-describedby={confirmation ? 'password-help' : undefined} required /><button className="password-toggle" type="button" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button></div></>}
        {confirmation && <><p className="hint" id="password-help">{passwordHelp}</p><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} maxLength={128} required /></>}
        {mode === 'login' && <p className="reset-link"><Link to="/forgot-password">Reset password</Link></p>}
        <button className="primary-button" type="submit">{busy ? 'Please wait…' : <>{action}<span aria-hidden="true"> →</span></>}</button>
      </fieldset>
      <p className={`message ${success ? 'success' : 'error'}`} role="status" aria-live="polite">{message}</p>
      {resetUrl && <div className="dev-note"><strong>Local development only</strong><p>No email was sent. This link expires in 15 minutes.</p><Link to={new URL(resetUrl).pathname + new URL(resetUrl).hash}>Open password reset →</Link></div>}
      {success && confirmation && <p className="account-links"><Link to="/login">Continue to sign in →</Link></p>}
    </form>}
    <p className="account-links">{mode === 'login' ? <>New to Property CRM? <Link to="/register">Create account</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}</p>
    <p className="form-footer">Properties. People. Possibilities.</p>
  </AuthLayout>;
}
