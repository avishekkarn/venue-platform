/**
 * Shared types for the admin QR generation flow.
 *
 * Extracted from `_generate-button.tsx` to break the circular import between
 * the button wrapper and the dialog it renders. Neither component imports the
 * other for types; both import from this file.
 */
export interface PlaceOption {
  readonly id: string;
  readonly label: string;
}

export interface PlacesByType {
  readonly TABLE: readonly PlaceOption[];
  readonly ROOM: readonly PlaceOption[];
  readonly COUNTER: readonly PlaceOption[];
}
