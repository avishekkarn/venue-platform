import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { RequestFormField } from "@/components/guest/request-form-field";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Service Details",
  robots: {
    index: false,
  },
};

const WHEN_OPTIONS = [
  { value: "As soon as possible", label: "As soon as possible" },
  { value: "In the next hour", label: "In the next hour" },
  { value: "This afternoon", label: "This afternoon" },
  { value: "Custom time", label: "Custom time" },
];

export default async function CustomServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
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
          We couldn&apos;t load the venue.
        </p>
      </div>
    );
  }

  // Look up service item by id or normalized name
  const serviceItem = await prisma.serviceItem.findFirst({
    where: {
      venueId: venue.value.id,
      state: MenuItemState.AVAILABLE,
      OR: [
        { id: id },
        { name: { equals: id, mode: "insensitive" } },
        { name: { equals: id.replace(/-/g, " "), mode: "insensitive" } },
      ],
    },
  });

  if (!serviceItem) {
    notFound();
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

  const currency = venue.value.currency || "NPR";
  const priceLabel =
    serviceItem.price.toFixed(2) === "0.00"
      ? "Complimentary"
      : formatMoney(serviceItem.price.toFixed(2), currency);

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
              {serviceItem.name}
            </h1>
            <p className="text-sm text-guest-text-secondary mt-1">
              {venue.value.name}
              {placeContext ? ` · ${placeContext}` : ""}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-guest-brand/10 text-guest-brand border border-guest-brand/20">
                {priceLabel}
              </span>
              {serviceItem.estimatedMinutes ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-guest-surface-sunken text-guest-text-secondary border border-guest-border-subtle">
                  ~{serviceItem.estimatedMinutes} min
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {serviceItem.photoUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-guest-border-subtle shadow-sm">
            <Image
              src={serviceItem.photoUrl}
              alt={serviceItem.name}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              placeholder={serviceItem.photoBlurData ? "blur" : "empty"}
              blurDataURL={serviceItem.photoBlurData ?? undefined}
            />
          </div>
        ) : null}

        {serviceItem.description ? (
          <div className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-4 text-sm text-guest-text-secondary leading-relaxed">
            {serviceItem.description}
          </div>
        ) : null}

        {/* Success confirmation container (initially hidden) */}
        <div
          id="custom-service-success"
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
              We have your request for {serviceItem.name}. Our staff will assist you shortly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3 w-full justify-center">
            <Link
              href="/requests"
              className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all shadow-sm"
            >
              Track request status →
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium border border-guest-border-strong text-guest-text-primary hover:bg-guest-surface-sunken transition-all"
            >
              Back to services
            </Link>
          </div>
        </div>

        {/* Form container */}
        <form
          id="custom-service-form"
          className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-5 md:p-6 flex flex-col gap-5"
          noValidate
        >
          <div id="form-error-banner" style={{ display: "none" }} className="p-3 rounded-md bg-red-50 border border-red-200 text-status-cancelled text-sm" role="alert" />

          <RequestFormField
            name="when"
            label="When would you like this?"
            type="single-select"
            required={true}
            options={WHEN_OPTIONS}
            defaultValue="As soon as possible"
          />

          <div id="custom-time-container" style={{ display: "none" }}>
            <RequestFormField
              name="customTime"
              label="Preferred time"
              type="time"
              helperText="Let us know what time works best."
            />
          </div>

          <RequestFormField
            name="notes"
            label="Special instructions or requests"
            type="textarea"
            placeholder={`Tell us any details about your ${serviceItem.name} request...`}
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
  var form = document.getElementById('custom-service-form');
  var successContainer = document.getElementById('custom-service-success');
  var errorBanner = document.getElementById('form-error-banner');
  var submitBtn = document.getElementById('submit-btn');
  var customTimeContainer = document.getElementById('custom-time-container');

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

  function getCsrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  if (form) {
    var whenInputs = form.querySelectorAll('input[name="when"]');
    whenInputs.forEach(function(input) {
      input.addEventListener('change', function() {
        if (customTimeContainer) {
          customTimeContainer.style.display = this.value === 'Custom time' ? 'block' : 'none';
        }
      });
    });

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearError();

      var whenEl = form.querySelector('input[name="when"]:checked');
      var whenVal = whenEl ? whenEl.value : 'As soon as possible';

      if (whenVal === 'Custom time') {
        var customTimeEl = document.getElementById('customTime');
        var customTimeVal = customTimeEl ? customTimeEl.value : '';
        if (!customTimeVal) {
          showError('Please select a preferred time.');
          return;
        }
        whenVal = 'At ' + customTimeVal;
      }

      var notesEl = document.getElementById('notes');
      var notesVal = notesEl ? notesEl.value.trim() : '';

      submitBtn.disabled = true;
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';

      try {
        var response = await fetch('/api/guest/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken(),
          },
          body: JSON.stringify({
            serviceType: "CONCIERGE",
            serviceItemId: ${JSON.stringify(serviceItem.id)},
            details: {
              serviceName: ${JSON.stringify(serviceItem.name)},
              when: whenVal,
              notes: notesVal || undefined,
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
