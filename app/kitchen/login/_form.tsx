import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm(): JSX.Element {
  return (
    <>
      <form id="kitchen-login-form" noValidate className="flex flex-col gap-6">
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          label="Username"
        />
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          label="Password"
        />
        <p
          id="login-error"
          role="alert"
          style={{ display: "none" }}
          className="text-[13px] leading-[18px] text-status-cancelled"
        />
        <Button id="login-submit" type="submit" variant="primary" size="md">
          Sign In
        </Button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('kitchen-login-form');
  var errEl = document.getElementById('login-error');
  var btn = document.getElementById('login-submit');
  if (!form || !btn) return;

  function showError(msg) {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    btn.removeAttribute('disabled');
    btn.textContent = 'Sign In';
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (errEl) errEl.style.display = 'none';
    btn.setAttribute('disabled', 'true');
    btn.textContent = 'Signing in…';

    var usernameEl = document.getElementById('username') || form.querySelector('input[name=username]');
    var passwordEl = document.getElementById('password') || form.querySelector('input[name=password]');
    var username = (usernameEl || {}).value || '';
    var password = (passwordEl || {}).value || '';

    function readCsrfToken() {
      var m = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    }
    var csrfToken = readCsrfToken();

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ username: username, password: password }),
    })
    .then(function(res) { return res.json().then(function(b) { return { ok: res.ok, body: b }; }); })
    .then(function(r) {
      if (!r.ok && r.body && r.body.error && r.body.error.code === 'RATE_LIMITED') {
        showError(r.body.error.message || 'Too many login attempts. Please try again later.');
        return;
      }
      if (!r.ok || !r.body || !r.body.data || !Array.isArray(r.body.data.allowedAreas)) {
        showError('Incorrect username or password.');
        return;
      }
      var areas = r.body.data.allowedAreas;
      var map = {
        'admin': '/admin',
        'kitchen': '/kitchen',
        'table-service': '/staff/table',
        'room-service': '/staff/room',
        'housekeeping': '/staff/housekeeping',
        'maintenance': '/staff/maintenance',
        'concierge': '/staff/concierge',
        'laundry': '/staff/laundry',
        'spa': '/staff/spa',
        'front-desk': '/staff/front-desk',
      };
      var first = areas[0];
      var target = map[first];
      if (!target) { showError('No area available for this account.'); return; }

      // Hard reload to ensure cookies are applied before middleware runs
      window.location.href = target;
    })
    .catch(function() { showError('Network error. Please try again.'); });
  });
})();
`,
        }}
      />
    </>
  );
}
