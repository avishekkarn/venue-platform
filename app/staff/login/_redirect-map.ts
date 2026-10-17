import type { Area } from "@/domain/auth/can-access";

export const AREA_TO_ROUTE: Record<Area, string> = {
  "admin": "/admin",
  "kitchen": "/kitchen",
  "table-service": "/staff/table",
  "room-service": "/staff/room",
  "housekeeping": "/staff/housekeeping",
  "maintenance": "/staff/maintenance",
  "concierge": "/staff/concierge",
  "laundry": "/staff/laundry",
  "spa": "/staff/spa",
  "front-desk": "/staff/front-desk",
};

export function areaToRoute(area: Area): string {
  return AREA_TO_ROUTE[area];
}
