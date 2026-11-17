import type {
  AppointmentSlot,
  SchedulingProposalWindow,
  SchedulingRequest,
} from "@/types";

export type AppointmentSlotRow = {
  id: string;
  created_by: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentSlot["status"];
  created_at: string;
  updated_at: string;
};

export type ProposalWindowRow = {
  id: string;
  scheduling_request_id: string;
  day: string;
  start_time: string;
  end_time: string;
};

export type SchedulingRequestRow = {
  id: string;
  supply_request_id: string;
  foster_id: string | null;
  status: SchedulingRequest["status"];
  mode: SchedulingRequest["mode"];
  selected_slot_id: string | null;
  confirmed_starts_at: string | null;
  confirmed_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  appointment_slots?: AppointmentSlotRow | AppointmentSlotRow[] | null;
  scheduling_proposal_windows?: ProposalWindowRow[] | null;
};

export function mapSlot(row: AppointmentSlotRow): AppointmentSlot {
  return {
    id: row.id,
    createdBy: row.created_by,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWindow(row: ProposalWindowRow): SchedulingProposalWindow {
  return {
    id: row.id,
    schedulingRequestId: row.scheduling_request_id,
    day: row.day,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

export function mapSchedulingRequest(row: SchedulingRequestRow): SchedulingRequest {
  const slotEmbed = row.appointment_slots;
  const slot = Array.isArray(slotEmbed) ? slotEmbed[0] : slotEmbed;

  return {
    id: row.id,
    supplyRequestId: row.supply_request_id,
    fosterId: row.foster_id,
    status: row.status,
    mode: row.mode,
    selectedSlotId: row.selected_slot_id,
    confirmedStartsAt: row.confirmed_starts_at,
    confirmedEndsAt: row.confirmed_ends_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    selectedSlot: slot ? mapSlot(slot) : null,
    windows: (row.scheduling_proposal_windows ?? []).map(mapWindow),
  };
}
