import { StaffRole, StaffState } from "@/domain/auth/staff.repository";

export interface AdminStaffItem {
  readonly id: string;
  readonly venueId: string;
  readonly name: string;
  readonly username: string;
  readonly roles: readonly StaffRole[];
  readonly state: StaffState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isOnline: boolean;
  readonly lastLoginAt: string | null;
  readonly activeSessionId: string | null;
  readonly shiftStartedAt: string | null;
  readonly activeHoursTodayMinutes: number;
  readonly activeHoursWeekMinutes: number;
  readonly totalHistoricalHours: number;
  readonly ordersHandledCount: number;
  readonly requestsResolvedCount: number;
}

export interface AdminStaffSummary {
  readonly totalStaff: number;
  readonly activeStaff: number;
  readonly deactivatedStaff: number;
  readonly onlineStaff: number;
  readonly roleCounts: Record<string, number>;
}

export interface StaffPlacesData {
  readonly staff: readonly AdminStaffItem[];
  readonly summary: AdminStaffSummary;
}

export interface StaffSessionRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly endedAt: string | null;
  readonly durationMinutes: number;
  readonly isLive: boolean;
}

export interface StaffActivityOrderAction {
  readonly id: string;
  readonly orderId: string;
  readonly state: string;
  readonly occurredAt: string;
  readonly orderTotal: string;
  readonly placeType: string;
}

export interface StaffActivityRequestAction {
  readonly id: string;
  readonly requestId: string;
  readonly state: string;
  readonly occurredAt: string;
  readonly serviceType: string;
  readonly placeType: string;
}

export interface StaffActivityDetails {
  readonly isOnline: boolean;
  readonly shiftStartedAt: string | null;
  readonly lastLoginAt: string | null;
  readonly activeHoursTodayMinutes: number;
  readonly activeHoursWeekMinutes: number;
  readonly totalHistoricalHours: number;
  readonly ordersHandledCount: number;
  readonly requestsResolvedCount: number;
  readonly recentSessions: readonly StaffSessionRecord[];
  readonly recentOrderActions: readonly StaffActivityOrderAction[];
  readonly recentRequestActions: readonly StaffActivityRequestAction[];
}
