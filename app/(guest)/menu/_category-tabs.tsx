"use client";

import type { JSX } from "react";
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
  return (
    <>
      <nav
        id="category-tabs-nav"
        aria-label="Menu categories"
        className="sticky top-0 z-10 bg-guest-surface-raised border-b border-guest-border-subtle"
      >
        <ul className="flex gap-2 overflow-x-auto hide-scrollbar px-4">
          {categories.map((cat, index) => (
            <li key={cat.id} className="shrink-0">
              <a
                href={`#category-${cat.id}`}
                className={cn(
                  "block relative py-3 px-3 text-[14px] font-medium text-guest-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guest-brand focus-visible:ring-offset-2",
                  index === 0 &&
                    "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[2px] after:bg-guest-brand"
                )}
              >
                {cat.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <script
        dangerouslySetInnerHTML={{
          __html: `
  (function() {
    function init() {
      var nav = document.getElementById('category-tabs-nav');
      if (!nav) return;
      
      nav.addEventListener('click', function(e) {
        var target = e.target.closest('a');
        if (!target) return;
        
        var tabs = nav.querySelectorAll('a');
        tabs.forEach(function(tab) {
          tab.classList.remove('after:absolute', 'after:left-0', 'after:right-0', 'after:-bottom-px', 'after:h-[2px]', 'after:bg-guest-brand');
        });
        
        target.classList.add('after:absolute', 'after:left-0', 'after:right-0', 'after:-bottom-px', 'after:h-[2px]', 'after:bg-guest-brand');
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
`,
        }}
      />
    </>
  );
}
