/**
 * Prisma adapter for the VenueRepository port.
 *
 * Requirements:
 * - Exports createPrismaVenueRepository().
 * - Only file in the organization module that imports @prisma/client.
 * - Wraps Prisma database errors into canonical DomainError values.
 * - Maps Decimal fields to string representations.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §5 (Result contract).
 */

import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/infrastructure/db/client";
import {
  type VenueRepository,
  type VenueWithModules,
  type CreateVenueInput,
  type VenueModule,
  type HotelService,
} from "@/domain/organization/venue.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapVenue(
  raw: Prisma.VenueGetPayload<{
    include: { modules: true; services: true };
  }>
): VenueWithModules {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    brandColor: raw.brandColor,
    logoUrl: raw.logoUrl,
    heroImageUrl: raw.heroImageUrl,
    welcomeMessage: raw.welcomeMessage,
    language: raw.language,
    currency: raw.currency,
    taxRate: raw.taxRate.toString(),
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    modules: raw.modules
      .filter((m) => m.isEnabled)
      .map((m) => m.module as VenueModule),
    services: raw.services
      .filter((s) => s.isEnabled)
      .map((s) => s.service as HotelService),
  };
}

export function createPrismaVenueRepository(
  client: DbClient = defaultPrisma
): VenueRepository {
  return {
    async findById(id: string): Promise<Result<VenueWithModules>> {
      try {
        const venue = await client.venue.findUnique({
          where: { id },
          include: {
            modules: true,
            services: true,
          },
        });

        if (!venue) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Venue with id '${id}' not found`
          );
        }

        return ok(mapVenue(venue));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findBySlug(slug: string): Promise<Result<VenueWithModules>> {
      try {
        const venue = await client.venue.findUnique({
          where: { slug },
          include: {
            modules: true,
            services: true,
          },
        });

        if (!venue) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Venue with slug '${slug}' not found`
          );
        }

        return ok(mapVenue(venue));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async create(input: CreateVenueInput): Promise<Result<VenueWithModules>> {
      try {
        const venue = await client.venue.create({
          data: {
            name: input.name,
            slug: input.slug,
            brandColor: input.brandColor,
            logoUrl: input.logoUrl,
            heroImageUrl: input.heroImageUrl,
            welcomeMessage: input.welcomeMessage,
            language: input.language,
            currency: input.currency,
            taxRate: input.taxRate,
            isActive: input.isActive,
            modules: input.modules?.length
              ? {
                  create: input.modules.map((m) => ({
                    module: m,
                    isEnabled: true,
                  })),
                }
              : undefined,
            services: input.services?.length
              ? {
                  create: input.services.map((s) => ({
                    service: s,
                    isEnabled: true,
                  })),
                }
              : undefined,
          },
          include: {
            modules: true,
            services: true,
          },
        });

        return ok(mapVenue(venue));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Venue with slug '${input.slug}' already exists`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
