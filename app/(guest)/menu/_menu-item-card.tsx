import type { JSX } from "react";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import { Card, CardMedia } from "@/components/ui/card";
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
}): JSX.Element {
  const isCurrency = locale.length === 3 && locale === locale.toUpperCase();
  const safeCurrency = currency || (isCurrency ? locale : "USD");
  const safeLocale = isCurrency ? "en-US" : locale === "en" ? "en-US" : locale;

  const hasPhoto = item.photoUrl !== null;

  return (
    <Card
      interactive
      className={cn(
        "overflow-hidden",
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
            className="aspect-[16/9] w-full object-cover rounded-t-lg"
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
          <h3 className="text-[18px] leading-[24px] font-semibold text-guest-text-primary">
            {item.name}
          </h3>
          {item.description ? (
            <p className="text-[14px] leading-[22px] text-guest-text-secondary">
              {item.description}
            </p>
          ) : null}
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          <span className="text-[16px] leading-[24px] font-medium text-guest-text-primary">
            {formatMoney(item.price, safeCurrency, safeLocale)}
          </span>
        </div>
      </div>
    </Card>
  );
}
