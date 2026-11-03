import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { RequestFormField } from "@/components/guest/request-form-field";
import { Button } from "@/components/ui/button";

/**
 * Do Not Disturb Request Form Page.
 *
 * Provides a guest toggle request for Do Not Disturb:
 *   - State ("On" | "Off" single-select chips)
 *   - Additional notes (textarea)
 *
 * Reference: PRODUCT.md §6.11, DESIGN.md §4.6.17.7,
 * DESIGN.md §4.13.1 (guest voice), D-5.1 (generic request structure).
 */

export const metadata: Metadata = {
  title: "Do Not Disturb",
  robots: {
    index: false,
  },
};

const DND_OPTIONS = [
  { value: "On", label: "On" },
  { value: "Off", label: "Off" },
];

export default async function DoNotDisturbPage(): Promise<JSX.Element> {
  const cookie = await getGuestCookie();
  if (!cookie) {
    redirect("/");
  }

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const session = await getGuestSession({ repo: guestRepo }, cookie);
  if (!session.ok) {
    redirect("/");
  }

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venue.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-base text-guest-text-muted">
          We couldn't load the venue.
        </p>
      </div>
    );
  }

  let placeContext: string | null = null;
  if (session.value.placeType === PlaceType.ROOM) {
    const room = await prisma.room.findUnique({
      where: { id: session.value.placeId },
    });
    if (room) {
      placeContext = `Room ${room.number}`;
    }
  } else if (session.value.placeType === PlaceType.TABLE) {
    const table = await prisma.table.findUnique({
      where: { id: session.value.placeId },
    });
    if (table) {
      placeContext = `Table ${table.number}`;
    }
  }

  return (
    <main data-world="guest" className="min-h-dvh bg-guest-surface text-guest-text-primary px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-guest-text-secondary hover:text-guest-text-primary transition-colors w-fit focus-visible:outline-none"
            aria-label="Back to services"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </Link>
          <div className="mt-2">
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Do Not Disturb
            </h1>
            <p className="text-sm text-guest-text-secondary mt-1">
              {venue.value.name}
              {placeContext ? ` · ${placeContext}` : ""}
            </p>
          </div>
        </header>

        {/* Success confirmation container (initially hidden) */}
        <div
          id="dnd-success"
          style={{ display: "none" }}
          className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-6 text-center flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold text-guest-text-primary">
              Request Received
            </h2>
            <p id="dnd-success-message" className="text-sm text-guest-text-secondary max-w-sm">
              We have your request. Housekeeping will skip your room while Do Not Disturb is on.
            </p>
          </div>
          <Link
            href="/services"
            className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all"
          >
            Back to services
          </Link>
        </div>

        {/* Form container */}
        <form
          id="dnd-form"
          className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-5 md:p-6 flex flex-col gap-5"
          noValidate
        >
          <div id="form-error-banner" style={{ display: "none" }} className="p-3 rounded-md bg-red-50 border border-red-200 text-status-cancelled text-sm" role="alert" />

          <RequestFormField
            name="state"
            label="Do Not Disturb state"
            type="single-select"
            required={true}
            options={DND_OPTIONS}
            defaultValue="On"
          />

          <RequestFormField
            name="notes"
            label="Additional instructions (optional)"
            type="textarea"
            placeholder="Duration, or a specific request."
          />

          <div className="pt-2">
            <Button
              id="submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Update Do Not Disturb
            </Button>
          </div>
        </form>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('dnd-form');
  var successContainer = document.getElementById('dnd-success');
  var successMessage = document.getElementById('dnd-success-message');
  var errorBanner = document.getElementById('form-error-banner');
  var submitBtn = document.getElementById('submit-btn');

  function showError(msg) {
    if (!errorBanner) return;
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
  }

  function clearError() {
    if (!errorBanner) return;
    errorBanner.textContent = '';
    errorBanner.style.display = 'none';
  }

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearError();

      // Collect state
      var stateEl = form.querySelector('input[name="state"]:checked');
      var stateVal = stateEl ? stateEl.value : 'On';

      // Collect notes
      var notesEl = document.getElementById('notes');
      var notesVal = notesEl ? notesEl.value.trim() : '';

      submitBtn.disabled = true;
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Updating…';

      try {
        var response = await fetch('/api/guest/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceType: "DO_NOT_DISTURB",
            details: {
              state: stateVal,
              notes: notesVal || undefined,
            },
          }),
        });

        if (!response.ok) {
          var errData = await response.json().catch(function() { return {}; });
          var msg = (errData && errData.error && errData.error.message) || 'We could not update Do Not Disturb. Please try again.';
          showError(msg);
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          return;
        }

        if (successMessage) {
          if (stateVal === 'Off') {
            successMessage.textContent = 'We have your request. Housekeeping may enter your room again.';
          } else {
            successMessage.textContent = 'We have your request. Housekeeping will skip your room while Do Not Disturb is on.';
          }
        }

        form.style.display = 'none';
        successContainer.style.display = 'flex';
      } catch (err) {
        showError('Network error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
})();
`,
        }}
      />
    </main>
  );
}

