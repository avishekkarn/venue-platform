import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaServiceRepository } from "@/infrastructure/db/repositories/service.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { Badge, type BadgeStatus } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { MenuItemState } from "@/domain/menu/menu.repository";
import type { ServiceItemView } from "@/domain/services/service.repository";
import { AddServiceButton } from "./_add-service-button";
import { EditServiceSheet } from "./_edit-service-sheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ServicesPageProps {
  readonly searchParams?: Promise<{ id?: string }>;
}

function stateToBadge(state: MenuItemState): { status: BadgeStatus; label: string } {
  switch (state) {
    case MenuItemState.AVAILABLE:
      return { status: "ready", label: "Available" };
    case MenuItemState.UNAVAILABLE:
      return { status: "cancelled", label: "Unavailable" };
    case MenuItemState.HIDDEN:
      return { status: "done", label: "Hidden" };
  }
}

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);
  const venueRepo = createPrismaVenueRepository(prisma);
  const serviceRepo = createPrismaServiceRepository(prisma);

  const [venueResult, catalogResult] = await Promise.all([
    venueRepo.findById(staff.venueId),
    serviceRepo.getFullServiceCatalog(staff.venueId),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "NPR" : "NPR";
  const categories = catalogResult.ok ? catalogResult.value : [];

  const resolved = searchParams ? await searchParams : {};
  const selectedId = resolved.id;

  let selected: { item: ServiceItemView; categoryId: string } | null = null;
  if (selectedId) {
    for (const cat of categories) {
      const found = cat.items.find((it) => it.id === selectedId);
      if (found) {
        selected = { item: found, categoryId: cat.id };
        break;
      }
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
          Services
        </h1>
        <div className="flex items-center gap-4">
          <AddServiceButton
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            currency={currency}
          />
        </div>
      </header>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-staff-border-subtle bg-staff-surface-raised p-8 text-center">
          <p className="text-sm text-staff-text-secondary">
            The services catalog is being set up. Add your first service.
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
                      <TableHead className="text-right">Estimated</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.items.length === 0 ? (
                      <TableEmpty colSpan={7}>No services in this category.</TableEmpty>
                    ) : (
                      category.items.map((item) => {
                        const badge = stateToBadge(item.state);
                        const priceLabel =
                          item.price === "0.00" ? "Free" : formatMoney(item.price, currency);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <span
                                  aria-label="No photo"
                                  className="inline-block h-10 w-10 rounded-md bg-staff-surface-sunken text-staff-text-muted text-center leading-10"
                                >
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-staff-text-primary">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-staff-text-secondary">
                              {category.name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-staff-text-primary">
                              {priceLabel}
                            </TableCell>
                            <TableCell className="text-right text-staff-text-secondary">
                              {item.estimatedMinutes !== null
                                ? `${item.estimatedMinutes} min`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="status" status={badge.status}>
                                {badge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-2">
                                <Link
                                  href={`/admin/services?id=${item.id}`}
                                  className="h-8 px-2 rounded text-xs font-medium inline-flex items-center justify-center bg-staff-surface-raised hover:bg-staff-surface-sunken text-staff-text-primary border border-staff-border-subtle"
                                >
                                  Edit
                                </Link>
                                <button
                                  type="button"
                                  disabled
                                  title="Available in 8.4.5"
                                  className="h-8 px-2 rounded text-xs font-medium bg-staff-surface-sunken text-staff-text-muted cursor-not-allowed"
                                >
                                  Toggle
                                </button>
                                <button
                                  type="button"
                                  disabled
                                  title="Available in 8.4.5"
                                  className="h-8 px-2 rounded text-xs font-medium bg-staff-surface-sunken text-staff-text-muted cursor-not-allowed"
                                >
                                  Hide
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected ? (
        <EditServiceSheet
          item={selected.item}
          categoryId={selected.categoryId}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          currency={currency}
        />
      ) : null}
    </section>
  );
}
