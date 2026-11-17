import Link from "next/link";
import { Suspense } from "react";
import { StaffAppointmentsPanel } from "@/components/forms/staff-appointments-panel";
import {
  getConfirmedSchedulingRequests,
  getPendingSchedulingRequests,
  getStaffOpenSlots,
} from "@/lib/scheduling/get-staff-appointments";
import type { AppointmentSlot, SchedulingRequest } from "@/types";

export default function StaffAppointmentsPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Back to Pawster
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Staff appointments
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Publish open slots and manage pending foster bookings.
          </p>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Staff auth is not ready yet (AUTH-02). This page is temporarily
            open. Pending proposals stay available even if you publish slots.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading appointments…
            </p>
          }
        >
          <StaffAppointmentsContent />
        </Suspense>
      </main>
    </div>
  );
}

async function StaffAppointmentsContent() {
  let openSlots: AppointmentSlot[] = [];
  let pending: SchedulingRequest[] = [];
  let confirmed: SchedulingRequest[] = [];
  let loadError: string | null = null;

  try {
    [openSlots, pending, confirmed] = await Promise.all([
      getStaffOpenSlots(),
      getPendingSchedulingRequests(),
      getConfirmedSchedulingRequests(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load staff appointments.";
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-300">
        {loadError}
      </p>
    );
  }

  return (
    <StaffAppointmentsPanel
      openSlots={openSlots}
      pending={pending}
      confirmed={confirmed}
    />
  );
}
