import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { createQrImageGenerator } from "@/infrastructure/qr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const generator = createQrImageGenerator();
    const buffer = await generator.generateQrImage(url);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse("Failed to generate QR code", { status: 500 });
  }
}
