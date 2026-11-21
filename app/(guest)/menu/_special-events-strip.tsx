"use client";

import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MenuCollectionView } from "@/domain/menu/menu.repository";
import { formatMoney } from "@/lib/money";

interface SpecialEventsStripProps {
  readonly collections: readonly MenuCollectionView[];
  readonly currency: string;
}

export function SpecialEventsStrip({
  collections,
  currency,
}: SpecialEventsStripProps): JSX.Element | null {
  if (collections.length === 0) return null;

  return (
    <div className="mb-8 w-full max-w-4xl mx-auto px-4">
      <h2 className="font-display text-xl text-guest-text-primary mb-3 text-center">
        Special Events
      </h2>
      {collections.map((col) => (
        <div key={col.id} className="mb-6">
          <h3 className="font-display text-lg text-guest-text-primary mb-2">
            {col.name}
          </h3>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [scrollbar-width:none] hide-scrollbar">
            {col.items.map((item) => (
              <Link
                key={item.id}
                href={`/menu?item=${item.id}`}
                className="flex-shrink-0 w-40 snap-center rounded-lg border border-guest-border-subtle bg-guest-surface-raised overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {item.photoUrl ? (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={item.photoUrl}
                      alt={item.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                      placeholder={item.photoBlurData ? "blur" : "empty"}
                      blurDataURL={item.photoBlurData ?? undefined}
                    />
                  </div>
                ) : null}
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-guest-text-primary line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-guest-text-muted mt-1">
                    {formatMoney(item.price, currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
