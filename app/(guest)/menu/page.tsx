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
    </div>
  );
}

