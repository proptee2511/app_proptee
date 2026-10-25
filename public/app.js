const form = document.querySelector('#login-form');
const password = document.querySelector('#password');
const toggle = document.querySelector('#toggle-password');
const message = document.querySelector('#message');
const submit = form.querySelector('[type="submit"]');
const submitContent = submit.innerHTML;
toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.textContent = visible ? 'Hide' : 'Show';
  toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  toggle.setAttribute('aria-pressed', String(visible));
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  message.textContent = '';
  message.className = '';
  submit.disabled = true;
  submit.textContent = 'Signing in…';
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value.trim(), password: password.value }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    message.textContent = data.message || 'Unable to sign in. Please try again.';
    if (response.ok) { message.className = 'success'; password.value = ''; }
  } catch { message.textContent = 'Unable to connect. Please try again.'; }
  finally { submit.disabled = false; submit.innerHTML = submitContent; }
});

