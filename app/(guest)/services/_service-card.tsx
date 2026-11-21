import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { ServiceItemView } from "@/domain/services/service.repository";

export function ServiceCard({
  item,
  currency,
}: {
  item: ServiceItemView;
  currency: string;
}): JSX.Element {
  const priceLabel =
    item.price === "0.00" ? "Free" : formatMoney(item.price, currency);
  return (
    <Card interactive={true} className="p-4 flex flex-col gap-2">
      {item.photoUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
          <Image
            src={item.photoUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            placeholder={item.photoBlurData ? "blur" : "empty"}
            blurDataURL={item.photoBlurData ?? undefined}
          />
        </div>
      ) : null}
      <div>
        <h3 className="text-base font-semibold text-guest-text-primary">
          {item.name}
        </h3>
        {item.description ? (
          <p className="text-sm text-guest-text-secondary mt-1 line-clamp-2">
            {item.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-guest-text-primary">
            {priceLabel}
          </span>
          {item.estimatedMinutes !== null ? (
            <span className="text-xs text-guest-text-muted">
              {item.estimatedMinutes} min
            </span>
          ) : null}
        </div>
      </div>
      <Link
        href={`/services/${item.id}`}
        className="text-xs font-medium text-guest-brand hover:underline mt-2"
      >
        Request this service →
      </Link>
    </Card>
  );
}
