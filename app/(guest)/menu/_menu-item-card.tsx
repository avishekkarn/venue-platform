import type { JSX } from "react";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import { formatMoney } from "@/lib/money";

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

  return (
    <div className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-4 flex justify-between items-start gap-4">
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
      <div className="shrink-0 text-right">
        <span className="text-[16px] leading-[24px] font-medium text-guest-text-primary">
          {formatMoney(item.price, safeCurrency, safeLocale)}
        </span>
      </div>
    </div>
  );
}
