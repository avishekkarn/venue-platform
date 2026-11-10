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
 * Maintenance Request Form Page.
 *
 * Provides a structured guest form for reporting room or facility issues:
 *   - Issue type (single-select chips)
 *   - Urgency level (single-select chips)
 *   - Photo upload (file input, captures filename in details)
 *   - Problem description (textarea)
 *
 * Reference: PRODUCT.md §6.5 (Maintenance service), DESIGN.md §4.6.17.7,
 * DESIGN.md §4.13 (guest voice), D-5.1 (generic request structure).
 */

export const metadata: Metadata = {
  title: "Maintenance",
  robots: {
    index: false,
  },
};

const ISSUE_OPTIONS = [
  { value: "Light", label: "Light" },
  { value: "Air conditioning", label: "Air conditioning" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "TV", label: "TV" },
  { value: "Wifi", label: "Wifi" },
  { value: "Door lock", label: "Door lock" },
  { value: "Other", label: "Other" },
];

const URGENCY_OPTIONS = [
  { value: "Can wait", label: "Can wait" },
  { value: "Soon", label: "Soon" },
  { value: "Urgent", label: "Urgent" },
];

export default async function MaintenancePage(): Promise<JSX.Element> {
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
              Maintenance
            </h1>
            <p className="text-sm text-guest-text-secondary mt-1">
              {venue.value.name}
              {placeContext ? ` · ${placeContext}` : ""}
            </p>
          </div>
        </header>

        {/* Success confirmation container (initially hidden) */}
        <div
          id="maintenance-success"
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
            <p className="text-sm text-guest-text-secondary max-w-sm">
              We have your request. Maintenance will be with you shortly.
            </p>
          </div>
          <Link
            href="/services"
            className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all"
          >
            Back to services
          </Link>
          <Link
            href="/requests"
            className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-guest-border-strong text-guest-text-primary hover:bg-guest-surface-sunken transition-all"
          >
            View request status
          </Link>
        </div>

        {/* Form container */}
        <form
          id="maintenance-form"
          className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-5 md:p-6 flex flex-col gap-5"
          noValidate
        >
          <div id="form-error-banner" style={{ display: "none" }} className="p-3 rounded-md bg-red-50 border border-red-200 text-status-cancelled text-sm" role="alert" />

          <RequestFormField
            name="issue"
            label="What is the issue?"
            type="single-select"
            required={true}
            options={ISSUE_OPTIONS}
            defaultValue="Air conditioning"
          />

          <RequestFormField
            name="urgency"
            label="How urgent is this?"
            type="single-select"
            required={true}
            options={URGENCY_OPTIONS}
            defaultValue="Soon"
          />

          <RequestFormField
            name="description"
            label="Description (optional)"
            type="textarea"
            placeholder="Tell us what is happening..."
          />

          <RequestFormField
            name="photo"
            label="Photo (optional)"
            type="photo"
            helperText="Attach a photo to help our technicians identify the problem."
          />

          <div className="pt-2">
            <Button
              id="submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Send Request
            </Button>
          </div>
        </form>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('maintenance-form');
  var successContainer = document.getElementById('maintenance-success');
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

      // Collect issue
      var issueEl = form.querySelector('input[name="issue"]:checked');
      var issue = issueEl ? issueEl.value : '';

      if (!issue) {
        showError('Please select what the issue is.');
        return;
      }

      // Collect urgency
      var urgencyEl = form.querySelector('input[name="urgency"]:checked');
      var urgency = urgencyEl ? urgencyEl.value : 'Soon';

      // Collect description
      var descEl = document.getElementById('description');
      var description = descEl ? descEl.value.trim() : '';

      // Collect photo filename if selected
      var photoInput = document.getElementById('photo');
      var photoFilename = undefined;
      if (photoInput && photoInput.files && photoInput.files.length > 0) {
        photoFilename = photoInput.files[0].name;
      }

      submitBtn.disabled = true;
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';

      try {
        var response = await fetch('/api/guest/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceType: "MAINTENANCE",
            details: {
              issue: issue,
              urgency: urgency,
              description: description || undefined,
              photoFilename: photoFilename || undefined,
            },
          }),
        });

        if (!response.ok) {
          var errData = await response.json().catch(function() { return {}; });
          var msg = (errData && errData.error && errData.error.message) || 'We could not submit your request. Please try again.';
          showError(msg);
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          return;
        }

        // Show calm inline success state
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

