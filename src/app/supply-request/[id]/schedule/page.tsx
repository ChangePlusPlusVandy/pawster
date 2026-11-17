import Link from "next/link";
import { Suspense } from "react";
import { FosterScheduleForm } from "@/components/forms/foster-schedule-form";
import { getOpenSlots } from "@/lib/scheduling/get-open-slots";
import { getActiveSchedulingForSupplyRequest } from "@/lib/scheduling/get-scheduling-for-supply-request";
import { getSupplyRequest } from "@/lib/supplies/get-supply-request";
import type { AppointmentSlot, SchedulingRequest, SupplyRequest } from "@/types";

type SchedulePageProps = {
  params: Promise<{ id: string }>;
};

export default function SupplyRequestSchedulePage({
  params,
}: SchedulePageProps) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
        <div className="flex flex-col gap-2">
          <Link
            href="/supply-request"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Back to Supply Request
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Schedule pickup
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choose a staff slot or propose when you are available.
          </p>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Scheduling is temporarily open to everyone. After auth lands, only
            verified fosters and staff will manage appointments.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading schedule…
            </p>
          }
        >
          <ScheduleContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function ScheduleContent({ params }: SchedulePageProps) {
  const { id } = await params;

  let supplyRequest: SupplyRequest | null = null;
  let openSlots: AppointmentSlot[] = [];
  let activeScheduling: SchedulingRequest | null = null;
  let loadError: string | null = null;

  try {
    supplyRequest = await getSupplyRequest(id);
    if (supplyRequest?.status === "pending") {
      [openSlots, activeScheduling] = await Promise.all([
        getOpenSlots(),
        getActiveSchedulingForSupplyRequest(id),
      ]);
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load scheduling data.";
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-300">
        {loadError}
      </p>
    );
  }

  if (!supplyRequest) {
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-300">
        Supply request not found.
      </p>
    );
  }

  if (supplyRequest.status !== "pending") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Only pending supply requests can be scheduled.
      </p>
    );
  }

  return (
    <FosterScheduleForm
      supplyRequest={supplyRequest}
      openSlots={openSlots}
      activeScheduling={activeScheduling}
    />
  );
}
