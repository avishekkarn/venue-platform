/**
 * QR image generator port.
 *
 * Defines the contract for generating scannable QR code images.
 * Pure domain interface — never imports third-party image libraries or HTTP drivers.
 *
 * Note on `text`: The text passed to generateQrImage is the full, canonical URL
 * that the QR code encodes (e.g., https://venue.com/qr/<token>), not just the
 * opaque token itself. URL construction is the responsibility of the calling layer
 * (the API route/service), which supplies the venue host and path.
 *
 * Reference: SYSTEM.md §8.5 (The generation flow), DECISIONS.md D-16.2.
 */

export interface QrImageGenerator {
  /**
   * Generates a scannable PNG image buffer for the provided target URL text.
   *
   * @param text The full target URL that the QR code encodes.
   * @returns A Promise resolving to a PNG image Buffer.
   */
  generateQrImage(text: string): Promise<Buffer>;
}
