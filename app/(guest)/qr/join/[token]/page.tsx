import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";

export const metadata: Metadata = {
  title: "Waiting for Approval",
  robots: {
    index: false,
  },
};

interface JoinPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    deviceId?: string;
    sessionId?: string;
  }>;
}

export default async function JoinWaitingPage({
  params,
  searchParams,
}: JoinPageProps): Promise<JSX.Element> {
  const { token } = await params;
  const { deviceId = "", sessionId = "" } = await searchParams;

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
        {/* Waiting State */}
        <div id="join-waiting-state" className="space-y-4">
          <div className="mx-auto size-12 rounded-full bg-guest-surface-sunken flex items-center justify-center text-guest-brand animate-pulse">
            <svg
              className="size-6 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>

          <h1 className="font-display text-[22px] leading-[28px] text-guest-text-primary">
            Waiting for host approval
          </h1>
          <p className="text-sm text-guest-text-secondary leading-relaxed">
            We notified the {place} host. Once they approve your request, you will
            join this session automatically.
          </p>
        </div>

        {/* Approved State */}
        <div id="join-approved-state" style={{ display: "none" }} className="space-y-4">
          <div className="mx-auto size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-display text-[22px] leading-[28px] text-guest-text-primary">
            Request Approved!
          </h1>
          <p className="text-sm text-guest-text-secondary">
            Entering the session…
          </p>
        </div>

        {/* Declined State */}
        <div id="join-declined-state" style={{ display: "none" }} className="space-y-4">
          <div className="mx-auto size-12 rounded-full bg-red-100 dark:bg-red-950 text-status-cancelled flex items-center justify-center">
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="font-display text-[22px] leading-[28px] text-guest-text-primary">
            Request Declined
          </h1>
          <p className="text-sm text-guest-text-secondary leading-relaxed">
            Your request to join this {place} was declined by the host.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-guest-border-strong text-guest-text-primary text-sm font-medium hover:bg-guest-surface-sunken transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var sessionId = ${JSON.stringify(sessionId)};
  var deviceId = ${JSON.stringify(deviceId)};
  var token = ${JSON.stringify(token)};
  var pollInterval = null;

  var waitingState = document.getElementById('join-waiting-state');
  var approvedState = document.getElementById('join-approved-state');
  var declinedState = document.getElementById('join-declined-state');

  if (!sessionId || !deviceId) return;

  function checkStatus() {
    fetch('/api/guest/join-requests/status?sessionId=' + encodeURIComponent(sessionId) + '&deviceId=' + encodeURIComponent(deviceId))
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(result) {
        if (!result || !result.data) return;
        var data = result.data;
        if (data.status === 'APPROVED') {
          if (pollInterval) clearInterval(pollInterval);
          if (waitingState) waitingState.style.display = 'none';
          if (approvedState) approvedState.style.display = 'block';

          if (data.sessionToken) {
            document.cookie = 'venue_guest=' + encodeURIComponent(data.sessionToken) + '; path=/; max-age=' + (60 * 60 * 24 * 30) + '; SameSite=Lax';
          }

          setTimeout(function() {
            window.location.href = '/menu';
          }, 800);
        } else if (data.status === 'REJECTED') {
          if (pollInterval) clearInterval(pollInterval);
          if (waitingState) waitingState.style.display = 'none';
          if (declinedState) declinedState.style.display = 'block';
        }
      })
      .catch(function() {});
  }

  checkStatus();
  pollInterval = setInterval(checkStatus, 3000);
})();
`,
        }}
      />
    </main>
  );
}

