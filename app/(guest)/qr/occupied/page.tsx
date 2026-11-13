import type { Metadata } from "next";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";

export const metadata: Metadata = {
  title: "Table Active",
  robots: {
    index: false,
  },
};

interface OccupiedPageProps {
  searchParams: Promise<{
    token?: string;
    sessionId?: string;
  }>;
}

export default async function OccupiedPage({
  searchParams,
}: OccupiedPageProps): Promise<JSX.Element> {
  const { token = "", sessionId = "" } = await searchParams;

  let session = null;
  if (sessionId) {
    session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });
  } else if (token) {
    const qrToken = await prisma.qrToken.findUnique({
      where: { token },
      include: { guestSessions: { where: { endedAt: null }, take: 1 } },
    });
    session = qrToken?.guestSessions[0] ?? null;
  }

  let place = "table";
  if (session?.placeType === PlaceType.ROOM) {
    place = "room";
  } else if (session?.placeType === PlaceType.COUNTER) {
    place = "counter";
  } else if (session?.placeType === PlaceType.TABLE) {
    place = "table";
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12 bg-guest-surface text-guest-text-primary">
      <div className="w-full max-w-[440px] rounded-xl bg-guest-surface-raised border border-guest-border-subtle p-6 sm:p-8 shadow-sm text-center">
        {/* Loading / Auto-recovery State */}
        <div id="recovering-state" className="py-6 space-y-4">
          <div className="mx-auto size-10 rounded-full bg-guest-surface-sunken flex items-center justify-center text-guest-brand animate-spin">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <p className="text-sm font-medium text-guest-text-primary">
            Checking host session…
          </p>
        </div>

        {/* Occupied Form Content */}
        <div id="occupied-content" style={{ display: "none" }}>
          <div className="mx-auto mb-4 size-12 rounded-full bg-guest-surface-sunken flex items-center justify-center text-guest-brand">
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h1 className="font-display text-[24px] leading-[32px] text-guest-text-primary">
            This {place} is active on another device
          </h1>
          <p className="mt-2 text-sm text-guest-text-secondary leading-relaxed">
            Someone has already started a session at this {place}. Enter your name
            to request access from the host.
          </p>

          <form id="join-request-form" className="mt-6 flex flex-col gap-4 text-left">
            <Input
              id="guest-name"
              name="name"
              type="text"
              required
              label="Your Name"
              placeholder="e.g. Alex"
              autoComplete="name"
              autoFocus
            />

            <p
              id="join-error"
              role="alert"
              style={{ display: "none" }}
              className="text-xs text-status-cancelled"
            />

            <Button
              id="btn-join-submit"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
            >
              Request Access
            </Button>
          </form>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var content = document.getElementById('occupied-content');
  var recoveringState = document.getElementById('recovering-state');
  var form = document.getElementById('join-request-form');
  var nameInput = document.getElementById('guest-name');
  var errorEl = document.getElementById('join-error');
  var submitBtn = document.getElementById('btn-join-submit');
  var token = ${JSON.stringify(token)};
  var sessionId = ${JSON.stringify(sessionId)};

  function getCsrfToken() {
    // The CSRF cookie (D-20.1) is NOT HttpOnly, so the client can read it.
    // Server source of truth: src/infrastructure/csrf/cookies.ts
    // Cookie name is 'csrf_token'; header name is 'X-CSRF-Token'.
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function showForm() {
    if (recoveringState) recoveringState.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  // Automatic Host Recovery via localStorage
  var hostToken = null;
  try {
    hostToken = sessionId ? localStorage.getItem('host_token_' + sessionId) : null;
  } catch (e) {}

  if (hostToken && sessionId) {
    fetch('/api/guest/join-requests/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify({
        sessionId: sessionId,
        hostToken: hostToken
      })
    })
    .then(function(res) {
      if (res.ok) {
        return res.json().then(function(b) {
          if (b && b.data && b.data.sessionToken) {
            document.cookie = 'venue_guest=' + encodeURIComponent(b.data.sessionToken) + '; path=/; max-age=' + (60 * 60 * 24 * 30) + '; SameSite=Lax';
          }
          window.location.href = '/menu';
        });
      }
      showForm();
    })
    .catch(function() {
      showForm();
    });
  } else {
    showForm();
  }

  if (!form || !submitBtn) return;

  function getOrCreateDeviceId() {
    var id = null;
    try {
      id = localStorage.getItem('guest_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now();
        localStorage.setItem('guest_device_id', id);
      }
    } catch (e) {
      id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now();
    }
    return id;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';

    var name = (nameInput && nameInput.value ? nameInput.value : '').trim();
    if (!name) {
      if (errorEl) {
        errorEl.textContent = 'Please enter your name.';
        errorEl.style.display = 'block';
      }
      return;
    }

    var deviceId = getOrCreateDeviceId();
    submitBtn.setAttribute('disabled', 'true');
    submitBtn.textContent = 'Requesting…';

    fetch('/api/guest/join-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify({
        name: name,
        sessionId: sessionId,
        deviceId: deviceId
      })
    })
    .then(function(res) {
      return res.json().then(function(b) {
        return { ok: res.ok, body: b };
      });
    })
    .then(function(r) {
      if (!r.ok) {
        var msg = (r.body && r.body.error && r.body.error.message) || 'Failed to send request.';
        if (errorEl) {
          errorEl.textContent = msg;
          errorEl.style.display = 'block';
        }
        submitBtn.removeAttribute('disabled');
        submitBtn.textContent = 'Request Access';
        return;
      }

      var target = '/qr/join/' + encodeURIComponent(token) + '?deviceId=' + encodeURIComponent(deviceId) + '&sessionId=' + encodeURIComponent(sessionId);
      window.location.href = target;
    })
    .catch(function() {
      if (errorEl) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
      }
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'Request Access';
    });
  });
})();
`,
        }}
      />
    </main>
  );
}
