"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  bookSlotAction,
  cancelSchedulingAction,
  proposeAvailabilityAction,
} from "@/app/supply-request/[id]/schedule/actions";
import {
  formatDateTime,
  formatDay,
  formatTimeRange,
  upcomingDays,
} from "@/lib/scheduling/format";
import { hourOptions } from "@/lib/scheduling/validation";
import type {
  AppointmentSlot,
  SchedulingRequest,
  SupplyRequest,
} from "@/types";

type ModeChoice = "slot" | "propose" | null;

type WindowDraft = {
  key: string;
  day: string;
  startTime: string;
  endTime: string;
};

type FosterScheduleFormProps = {
  supplyRequest: SupplyRequest;
  openSlots: AppointmentSlot[];
  activeScheduling: SchedulingRequest | null;
};

function statusCopy(scheduling: SchedulingRequest): {
  title: string;
  detail: string;
} {
  if (scheduling.status === "confirmed") {
    return {
      title: "Appointment confirmed",
      detail: scheduling.confirmedStartsAt
        ? `${formatDateTime(scheduling.confirmedStartsAt)} – ${formatDateTime(scheduling.confirmedEndsAt ?? scheduling.confirmedStartsAt)}`
        : "Your pickup time is confirmed.",
    };
  }

  if (scheduling.mode === "slot_pick") {
    return {
      title: "Pending staff confirmation",
      detail: scheduling.selectedSlot
        ? `You selected ${formatDateTime(scheduling.selectedSlot.startsAt)}. Staff still needs to confirm.`
        : "Waiting on staff to confirm your selected slot.",
    };
  }

  return {
    title: "Waiting on staff",
    detail:
      "You proposed availability. Staff will pick a time from your windows.",
  };
}

export function FosterScheduleForm({
  supplyRequest,
  openSlots,
  activeScheduling,
}: FosterScheduleFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ModeChoice>(
    openSlots.length > 0 ? "slot" : "propose",
  );
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [windows, setWindows] = useState<WindowDraft[]>([
    {
      key: crypto.randomUUID(),
      day: upcomingDays(1)[0] ?? "",
      startTime: "10:00",
      endTime: "12:00",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const days = useMemo(() => upcomingDays(14), []);
  const slotsByDay = useMemo(() => {
    const map = new Map<string, AppointmentSlot[]>();
    for (const slot of openSlots) {
      const day = slot.startsAt.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(slot);
      map.set(day, list);
    }
    return Array.from(map.entries());
  }, [openSlots]);

  function refresh(message: string) {
    setSuccess(message);
    setError(null);
    router.refresh();
  }

  function handleBookSlot() {
    setError(null);
    setSuccess(null);
    if (!selectedSlotId) {
      setError("Select an open slot.");
      return;
    }

    startTransition(async () => {
      const result = await bookSlotAction({
        supplyRequestId: supplyRequest.id,
        slotId: selectedSlotId,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      refresh(result.message);
    });
  }

  function handlePropose() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await proposeAvailabilityAction({
        supplyRequestId: supplyRequest.id,
        windows: windows.map(({ day, startTime, endTime }) => ({
          day,
          startTime,
          endTime,
        })),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      refresh(result.message);
    });
  }

  function handleCancel() {
    if (!activeScheduling) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await cancelSchedulingAction(
        activeScheduling.id,
        supplyRequest.id,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSelectedSlotId("");
      refresh(result.message);
    });
  }

  if (activeScheduling && activeScheduling.status !== "cancelled") {
    const copy = statusCopy(activeScheduling);
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {copy.title}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {copy.detail}
          </p>
          {activeScheduling.mode === "foster_proposal" &&
          activeScheduling.windows.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              {activeScheduling.windows.map((window) => (
                <li key={window.id}>
                  {formatDay(window.day)} ·{" "}
                  {formatTimeRange(window.startTime, window.endTime)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleCancel}
          className="self-start rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
        >
          {isPending ? "Working…" : "Cancel / reschedule"}
        </button>

        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="text-sm text-emerald-800 dark:text-emerald-200">
            {success}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("slot")}
          className={`rounded-md border px-3 py-2 text-sm ${
            mode === "slot"
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-300 dark:border-zinc-700"
          }`}
        >
          Pick a staff slot
        </button>
        <button
          type="button"
          onClick={() => setMode("propose")}
          className={`rounded-md border px-3 py-2 text-sm ${
            mode === "propose"
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-300 dark:border-zinc-700"
          }`}
        >
          Propose my availability
        </button>
      </div>

      {mode === "slot" ? (
        <div className="flex flex-col gap-4">
          {openSlots.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No open staff slots yet. Propose your availability instead, or
              check back later.
            </p>
          ) : (
            <fieldset className="flex flex-col gap-4">
              <legend className="text-base font-medium">Available slots</legend>
              {slotsByDay.map(([day, slots]) => (
                <div key={day} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {formatDay(day)}
                  </p>
                  {slots.map((slot) => (
                    <label
                      key={slot.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.id}
                        checked={selectedSlotId === slot.id}
                        onChange={() => setSelectedSlotId(slot.id)}
                      />
                      {formatDateTime(slot.startsAt)} –{" "}
                      {formatDateTime(slot.endsAt)}
                    </label>
                  ))}
                </div>
              ))}
              <button
                type="button"
                disabled={isPending}
                onClick={handleBookSlot}
                className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isPending ? "Submitting…" : "Request this slot"}
              </button>
            </fieldset>
          )}
        </div>
      ) : null}

      {mode === "propose" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Select days and hour ranges when you could come for pickup.
          </p>
          {windows.map((window, index) => (
            <div
              key={window.key}
              className="flex flex-col gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800 sm:flex-row sm:items-end"
            >
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Day</span>
                <select
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  value={window.day}
                  onChange={(event) =>
                    setWindows((current) =>
                      current.map((entry) =>
                        entry.key === window.key
                          ? { ...entry, day: event.target.value }
                          : entry,
                      ),
                    )
                  }
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {formatDay(day)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1 text-sm sm:w-28">
                <span className="text-zinc-600 dark:text-zinc-400">From</span>
                <select
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  value={window.startTime}
                  onChange={(event) =>
                    setWindows((current) =>
                      current.map((entry) =>
                        entry.key === window.key
                          ? { ...entry, startTime: event.target.value }
                          : entry,
                      ),
                    )
                  }
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1 text-sm sm:w-28">
                <span className="text-zinc-600 dark:text-zinc-400">To</span>
                <select
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  value={window.endTime}
                  onChange={(event) =>
                    setWindows((current) =>
                      current.map((entry) =>
                        entry.key === window.key
                          ? { ...entry, endTime: event.target.value }
                          : entry,
                      ),
                    )
                  }
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </label>
              {windows.length > 1 ? (
                <button
                  type="button"
                  className="text-sm text-red-700 dark:text-red-400"
                  onClick={() =>
                    setWindows((current) =>
                      current.filter((entry) => entry.key !== window.key),
                    )
                  }
                >
                  Remove
                </button>
              ) : null}
              <span className="sr-only">Window {index + 1}</span>
            </div>
          ))}
          <button
            type="button"
            className="self-start text-sm font-medium underline underline-offset-2"
            onClick={() =>
              setWindows((current) => [
                ...current,
                {
                  key: crypto.randomUUID(),
                  day: days[0] ?? "",
                  startTime: "10:00",
                  endTime: "12:00",
                },
              ])
            }
          >
            Add another window
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handlePropose}
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? "Submitting…" : "Submit availability"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="text-sm text-emerald-800 dark:text-emerald-200">
          {success}
        </p>
      ) : null}
    </div>
  );
}
