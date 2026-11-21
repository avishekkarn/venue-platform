import type { JSX } from "react";
import Image from "next/image";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import { isOrderable } from "@/domain/menu/is-orderable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function MenuItemCard({
  item,
  locale,
  currency = "USD",
}: {
  item: MenuItemView;
  locale: string;
  currency?: string;
  onSelect?: (item: MenuItemView) => void;
}): JSX.Element {
  const isCurrency = locale.length === 3 && locale === locale.toUpperCase();
  const safeCurrency = currency || (isCurrency ? locale : "USD");
  const safeLocale = isCurrency ? "en-US" : locale === "en" ? "en-US" : locale;

  const hasPhoto = item.photoUrl !== null;
  const orderable = isOrderable(item);
  const formattedPrice = formatMoney(item.price, safeCurrency, safeLocale);
  const hasModifiers = (item.modifierGroups?.length ?? 0) > 0;

  return (
    <Card
      data-item-card
      data-item-id={item.id}
      data-item-name={item.name}
      data-item-description={item.description ?? ""}
      data-item-price={formattedPrice}
      data-item-raw-price={item.price}
      data-item-options={JSON.stringify(item.modifierGroups ?? [])}
      data-orderable={orderable ? "true" : "false"}
      interactive={orderable}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-guest-border-subtle bg-guest-surface-raised p-3.5 sm:p-4 transition-all",
        orderable && "cursor-pointer hover:border-guest-brand hover:shadow-sm",
        !orderable && "opacity-60",
        "motion-reduce:transition-none motion-reduce:[transform:none] motion-reduce:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* Left info column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "font-display text-[16px] sm:text-[18px] font-semibold leading-tight tracking-tight transition-colors group-hover:text-guest-brand",
                  orderable ? "text-guest-text-primary" : "text-guest-text-muted"
                )}
              >
                {item.name}
              </h3>
              {!orderable ? (
                <Badge variant="status" status="cancelled">
                  Unavailable
                </Badge>
              ) : null}
            </div>

            {item.description ? (
              <p
                className={cn(
                  "text-[13px] sm:text-[14px] leading-relaxed line-clamp-2 mt-1",
                  orderable ? "text-guest-text-secondary" : "text-guest-text-muted"
                )}
              >
                {item.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-[15px] sm:text-[16px] font-semibold tracking-tight",
                  orderable ? "text-guest-text-primary" : "text-guest-text-muted"
                )}
              >
                {formattedPrice}
              </span>
              {hasModifiers ? (
                <span className="text-[11px] text-guest-text-muted font-normal hidden xs:inline">
                  (customizable)
                </span>
              ) : null}
            </div>

            {orderable ? (
              <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-guest-brand/10 text-guest-brand group-hover:bg-guest-brand group-hover:text-guest-brand-contrast transition-colors shrink-0">
                + Add
              </span>
            ) : null}
          </div>
        </div>

        {/* Right thumbnail column */}
        {hasPhoto && item.photoUrl ? (
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden rounded-lg border border-guest-border-subtle/60 bg-guest-surface-sunken">
            <Image
              src={item.photoUrl}
              alt={item.name}
              fill
              sizes="112px"
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                !orderable && "grayscale"
              )}
              placeholder={item.photoBlurData ? "blur" : "empty"}
              blurDataURL={item.photoBlurData ?? undefined}
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
