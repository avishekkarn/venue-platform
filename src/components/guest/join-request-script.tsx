import type { JSX } from "react";

/*
 * JOIN BANNER XSS CONTRACT (task 7.6.8, decisions D-19.1 and D-19.2)
 *
 * This script sets every dynamic string via textContent, not innerHTML.
 * textContent does not parse HTML; a name with HTML tags renders as literal
 * text on the screen and does not execute. The only innerHTML assignment in
 * the injected script is the static icon SVG (a hard-coded string with no
 * user data).
 *
 * req.name reaches the DOM via:
 *   title.textContent = req.name + ' wants to join';
 *
 * That is safe by construction. Do not change it to innerHTML.
 *
 * The same guarantee applies to subtitle.textContent,
 * declineBtn.textContent, and approveBtn.textContent. None of those
 * insert user-supplied text; the two button labels are fixed strings.
 *
 * A future session that changes any of these to innerHTML re-opens the
 * XSS surface and must add an escapeHtml(str) function first. Do not do it.
 */
export function JoinRequestScript(): JSX.Element {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  var BANNER_ID = 'host-join-request-banner';
  var inFlightAction = false;

  function getCsrfToken() {
    // The CSRF cookie (D-20.1) is NOT HttpOnly, so the client can read it.
    // Server source of truth: src/infrastructure/csrf/cookies.ts
    // Cookie name is 'csrf_token'; header name is 'X-CSRF-Token'.
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function removeBanner() {
    var b = document.getElementById(BANNER_ID);
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function handleAction(requestId, action) {
    if (inFlightAction) return;
    inFlightAction = true;
    fetch('/api/guest/join-requests/' + encodeURIComponent(requestId) + '/' + action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      }
    })
    .then(function() {
      inFlightAction = false;
      removeBanner();
    })
    .catch(function() {
      inFlightAction = false;
    });
  }

  function renderBanner(req) {
    var existing = document.getElementById(BANNER_ID);
    if (existing) {
      if (existing.getAttribute('data-request-id') === req.id) return;
      removeBanner();
    }

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.setAttribute('data-request-id', req.id);
    banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[440px] bg-guest-surface-raised border border-guest-border-strong shadow-2xl rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300';

    var headerRow = document.createElement('div');
    headerRow.className = 'flex items-center gap-3';

    var iconWrapper = document.createElement('div');
    iconWrapper.className = 'size-9 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center shrink-0';
    iconWrapper.innerHTML = '<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

    var textCol = document.createElement('div');
    textCol.className = 'flex-1 min-w-0';

    var title = document.createElement('p');
    title.className = 'text-sm font-semibold text-guest-text-primary leading-tight truncate';
    title.textContent = req.name + ' wants to join';

    var subtitle = document.createElement('p');
    subtitle.className = 'text-xs text-guest-text-secondary mt-0.5';
    subtitle.textContent = 'Allow this device to join your session and order.';

    textCol.appendChild(title);
    textCol.appendChild(subtitle);
    headerRow.appendChild(iconWrapper);
    headerRow.appendChild(textCol);

    var btnRow = document.createElement('div');
    btnRow.className = 'flex items-center gap-2.5 pt-1';

    var declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'h-9 px-4 rounded-md border border-guest-border-strong text-guest-text-secondary text-xs font-medium hover:bg-guest-surface-sunken transition-all outline-none';
    declineBtn.textContent = 'Decline';
    declineBtn.addEventListener('click', function() {
      declineBtn.disabled = true;
      declineBtn.textContent = 'Declining…';
      handleAction(req.id, 'decline');
    });

    var approveBtn = document.createElement('button');
    approveBtn.type = 'button';
    approveBtn.className = 'flex-1 h-9 rounded-md bg-guest-brand text-guest-brand-contrast text-xs font-semibold hover:brightness-95 transition-all outline-none';
    approveBtn.textContent = 'Approve';
    approveBtn.addEventListener('click', function() {
      approveBtn.disabled = true;
      approveBtn.textContent = 'Approving…';
      handleAction(req.id, 'approve');
    });

    btnRow.appendChild(declineBtn);
    btnRow.appendChild(approveBtn);
    banner.appendChild(headerRow);
    banner.appendChild(btnRow);
    document.body.appendChild(banner);
  }

  function pollJoinRequests() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/join-requests')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(result) {
        if (!result || !Array.isArray(result.data)) {
          removeBanner();
          return;
        }
        var requests = result.data;
        if (requests.length === 0) {
          removeBanner();
          return;
        }
        renderBanner(requests[0]);
      })
      .catch(function() {});
  }

  setInterval(pollJoinRequests, 5000);
  pollJoinRequests();
})();
`,
      }}
    />
  );
}
