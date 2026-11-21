import type { JSX } from "react";
import type { ServiceCategoryView } from "@/domain/services/service.repository";
import { ServiceCard } from "./_service-card";

export function ServiceList({
  categories,
  currency,
}: {
  categories: readonly ServiceCategoryView[];
  currency: string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-8 mt-6 w-full max-w-4xl mx-auto px-4 animate-in fade-in duration-700 delay-500 ease-guest-entrance">
      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-guest-text-primary text-center">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((item) => (
              <ServiceCard key={item.id} item={item} currency={currency} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
