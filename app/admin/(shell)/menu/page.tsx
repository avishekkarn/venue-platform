import type { JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableEmpty,
} from "@/components/ui/table";
import { MenuItemRow } from "@/components/staff/menu-item-row";
import { EditSheet } from "./_edit-sheet";

/**
 * The admin menu list screen (8.3.1, 8.3.3, DESIGN.md §4.10.8).
 *
 * A Server Component inside the (shell) route group. It reads the venue's
 * full menu via `menuRepo.getFullMenu` — not `getMenu` — so HIDDEN items
 * are visible to the manager (D-4.2, W-0005).
 *
 * The six columns are Photo / Name / Category / Price / State / Actions.
 * In 8.3.3, the Actions column's Edit button is a Link to ?id=<itemId> rendered
 * via MenuItemRow's editHref prop. When searchParams.id is set, the page renders
 * EditSheet (a controlled Client Component boundary around Sheet and EditForm).
 *
 * Reference: ROADMAP.md §12 (8.3.1, 8.3.3), DESIGN.md §4.10.8, D-4.2, D-20.1,
 * D-22.1, D-23.1, D-24.1.
 */
interface MenuPageProps {
  readonly searchParams?: Promise<{ id?: string }>;
}

export default async function MenuPage({
  searchParams,
}: MenuPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const menuRepo = createPrismaMenuRepository(prisma);

  const [venueResult, menuResult] = await Promise.all([
    venueRepo.findById(staff.venueId),
    menuRepo.getFullMenu(staff.venueId),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "NPR" : "NPR";
  const categories = menuResult.ok ? menuResult.value : [];
  const uniqueItemIds = new Set(categories.flatMap((c) => c.items.map((i) => i.id)));
  const itemCount = uniqueItemIds.size;

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedId = resolvedSearchParams.id;

  let selectedItem: MenuItemView | null = null;
  let selectedCategoryIds: readonly string[] = [];

  if (selectedId) {
    for (const cat of categories) {
      const found = cat.items.find((it) => it.id === selectedId);
      if (found) {
        selectedItem = found;
        selectedCategoryIds = found.categoryIds;
        break;
      }
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
          Menu
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-staff-text-muted">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Available in 8.3.2a"
            className="h-9 px-3 rounded-md text-sm font-medium bg-staff-surface-sunken text-staff-text-muted cursor-not-allowed"
          >
            Add item
          </button>
        </div>
      </header>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-staff-border-subtle bg-staff-surface-raised p-8 text-center">
          <p className="text-sm text-staff-text-secondary">
            The menu is being set up. Add your first item.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <div key={category.id} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-staff-text-primary">
                {category.name}
              </h2>
              <div className="rounded-xl border border-staff-border-subtle bg-staff-surface-raised overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.items.length === 0 ? (
                      <TableEmpty colSpan={6}>No items in this category.</TableEmpty>
                    ) : (
                      category.items.map((item) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          categoryName={category.name}
                          currency={currency}
                          editHref={`/admin/menu?id=${item.id}`}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem ? (
        <EditSheet
          item={selectedItem}
          initialCategoryIds={selectedCategoryIds}
          categories={categories}
          currency={currency}
        />
      ) : null}
    </section>
  );
}
