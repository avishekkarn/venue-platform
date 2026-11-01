import { type NextRequest, NextResponse } from "next/server";
import { createQrImageGenerator } from "@/infrastructure/qr";

export const dynamic = "force-dynamic";

// Dev-only access. In production, allow only when accessed from the developer's
// own machine (localhost / 127.0.0.1). This preserves the D-17.4 security posture
// while enabling production-mode LAN testing: the developer views the QR codes on
// their laptop's /dev/qr page; LAN devices cannot reach this endpoint.
function isBlockedInProduction(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.NEXT_PHASE === "phase-production-build") return false;

  const hostHeader = request.headers.get("host") || "";
  const hostname = hostHeader.split(":")[0];

  return hostname !== "localhost" && hostname !== "127.0.0.1";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (isBlockedInProduction(request)) {
    return new NextResponse("Not found", { status: 404 });
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
