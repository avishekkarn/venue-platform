/**
 * QR image generator infrastructure adapter.
 *
 * Implements the QrImageGenerator port using the `qrcode` library to render
 * high-resolution PNG image buffers suitable for display, print, and physical scanning.
 *
 * Reference: SYSTEM.md §8.5 (The generation flow), DECISIONS.md D-16.2.
 */

import QRCode from "qrcode";
import { type QrImageGenerator } from "@/domain/qr/qr-image-generator";

export class QrImageAdapter implements QrImageGenerator {
  async generateQrImage(text: string): Promise<Buffer> {
    return QRCode.toBuffer(text, {
      type: "png",
      width: 600,
      margin: 2,
    });
  }
}

export function createQrImageGenerator(): QrImageGenerator {
  return new QrImageAdapter();
}
