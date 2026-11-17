"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acceptProposalAction,
  cancelOpenSlotAction,
  cancelSchedulingStaffAction,
  confirmSlotBookingAction,
  publishSlotsAction,
} from "@/app/staff/appointments/actions";
import {
  formatDateTime,
  formatDay,
  formatTimeRange,
  localDayTimeToIso,
  upcomingDays,
} from "@/lib/scheduling/format";
import { hourOptions } from "@/lib/scheduling/validation";
import type { AppointmentSlot, SchedulingRequest } from "@/types";

type StaffAppointmentsPanelProps = {
  openSlots: AppointmentSlot[];
  pending: SchedulingRequest[];
  confirmed: SchedulingRequest[];
};

export function StaffAppointmentsPanel({
  openSlots,
  pending,
  confirmed,
}: StaffAppointmentsPanelProps) {
  const router = useRouter();
  const [day, setDay] = useState(upcomingDays(1)[0] ?? "");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const days = upcomingDays(21);
  const slotPicks = pending.filter((item) => item.mode === "slot_pick");
  const proposals = pending.filter((item) => item.mode === "foster_proposal");

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Open slots</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span>Day</span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              value={day}
              onChange={(event) => setDay(event.target.value)}
            >
              {days.map((value) => (
                <option key={value} value={value}>
                  {formatDay(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full flex-col gap-1 text-sm sm:w-28">
            <span>From</span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full flex-col gap-1 text-sm sm:w-28">
            <span>To</span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() =>
              run(() =>
                publishSlotsAction({
                  slots: [
                    {
                      startsAt: localDayTimeToIso(day, startTime),
                      endsAt: localDayTimeToIso(day, endTime),
                    },
                  ],
                }),
              )
            }
          >
            Publish slot
          </button>
        </div>

        {openSlots.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No open, held, or booked slots yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {openSlots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-col gap-2 border-b border-zinc-100 pb-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium">
                    {formatDateTime(slot.startsAt)} –{" "}
                    {formatDateTime(slot.endsAt)}
                  </p>
                  <p className="capitalize text-zinc-500">{slot.status}</p>
                </div>
                {slot.status === "open" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    className="self-start rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                    onClick={() => run(() => cancelOpenSlotAction(slot.id))}
                  >
                    Cancel slot
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Pending</h2>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Slot picks awaiting confirm
          </h3>
          {slotPicks.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No pending slot picks.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {slotPicks.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 border-b border-zinc-100 pb-3 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      Supply request {item.supplyRequestId.slice(0, 8)}…
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {item.selectedSlot
                        ? `${formatDateTime(item.selectedSlot.startsAt)} – ${formatDateTime(item.selectedSlot.endsAt)}`
                        : "Slot selected"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      onClick={() =>
                        run(() =>
                          confirmSlotBookingAction(
                            item.id,
                            item.supplyRequestId,
                          ),
                        )
                      }
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                      onClick={() =>
                        run(() =>
                          cancelSchedulingStaffAction(
                            item.id,
                            item.supplyRequestId,
                          ),
                        )
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Foster proposals
          </h3>
          {proposals.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No pending foster proposals. Staff can still publish slots; foster
              proposals remain available to accept (staff decides).
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {proposals.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 border-b border-zinc-100 pb-4 text-sm dark:border-zinc-800"
                >
                  <p className="font-medium">
                    Supply request {item.supplyRequestId.slice(0, 8)}…
                  </p>
                  <ul className="flex flex-col gap-2">
                    {item.windows.map((window) => (
                      <li
                        key={window.id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span>
                          {formatDay(window.day)} ·{" "}
                          {formatTimeRange(window.startTime, window.endTime)}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          className="self-start rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          onClick={() =>
                            run(() =>
                              acceptProposalAction({
                                schedulingRequestId: item.id,
                                windowId: window.id,
                                supplyRequestId: item.supplyRequestId,
                              }),
                            )
                          }
                        >
                          Accept this window
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={isPending}
                    className="self-start rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
                    onClick={() =>
                      run(() =>
                        cancelSchedulingStaffAction(
                          item.id,
                          item.supplyRequestId,
                        ),
                      )
                    }
                  >
                    Cancel proposal
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Confirmed</h2>
        {confirmed.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No confirmed appointments yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {confirmed.map((item) => (
              <li
                key={item.id}
                className="border-b border-zinc-100 pb-3 dark:border-zinc-800"
              >
                <p className="font-medium">
                  {item.confirmedStartsAt
                    ? `${formatDateTime(item.confirmedStartsAt)} – ${formatDateTime(item.confirmedEndsAt ?? item.confirmedStartsAt)}`
                    : "Confirmed"}
                </p>
                <p className="text-zinc-500">
                  Supply request {item.supplyRequestId.slice(0, 8)}…
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

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
