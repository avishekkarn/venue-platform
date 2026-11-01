import type { Metadata } from "next";
import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { getMenu } from "@/domain/menu/get-menu";
import { GuestHero } from "@/components/guest/hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardMedia,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { MenuList } from "./_menu-list";

export const metadata: Metadata = {
  title: "Menu",
  robots: {
    index: false,
  },
};

export default async function MenuPage(): Promise<JSX.Element> {
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

  const menuRepo = createPrismaMenuRepository(prisma);
  const menuResult = await getMenu({ menuRepo }, venue.value.id);
  const itemsResult = await menuRepo.listItems(venue.value.id);
  const featuredItems = itemsResult.ok
    ? itemsResult.value
        .filter((item) => item.state === MenuItemState.AVAILABLE)
        .slice(0, 3)
    : [];

  const currentItemStates: Record<string, string> = {};
  if (itemsResult.ok) {
    for (const item of itemsResult.value) {
      currentItemStates[item.id] = item.state;
    }
  } else if (menuResult.ok) {
    for (const category of menuResult.value) {
      for (const item of category.items) {
        currentItemStates[item.id] = item.state;
      }
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)]">
      <GuestHero venue={venue.value} placeContext={placeContext} />
      <div className="mt-4 flex justify-center animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <a href="#menu-heading">
          <Button size="xl" variant="primary">
            View Menu
          </Button>
        </a>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <Button variant="ghost" size="sm">
          Call a waiter
        </Button>
        <Button variant="ghost" size="sm">
          Request the bill
        </Button>
      </div>
      {featuredItems.length > 0 ? (
        <div className="mt-6 w-full max-w-4xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
          <h2 className="font-display text-xl text-guest-text-primary mb-3 text-center">
            Chef's Picks
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [scrollbar-width:none] hide-scrollbar">
            {featuredItems.map((item) => {
              const imageUrl =
                item.photoUrl ??
                (item as unknown as { imageUrl?: string | null }).imageUrl;

              return (
                <Card
                  key={item.id}
                  interactive={true}
                  className="min-w-[160px] max-w-[160px] snap-center overflow-hidden flex flex-col justify-between"
                >
                  {imageUrl ? (
                    <CardMedia>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-20 w-full object-cover"
                      />
                    </CardMedia>
                  ) : null}
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    {item.description ? (
                      <CardDescription>{item.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardBody className="px-3 py-2">
                    <p className="text-guest-text-primary text-sm font-medium">
                      {formatMoney(item.price, venue.value.currency)}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-8 max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
        <div className="flex flex-row items-start justify-center gap-4 md:gap-8 text-center">
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              1.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Browse the menu.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              2.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Order from your phone.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              3.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              We bring it to your table.
            </span>
          </div>
        </div>
      </div>
      <section aria-labelledby="menu-heading" className="mt-8 px-4 max-w-2xl mx-auto w-full">
        <h2 id="menu-heading" className="font-display text-[28px] leading-[34px] text-guest-text-primary mb-4">
          Menu
        </h2>
        {!menuResult.ok ? (
          <div className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-6 text-center">
            <p className="text-[14px] leading-[22px] text-guest-text-secondary">
              We couldn't load the menu. Please try again.
            </p>
            <a
              href="/menu"
              className="mt-3 inline-block text-[14px] font-medium text-guest-brand hover:underline"
            >
              Retry
            </a>
          </div>
        ) : menuResult.value.length === 0 ? (
          <div className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-6 text-center">
            <p className="text-[14px] leading-[22px] text-guest-text-secondary">
              The menu is being updated. Please check back in a moment.
            </p>
            <a
              href="/menu"
              className="mt-3 inline-block text-[14px] font-medium text-guest-brand hover:underline"
            >
              Retry
            </a>
          </div>
        ) : (
          <MenuList
            menu={menuResult.value}
            locale={venue.value.language}
            currency={venue.value.currency}
          />
        )}
      </section>
      <footer className="mt-6 mb-4 text-center text-xs text-guest-text-muted">
        <p className="font-display text-guest-text-secondary">{venue.value.name}</p>
        <p className="mt-1 text-[10px]">Open daily. Powered by IronMan.</p>
      </footer>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var STORAGE_KEY = 'guest_menu_states';
  var initialStates = ${JSON.stringify(currentItemStates)};

  // Store host_token in localStorage for session recovery
  try {
    var sId = ${JSON.stringify(session.value.id)};
    var sTok = ${JSON.stringify(session.value.token)};
    if (sId && sTok) {
      localStorage.setItem('host_token_' + sId, sTok);
      localStorage.setItem('host_token_' + sTok, 'claimed');
    }
  } catch (e) {}

  // Seed sessionStorage on initial load if empty
  try {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialStates));
    }
  } catch (e) {}

  function playPing() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function updateItemDOM(itemId, newState) {
    var cards = document.querySelectorAll('[data-item-id="' + itemId + '"]');
    cards.forEach(function(card) {
      var img = card.querySelector('img');
      var h3 = card.querySelector('h3');

      if (newState === 'UNAVAILABLE') {
        card.classList.add('opacity-60');
        card.classList.remove('cursor-pointer');
        card.setAttribute('data-orderable', 'false');
        if (img) img.classList.add('grayscale');
        if (h3) {
          h3.classList.remove('text-guest-text-primary');
          h3.classList.add('text-guest-text-muted');
        }

        var existingBadge = card.querySelector('[data-status="cancelled"], [data-unavailable-badge]');
        if (!existingBadge) {
          var badge = document.createElement('span');
          badge.setAttribute('data-unavailable-badge', 'true');
          badge.setAttribute('data-status', 'cancelled');
          badge.className = 'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium leading-[16px] whitespace-nowrap select-none bg-status-cancelled-bg text-status-cancelled';
          badge.textContent = 'Unavailable';
          var titleContainer = h3 ? h3.parentElement : card;
          if (titleContainer) {
            titleContainer.appendChild(badge);
          }
        }
      } else if (newState === 'AVAILABLE') {
        card.classList.remove('opacity-60');
        card.classList.add('cursor-pointer');
        card.setAttribute('data-orderable', 'true');
        card.style.display = '';
        if (img) img.classList.remove('grayscale');
        if (h3) {
          h3.classList.add('text-guest-text-primary');
          h3.classList.remove('text-guest-text-muted');
        }

        var badges = card.querySelectorAll('[data-status="cancelled"], [data-unavailable-badge]');
        badges.forEach(function(b) {
          b.remove();
        });
      } else if (newState === 'HIDDEN') {
        card.style.display = 'none';
      }
    });
  }

  function checkStates() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/menu/states')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(json) {
        if (!json || !Array.isArray(json.data)) return;

        var newItems = json.data;
        var storedRaw = null;
        try {
          storedRaw = sessionStorage.getItem(STORAGE_KEY);
        } catch (e) {}

        var prevStates = storedRaw ? JSON.parse(storedRaw) : initialStates;
        var newStatesMap = {};
        var anyChanged = false;

        for (var i = 0; i < newItems.length; i++) {
          var item = newItems[i];
          newStatesMap[item.id] = item.state;
          if (prevStates[item.id] && prevStates[item.id] !== item.state) {
            anyChanged = true;
            updateItemDOM(item.id, item.state);
          }
        }

        if (anyChanged) {
          playPing();
        }

        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newStatesMap));
        } catch (e) {}
      })
      .catch(function() {
        // Network error during poll, retry next tick
      });
  }

  setInterval(checkStates, 5000);
})();
`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var BANNER_ID = 'host-join-request-banner';
  var inFlightAction = false;

  function removeBanner() {
    var b = document.getElementById(BANNER_ID);
    if (b && b.parentNode) {
      b.parentNode.removeChild(b);
    }
  }

  function handleAction(requestId, action) {
    if (inFlightAction) return;
    inFlightAction = true;
    fetch('/api/guest/join-requests/' + encodeURIComponent(requestId) + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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
      if (existing.getAttribute('data-request-id') === req.id) {
        return;
      }
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
    </div>
  );
}

