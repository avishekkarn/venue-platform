import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { ServiceItemView } from "@/domain/services/service.repository";

function resolveServiceRoute(name: string): { href: string; cta: string } {
  const norm = name.toLowerCase().trim();
  if (norm.includes("room service") || norm.includes("food") || norm.includes("dining")) {
    return { href: "/menu", cta: "View Menu & Order →" };
  }
  if (norm.includes("housekeeping") || norm.includes("cleaning")) {
    return { href: "/services/housekeeping", cta: "Request Housekeeping →" };
  }
  if (norm.includes("maintenance") || norm.includes("repair")) {
    return { href: "/services/maintenance", cta: "Request Maintenance →" };
  }
  if (norm.includes("concierge")) {
    return { href: "/services/concierge", cta: "Contact Concierge →" };
  }
  if (norm.includes("laundry")) {
    return { href: "/services/laundry", cta: "Request Laundry →" };
  }
  if (norm.includes("spa") || norm.includes("massage") || norm.includes("wellness")) {
    return { href: "/services/spa", cta: "Book Treatment →" };
  }
  if (norm.includes("late checkout")) {
    return { href: "/services/late-checkout", cta: "Request Late Checkout →" };
  }
  if (norm.includes("wake-up") || norm.includes("wakeup")) {
    return { href: "/services/wake-up-call", cta: "Set Wake-up Call →" };
  }
  if (norm.includes("disturb")) {
    return { href: "/services/do-not-disturb", cta: "Set Do Not Disturb →" };
  }
  return { href: `/services/${encodeURIComponent(norm.replace(/\s+/g, "-"))}`, cta: "Request this service →" };
}

export function ServiceCard({
  item,
  currency,
}: {
  item: ServiceItemView;
  currency: string;
}): JSX.Element {
  const priceLabel =
    item.price === "0.00" ? "Free" : formatMoney(item.price, currency);
  const { href, cta } = resolveServiceRoute(item.name);

  return (
    <Link href={href} className="group block focus:outline-none">
      <Card interactive={true} className="p-4 flex flex-col gap-2 h-full transition-all group-hover:border-guest-brand">
        {item.photoUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
            <Image
              src={item.photoUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              placeholder={item.photoBlurData ? "blur" : "empty"}
              blurDataURL={item.photoBlurData ?? undefined}
            />
          </div>
        ) : null}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-guest-text-primary group-hover:text-guest-brand transition-colors">
              {item.name}
            </h3>
            {item.description ? (
              <p className="text-sm text-guest-text-secondary mt-1 line-clamp-2">
                {item.description}
              </p>
            ) : null}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-guest-text-primary">
                {priceLabel}
              </span>
              {item.estimatedMinutes !== null ? (
                <span className="text-guest-text-muted">
                  ~{item.estimatedMinutes} min
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-xs font-medium text-guest-brand group-hover:underline">
              {cta}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
