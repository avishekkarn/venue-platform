"use client";

import { useState, type JSX } from "react";
import { cn } from "@/lib/utils";

interface CategoryTab {
  readonly id: string;
  readonly name: string;
}

export function CategoryTabs({
  categories,
}: {
  categories: readonly CategoryTab[];
}): JSX.Element {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "");

  const handleSelect = (id: string): void => {
    setActiveId(id);
    document.getElementById(`category-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-10 bg-guest-surface-raised border-b border-guest-border-subtle"
    >
      <ul className="flex gap-2 overflow-x-auto hide-scrollbar px-4">
        {categories.map((cat) => (
          <li key={cat.id} className="shrink-0">
            <button
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={cn(
                "relative py-3 px-3 text-[14px] font-medium text-guest-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guest-brand focus-visible:ring-offset-2",
                activeId === cat.id &&
                  "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[2px] after:bg-guest-brand"
              )}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
