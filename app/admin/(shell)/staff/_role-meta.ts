import { StaffRole } from "@/domain/auth/staff.repository";

export interface RoleMeta {
  readonly role: StaffRole;
  readonly label: string;
  readonly category: "Management" | "Kitchen" | "Hospitality" | "Facilities";
  readonly description: string;
  readonly badgeCls: string;
}

export const ROLE_METAS: Record<StaffRole, RoleMeta> = {
  [StaffRole.OWNER]: {
    role: StaffRole.OWNER,
    label: "Owner",
    category: "Management",
    description: "Complete venue authority across admin, financials, reports, staff, and operations.",
    badgeCls: "bg-purple-100 text-purple-900 border-purple-200",
  },
  [StaffRole.MANAGER]: {
    role: StaffRole.MANAGER,
    label: "Manager",
    category: "Management",
    description: "Full management access to admin panel, staff accounts, menu, pricing, and live operations.",
    badgeCls: "bg-indigo-100 text-indigo-900 border-indigo-200",
  },
  [StaffRole.LEADER]: {
    role: StaffRole.LEADER,
    label: "Shift Leader",
    category: "Management",
    description: "Supervises all hospitality floor queues, service requests, and staff dispatch without admin access.",
    badgeCls: "bg-sky-100 text-sky-900 border-sky-200",
  },
  [StaffRole.CHEF]: {
    role: StaffRole.CHEF,
    label: "Chef / Kitchen",
    category: "Kitchen",
    description: "High-contrast kitchen pass display: tickets, preparation states, and menu item stock toggling.",
    badgeCls: "bg-amber-100 text-amber-900 border-amber-200",
  },
  [StaffRole.TABLE_SERVICE]: {
    role: StaffRole.TABLE_SERVICE,
    label: "Table Service",
    category: "Hospitality",
    description: "Table floor map, dining orders, food dispatch, waiter calls, and closing table bills.",
    badgeCls: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  [StaffRole.ROOM_SERVICE]: {
    role: StaffRole.ROOM_SERVICE,
    label: "Room Service",
    category: "Hospitality",
    description: "In-room dining orders, room delivery tickets, and room folio management.",
    badgeCls: "bg-teal-100 text-teal-900 border-teal-200",
  },
  [StaffRole.FRONT_DESK]: {
    role: StaffRole.FRONT_DESK,
    label: "Front Desk",
    category: "Hospitality",
    description: "Combined room service requests, guest assistance, check-in/out folios, and service dispatch.",
    badgeCls: "bg-blue-100 text-blue-900 border-blue-200",
  },
  [StaffRole.HOUSEKEEPING]: {
    role: StaffRole.HOUSEKEEPING,
    label: "Housekeeping",
    category: "Facilities",
    description: "Room cleaning queues, extra towels/amenities, and room housekeeping states (Vacant/Cleaning/Ready).",
    badgeCls: "bg-orange-100 text-orange-900 border-orange-200",
  },
  [StaffRole.MAINTENANCE]: {
    role: StaffRole.MAINTENANCE,
    label: "Maintenance",
    category: "Facilities",
    description: "Facility repair tickets (AC, plumbing, electrical) with urgency level indicators.",
    badgeCls: "bg-stone-200 text-stone-900 border-stone-300",
  },
  [StaffRole.CONCIERGE]: {
    role: StaffRole.CONCIERGE,
    label: "Concierge",
    category: "Hospitality",
    description: "Guest luggage, transport booking, local tours, and wake-up call requests.",
    badgeCls: "bg-rose-100 text-rose-900 border-rose-200",
  },
  [StaffRole.LAUNDRY]: {
    role: StaffRole.LAUNDRY,
    label: "Laundry",
    category: "Facilities",
    description: "Guest clothes wash, iron, and dry-cleaning service requests.",
    badgeCls: "bg-cyan-100 text-cyan-900 border-cyan-200",
  },
  [StaffRole.SPA]: {
    role: StaffRole.SPA,
    label: "Spa & Wellness",
    category: "Facilities",
    description: "Spa treatments, wellness reservations, and appointment service tickets.",
    badgeCls: "bg-pink-100 text-pink-900 border-pink-200",
  },
};
