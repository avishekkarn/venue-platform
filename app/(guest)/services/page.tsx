import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaServiceRepository } from "@/infrastructure/db/repositories/service.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { GuestHero } from "@/components/guest/hero";
import { JoinRequestScript } from "@/components/guest/join-request-script";
import { Button } from "@/components/ui/button";
import { PhoneCall, Clock, X, Receipt } from "lucide-react";
import { ServiceList } from "./_service-list";

export const metadata: Metadata = {
  title: "Services",
  robots: {
    index: false,
  },
};

export default async function ServicesPage(): Promise<JSX.Element> {
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
  const venue = await venueRepo.findBySlug(getVenueSlug());
  if (!venue.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-base text-guest-text-muted">
          We couldn&apos;t load the venue.
        </p>
      </div>
    );
  }

  let placeContext: string | null = null;
  if (session.value.placeType === PlaceType.TABLE) {
    const table = await prisma.table.findUnique({
      where: { id: session.value.placeId },
    });
    if (table) {
      placeContext = `Table ${table.number}`;
    }
  } else if (session.value.placeType === PlaceType.ROOM) {
    const room = await prisma.room.findUnique({
      where: { id: session.value.placeId },
    });
    if (room) {
      placeContext = `Room ${room.number}`;
    }
  }

  const serviceRepo = createPrismaServiceRepository(prisma);
  const catalogResult = await serviceRepo.getFullServiceCatalog(venue.value.id);
  const fullCatalog = catalogResult.ok ? catalogResult.value : [];
  const categories = fullCatalog
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => i.state === MenuItemState.AVAILABLE),
    }))
    .filter((c) => c.items.length > 0);

  const currency = venue.value.currency || "NPR";
  const initialSignature = categories
    .map(
      (cat) =>
        `${cat.id}:${cat.items.map((it) => `${it.id}:${it.state}:${it.price}`).join(",")}`
    )
    .join("|");

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)]">
      <GuestHero venue={venue.value} placeContext={placeContext} />
      <div className="mt-4 flex justify-center animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <Button size="xl" variant="primary">
          Explore Services
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap px-4 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <button
          type="button"
          id="btn-call-front-desk"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5 text-guest-brand" />
          <span>Call Front Desk</span>
        </button>

        <button
          type="button"
          id="btn-request-bill-services"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <Receipt className="w-3.5 h-3.5 text-guest-brand" />
          <span>Request Bill</span>
        </button>

        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <Clock className="w-3.5 h-3.5 text-guest-brand" />
          <span>View Requests</span>
        </Link>
      </div>

      {/* Bill Folio Modal */}
      <div
        id="bill-folio-modal-services"
        style={{ display: "none" }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-folio-services-title"
      >
        <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-guest-surface-raised border border-guest-border-subtle p-5 sm:p-6 shadow-xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto">
          <button
            type="button"
            id="close-bill-modal-services"
            className="absolute top-4 right-4 p-1.5 rounded-full text-guest-text-muted hover:text-guest-text-primary hover:bg-guest-surface-sunken transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 id="bill-folio-services-title" className="font-display text-lg font-semibold text-guest-text-primary">
                Current Bill Summary
              </h3>
              <p id="bill-folio-services-place" className="text-xs text-guest-text-secondary">
                {venue.value.name}
                {placeContext ? ` · ${placeContext}` : ""}
              </p>
            </div>
          </div>

          <div
            id="bill-status-banner-services"
            className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium text-center"
          >
            ✓ Bill requested! A staff member is preparing your printed receipt.
          </div>

          <div id="bill-folio-content-services" className="flex flex-col gap-3 divide-y divide-guest-border-subtle/60 text-sm">
            <div className="text-center py-4 text-xs text-guest-text-muted">
              Loading bill details…
            </div>
          </div>

          <div className="pt-2 border-t border-guest-border-subtle flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-guest-text-secondary">
              <span>Subtotal</span>
              <span id="bill-subtotal-services" className="font-medium text-guest-text-primary">0.00</span>
            </div>
            <div className="flex justify-between text-xs text-guest-text-secondary">
              <span>Tax</span>
              <span id="bill-tax-services" className="font-medium text-guest-text-primary">0.00</span>
            </div>
            <div className="flex justify-between text-base font-bold text-guest-text-primary pt-1 border-t border-guest-border-subtle/60">
              <span>Grand Total</span>
              <span id="bill-grand-total-services" className="text-guest-brand">0.00</span>
            </div>
          </div>

          <button
            type="button"
            id="dismiss-bill-btn-services"
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold bg-guest-surface-sunken border border-guest-border-subtle text-guest-text-primary hover:bg-guest-surface-raised transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Front desk dialer modal */}
      <div
        id="front-desk-modal"
        style={{ display: "none" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="front-desk-modal-title"
      >
        <div className="relative w-full max-w-sm rounded-2xl bg-guest-surface-raised border border-guest-border-subtle p-6 shadow-xl flex flex-col items-center text-center gap-4">
          <button
            type="button"
            id="close-front-desk-modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-guest-text-muted hover:text-guest-text-primary hover:bg-guest-surface-sunken transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 id="front-desk-modal-title" className="font-display text-lg font-semibold text-guest-text-primary">
              Front Desk Assistance
            </h3>
            <p className="text-xs text-guest-text-secondary">
              Our front desk team is on duty 24/7 to assist with any request or inquiry.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 pt-2">
            <a
              href="tel:+97714200000"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial Now (+977 1-4200000)</span>
            </a>
            <div className="rounded-lg bg-guest-surface-sunken border border-guest-border-subtle/50 p-2.5 text-xs text-guest-text-secondary">
              From your in-room telephone: <span className="font-semibold text-guest-text-primary">Dial 0</span>
            </div>
          </div>
        </div>
      </div>

      {categories.length > 0 ? (
        <ServiceList categories={categories} currency={currency} />
      ) : (
        <div className="mt-6 text-center text-sm text-guest-text-muted">
          No services are currently available.
        </div>
      )}

      <div className="mt-8 max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
        <div className="flex flex-row items-start justify-center gap-4 md:gap-8 text-center">
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              1.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Choose a service.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              2.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Tell us what you need.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              3.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              We take care of it.
            </span>
          </div>
        </div>
      </div>
      <footer className="mt-6 mb-4 text-center text-xs text-guest-text-muted">
        <p className="font-display text-guest-text-secondary">{venue.value.name}</p>
        <p className="mt-1 text-[10px]">Open daily. Powered by IronMan.</p>
      </footer>
      <JoinRequestScript />

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var currentSignature = ${JSON.stringify(initialSignature)};
  var lastReloadTime = 0;

  var openModalBtn = document.getElementById('btn-call-front-desk');
  var closeModalBtn = document.getElementById('close-front-desk-modal');
  var frontDeskModal = document.getElementById('front-desk-modal');

  if (openModalBtn && frontDeskModal) {
    openModalBtn.addEventListener('click', function() {
      frontDeskModal.style.display = 'flex';
    });
  }
  if (closeModalBtn && frontDeskModal) {
    closeModalBtn.addEventListener('click', function() {
      frontDeskModal.style.display = 'none';
    });
  }
  if (frontDeskModal) {
    frontDeskModal.addEventListener('click', function(e) {
      if (e.target === frontDeskModal) {
        frontDeskModal.style.display = 'none';
      }
    });
  }

  function getCsrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  var billBtnServices = document.getElementById('btn-request-bill-services');
  var billModalServices = document.getElementById('bill-folio-modal-services');
  var closeBillServicesBtn = document.getElementById('close-bill-modal-services');
  var dismissBillServicesBtn = document.getElementById('dismiss-bill-btn-services');

  function closeBillModalServices() {
    if (billModalServices) billModalServices.style.display = 'none';
  }
  if (closeBillServicesBtn) closeBillServicesBtn.addEventListener('click', closeBillModalServices);
  if (dismissBillServicesBtn) dismissBillServicesBtn.addEventListener('click', closeBillModalServices);
  if (billModalServices) {
    billModalServices.addEventListener('click', function(e) {
      if (e.target === billModalServices) closeBillModalServices();
    });
  }

  function loadAndRenderBillServices() {
    var contentEl = document.getElementById('bill-folio-content-services');
    var subtotalEl = document.getElementById('bill-subtotal-services');
    var taxEl = document.getElementById('bill-tax-services');
    var totalEl = document.getElementById('bill-grand-total-services');
    var placeEl = document.getElementById('bill-folio-services-place');

    fetch('/api/guest/bill')
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (!json || !json.data) return;
        var d = json.data;
        if (placeEl && d.placeLabel) placeEl.textContent = d.placeLabel;
        if (subtotalEl) subtotalEl.textContent = (d.currency || '') + ' ' + (d.summary.subtotal || '0.00');
        if (taxEl) taxEl.textContent = (d.currency || '') + ' ' + (d.summary.tax || '0.00');
        if (totalEl) totalEl.textContent = (d.currency || '') + ' ' + (d.summary.total || '0.00');

        if (!contentEl) return;
        var html = '';

        if (d.orders && d.orders.length > 0) {
          html += '<div class="pt-2"><h4 class="font-semibold text-xs text-guest-text-secondary uppercase tracking-wider mb-2">Food & Beverages</h4><div class="flex flex-col gap-1.5">';
          d.orders.forEach(function(ord) {
            ord.items.forEach(function(it) {
              html += '<div class="flex justify-between text-xs text-guest-text-primary"><span>' + it.quantity + '× ' + it.name + '</span><span class="font-medium">' + (d.currency || '') + ' ' + it.lineTotal + '</span></div>';
            });
          });
          html += '</div></div>';
        }

        if (d.payableServices && d.payableServices.length > 0) {
          html += '<div class="pt-2"><h4 class="font-semibold text-xs text-guest-text-secondary uppercase tracking-wider mb-2">Hotel Services</h4><div class="flex flex-col gap-1.5">';
          d.payableServices.forEach(function(srv) {
            html += '<div class="flex justify-between text-xs text-guest-text-primary"><span>' + srv.serviceName + '</span><span class="font-medium">' + (d.currency || '') + ' ' + srv.price + '</span></div>';
          });
          html += '</div></div>';
        }

        if (d.summary && d.summary.roomStayCharge) {
          html += '<div class="pt-2"><h4 class="font-semibold text-xs text-guest-text-secondary uppercase tracking-wider mb-2">Room Accommodation</h4><div class="flex flex-col gap-1.5"><div class="flex justify-between text-xs text-guest-text-primary"><span>' + d.summary.roomStayCharge.categoryName + ' Room Rate</span><span class="font-medium">' + (d.currency || '') + ' ' + d.summary.roomStayCharge.basePrice + '</span></div></div></div>';
        }

        if (!d.orders.length && !d.payableServices.length && (!d.summary || !d.summary.roomStayCharge)) {
          html = '<div class="text-center py-4 text-xs text-guest-text-muted">No billable items on your folio yet.</div>';
        }

        contentEl.innerHTML = html;
      })
      .catch(function() {
        if (contentEl) contentEl.innerHTML = '<div class="text-center py-4 text-xs text-status-cancelled">Failed to load bill items.</div>';
      });
  }

  if (billBtnServices) {
    billBtnServices.addEventListener('click', function() {
      fetch('/api/guest/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ type: 'BILL' }),
      }).catch(function() {});

      if (billModalServices) billModalServices.style.display = 'flex';
      loadAndRenderBillServices();
    });
  }

  function checkServiceStates() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/services/states')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(json) {
        if (!json || typeof json.signature !== 'string') return;
        if (json.signature !== currentSignature) {
          var now = Date.now();
          if (now - lastReloadTime > 2000) {
            lastReloadTime = now;
            window.location.reload();
          }
        }
      })
      .catch(function() {});
  }

  setInterval(checkServiceStates, 5000);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkServiceStates();
    }
  });
})();
`,
        }}
      />
    </div>
  );
}
