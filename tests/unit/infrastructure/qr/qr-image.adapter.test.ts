import { describe, expect, it, vi } from "vitest";
import QRCode from "qrcode";
import { createQrImageGenerator, QrImageAdapter } from "@/infrastructure/qr";

describe("QrImageAdapter", () => {
  it("Test 1: Given a valid URL string, the adapter returns a Buffer that begins with PNG magic bytes (0x89, 0x50, 0x4E, 0x47)", async () => {
    const generator = createQrImageGenerator();
    const url = "https://venue.example.com/qr/12345678-1234-1234-1234-123456789abc";

    const buffer = await generator.generateQrImage(url);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it("Test 2: The adapter correctly forwards the input string to the qrcode library", async () => {
    const toBufferSpy = vi.spyOn(QRCode, "toBuffer");
    const generator = new QrImageAdapter();
    const url = "https://venue.example.com/qr/custom-token-forward-test";

    await generator.generateQrImage(url);

    expect(toBufferSpy).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        type: "png",
        width: 600,
        margin: 2,
      })
    );

    toBufferSpy.mockRestore();
  });
});
