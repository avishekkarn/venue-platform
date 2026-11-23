/**
 * Pure domain validation for venue contact and receipt fields (D-9.16, D-9.18).
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type UpdateContactInput } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactUpdate(
  input: UpdateContactInput
): Result<UpdateContactInput> {
  const sanitized: Record<string, string | null> = {};

  if (input.contactName !== undefined) {
    sanitized.contactName = input.contactName ? input.contactName.trim() : null;
    if (sanitized.contactName && sanitized.contactName.length > 100) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Contact name cannot exceed 100 characters."
      );
    }
  }

  if (input.contactPhone !== undefined) {
    sanitized.contactPhone = input.contactPhone ? input.contactPhone.trim() : null;
    if (sanitized.contactPhone && sanitized.contactPhone.length > 30) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Contact phone cannot exceed 30 characters."
      );
    }
  }

  if (input.counterPhone !== undefined) {
    sanitized.counterPhone = input.counterPhone ? input.counterPhone.trim() : null;
    if (sanitized.counterPhone && sanitized.counterPhone.length > 30) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Counter phone cannot exceed 30 characters."
      );
    }
  }

  if (input.contactEmail !== undefined) {
    const email = input.contactEmail ? input.contactEmail.trim().toLowerCase() : null;
    if (email) {
      if (email.length > 150) {
        return fail(
          DomainErrorCode.VALIDATION_FAILED,
          "Contact email cannot exceed 150 characters."
        );
      }
      if (!EMAIL_REGEX.test(email)) {
        return fail(
          DomainErrorCode.VALIDATION_FAILED,
          `Invalid email format: '${input.contactEmail}'`
        );
      }
    }
    sanitized.contactEmail = email;
  }

  if (input.receiptHeader !== undefined) {
    sanitized.receiptHeader = input.receiptHeader ? input.receiptHeader.trim() : null;
    if (sanitized.receiptHeader && sanitized.receiptHeader.length > 500) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Receipt header text cannot exceed 500 characters."
      );
    }
  }

  if (input.receiptFooter !== undefined) {
    sanitized.receiptFooter = input.receiptFooter ? input.receiptFooter.trim() : null;
    if (sanitized.receiptFooter && sanitized.receiptFooter.length > 500) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Receipt footer text cannot exceed 500 characters."
      );
    }
  }

  return ok(sanitized as UpdateContactInput);
}

