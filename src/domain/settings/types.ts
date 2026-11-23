import { type TaxRateEntity } from "@/domain/tax/resolve";

export interface TaxRateSummary extends TaxRateEntity {
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly usageCount?: number;
}

export interface VenueSettings {
  readonly venueId: string;
  readonly name: string;
  readonly slug: string;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;
  readonly counterPhone: string | null;
  readonly receiptHeader: string | null;
  readonly receiptFooter: string | null;
  readonly currency: string;
  readonly isCurrencyLocked: boolean;
  readonly currencyLockedAt: string | null;
  readonly timezone: string;
  readonly timeFormat: "12h" | "24h";
  readonly defaultTaxRateId: string | null;
  readonly defaultTaxRate: TaxRateSummary | null;
  readonly taxRateFallback: string;
}

export interface UpdateRegionalInput {
  readonly currency?: string;
  readonly timezone?: string;
  readonly timeFormat?: "12h" | "24h";
}

export interface UpdateContactInput {
  readonly contactName?: string | null;
  readonly contactPhone?: string | null;
  readonly contactEmail?: string | null;
  readonly counterPhone?: string | null;
  readonly receiptHeader?: string | null;
  readonly receiptFooter?: string | null;
}

export interface CreateTaxRateInput {
  readonly venueId: string;
  readonly name: string;
  readonly rate: string; // "0.1300"
  readonly isDefault?: boolean;
  readonly isInclusive?: boolean;
}

export interface UpdateTaxRateInput {
  readonly name?: string;
  readonly isDefault?: boolean;
  readonly isActive?: boolean;
}
