import type { JSX } from "react";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import { isOrderable } from "@/domain/menu/is-orderable";
import { Card, CardMedia } from "@/components/ui/card";
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

  return (
    <Card
      data-item-card
      data-item-id={item.id}
      data-item-name={item.name}
      data-item-description={item.description ?? ""}
      data-item-price={formattedPrice}
      data-orderable={orderable ? "true" : "false"}
      interactive={orderable}
      className={cn(
        "overflow-hidden",
        orderable && "cursor-pointer",
        !orderable && "opacity-60",
        // motion-reduce: suppress the lift entirely
        "motion-reduce:transition-none motion-reduce:[transform:none] motion-reduce:shadow-sm",
      )}
    >
      {hasPhoto ? (
        <CardMedia>
          {/* Aspect box keeps the image at 16:9; object-cover fills without distortion. */}
          <img
            src={item.photoUrl!}
            alt=""
            className={cn(
              "aspect-[16/9] w-full object-cover rounded-t-lg",
              !orderable && "grayscale",
            )}
          />
        </CardMedia>
      ) : null}

      {/* Content block — always padded */}
      <div
        className={cn(
          "flex justify-between items-start gap-4",
          hasPhoto ? "p-4" : "p-4",
        )}
      >
        {/* Name + description */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "text-[18px] leading-[24px] font-semibold",
                orderable ? "text-guest-text-primary" : "text-guest-text-muted",
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
                "text-[14px] leading-[22px]",
                orderable ? "text-guest-text-secondary" : "text-guest-text-muted",
              )}
            >
              {item.description}
            </p>
          ) : null}
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          <span
            className={cn(
              "text-[16px] leading-[24px] font-medium",
              orderable ? "text-guest-text-primary" : "text-guest-text-muted",
            )}
          >
            {formatMoney(item.price, safeCurrency, safeLocale)}
          </span>
        </div>
      </div>
    </Card>
  );
}
