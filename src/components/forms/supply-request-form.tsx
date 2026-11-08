"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  cancelSupplyRequestAction,
  submitWeeklyCheckInAction,
} from "@/app/supply-request/actions";
import {
  COMMENTS_MAX,
  CUSTOM_NAME_MAX,
  NOTES_MAX,
  submitWeeklyCheckInSchema,
} from "@/lib/supplies/validation";
import type { FulfillmentMethod, SupplyItem, SupplyRequest } from "@/types";

type NeedsSuppliesAnswer = "yes" | "no" | null;

type FormRow = {
  key: string;
  mode: "catalog" | "other";
  supplyItemId: string;
  customName: string;
  quantity: string;
};

type SupplyRequestFormProps = {
  supplyItems: SupplyItem[];
  initialRequests: SupplyRequest[];
};

function createRow(): FormRow {
  return {
    key: crypto.randomUUID(),
    mode: "catalog",
    supplyItemId: "",
    customName: "",
    quantity: "1",
  };
}

function itemLabel(request: SupplyRequest): string {
  if (request.items.length === 0) {
    return "No items";
  }
  return request.items
    .map((item) => {
      const name = item.customName ?? item.supplyItem?.name ?? "Item";
      const unit = item.supplyItem?.unitLabel;
      return unit ? `${name} × ${item.quantity} ${unit}` : `${name} × ${item.quantity}`;
    })
    .join(", ");
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function groupItemsByCategory(items: SupplyItem[]) {
  const groups = new Map<string, SupplyItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return Array.from(groups.entries());
}

export function SupplyRequestForm({
  supplyItems,
  initialRequests,
}: SupplyRequestFormProps) {
  const router = useRouter();
  const [needsSupplies, setNeedsSupplies] = useState<NeedsSuppliesAnswer>(null);
  const [comments, setComments] = useState("");
  const [notesToStaff, setNotesToStaff] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod | "">("");
  const [rows, setRows] = useState<FormRow[]>([createRow()]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const itemsByCategory = useMemo(
    () => groupItemsByCategory(supplyItems),
    [supplyItems],
  );

  const selectedCatalogIds = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => row.mode === "catalog" && row.supplyItemId)
          .map((row) => row.supplyItemId),
      ),
    [rows],
  );

  function resetForm(keepAnswer: NeedsSuppliesAnswer = null) {
    setNeedsSupplies(keepAnswer);
    setComments("");
    setNotesToStaff("");
    setFulfillmentMethod("");
    setRows([createRow()]);
  }

  function updateRow(key: string, patch: Partial<FormRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (needsSupplies === null) {
      setError("Please answer whether you need supplies.");
      return;
    }

    const payload = {
      needsSupplies: needsSupplies === "yes",
      comments: comments.trim() || null,
      fulfillmentMethod:
        needsSupplies === "yes" ? fulfillmentMethod || null : null,
      notesToStaff: needsSupplies === "yes" ? notesToStaff.trim() || null : null,
      items:
        needsSupplies === "yes"
          ? rows.map((row) => {
              const quantity = Number.parseInt(row.quantity, 10);
              if (row.mode === "other") {
                return {
                  supplyItemId: null as null,
                  customName: row.customName.trim(),
                  quantity,
                };
              }
              return {
                supplyItemId: row.supplyItemId,
                customName: null as null,
                quantity,
              };
            })
          : [],
    };

    const parsed = submitWeeklyCheckInSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fix the form.");
      return;
    }

    startTransition(async () => {
      const result = await submitWeeklyCheckInAction(parsed.data);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(result.message);
      resetForm();
      router.refresh();
    });
  }

  function handleCancel(requestId: string) {
    setError(null);
    setSuccess(null);
    setCancellingId(requestId);

    startTransition(async () => {
      const result = await cancelSupplyRequestAction(requestId);
      setCancellingId(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-base font-medium text-zinc-900 dark:text-zinc-100">
            Do you need supplies?
          </legend>
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 dark:border-zinc-700">
              <input
                type="radio"
                name="needsSupplies"
                value="yes"
                checked={needsSupplies === "yes"}
                onChange={() => {
                  setNeedsSupplies("yes");
                  setError(null);
                  setSuccess(null);
                }}
              />
              Yes
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 dark:border-zinc-700">
              <input
                type="radio"
                name="needsSupplies"
                value="no"
                checked={needsSupplies === "no"}
                onChange={() => {
                  setNeedsSupplies("no");
                  setError(null);
                  setSuccess(null);
                }}
              />
              No
            </label>
          </div>
        </fieldset>

        {needsSupplies === "yes" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                What do you need?
              </h2>
              {rows.map((row, index) => {
                const selectedItem = supplyItems.find(
                  (item) => item.id === row.supplyItemId,
                );
                const unitLabel =
                  row.mode === "other"
                    ? "each"
                    : (selectedItem?.unitLabel ?? "each");

                return (
                  <div
                    key={row.key}
                    className="flex flex-col gap-3 border-b border-zinc-100 pb-4 last:border-b-0 dark:border-zinc-800"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="flex flex-1 flex-col gap-1 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Item
                        </span>
                        <select
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                          value={
                            row.mode === "other" ? "__other__" : row.supplyItemId
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === "__other__") {
                              updateRow(row.key, {
                                mode: "other",
                                supplyItemId: "",
                              });
                              return;
                            }
                            updateRow(row.key, {
                              mode: "catalog",
                              supplyItemId: value,
                              customName: "",
                            });
                          }}
                          required
                        >
                          <option value="">Select an item</option>
                          {itemsByCategory.map(([category, items]) => (
                            <optgroup key={category} label={category}>
                              {items.map((item) => {
                                const taken =
                                  selectedCatalogIds.has(item.id) &&
                                  item.id !== row.supplyItemId;
                                return (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                    disabled={taken}
                                  >
                                    {item.name}
                                    {taken ? " (already selected)" : ""}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                          <option value="__other__">Other</option>
                        </select>
                      </label>

                      <label className="flex w-full flex-col gap-1 text-sm sm:w-36">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Quantity ({unitLabel})
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                          value={row.quantity}
                          onChange={(event) =>
                            updateRow(row.key, { quantity: event.target.value })
                          }
                          required
                        />
                      </label>

                      {rows.length > 1 ? (
                        <button
                          type="button"
                          className="rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          onClick={() =>
                            setRows((current) =>
                              current.filter((entry) => entry.key !== row.key),
                            )
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    {row.mode === "other" ? (
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Item name
                        </span>
                        <input
                          type="text"
                          maxLength={CUSTOM_NAME_MAX}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                          value={row.customName}
                          onChange={(event) =>
                            updateRow(row.key, {
                              customName: event.target.value,
                            })
                          }
                          placeholder="Describe the item"
                          required
                        />
                      </label>
                    ) : null}

                    <p className="sr-only">Item row {index + 1}</p>
                  </div>
                );
              })}

              <button
                type="button"
                className="self-start text-sm font-medium text-zinc-800 underline underline-offset-2 dark:text-zinc-200"
                onClick={() => setRows((current) => [...current, createRow()])}
              >
                Add another item
              </button>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Pickup or delivery?
              </legend>
              <div className="flex gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 dark:border-zinc-700">
                  <input
                    type="radio"
                    name="fulfillmentMethod"
                    value="pickup"
                    checked={fulfillmentMethod === "pickup"}
                    onChange={() => setFulfillmentMethod("pickup")}
                    required
                  />
                  Pickup
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 dark:border-zinc-700">
                  <input
                    type="radio"
                    name="fulfillmentMethod"
                    value="delivery"
                    checked={fulfillmentMethod === "delivery"}
                    onChange={() => setFulfillmentMethod("delivery")}
                    required
                  />
                  Delivery
                </label>
              </div>
            </fieldset>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                Notes to staff{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </span>
              <textarea
                className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                maxLength={NOTES_MAX}
                value={notesToStaff}
                onChange={(event) => setNotesToStaff(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        {needsSupplies !== null ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Comments or concerns{" "}
              <span className="font-normal text-zinc-500">(optional)</span>
            </span>
            <textarea
              className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              maxLength={COMMENTS_MAX}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </label>
        ) : null}

        {needsSupplies !== null ? (
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? "Submitting…" : "Submit check-in"}
          </button>
        ) : null}
      </form>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          {success}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          My requests
        </h2>
        {initialRequests.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You have not submitted any supply requests yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {initialRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-2 border-b border-zinc-100 pb-3 last:border-b-0 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDate(request.createdAt)}
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {itemLabel(request)}
                  </p>
                  <p className="capitalize text-zinc-500">
                    Status: {request.status}
                    {" · "}
                    {request.fulfillmentMethod}
                  </p>
                </div>
                {request.status === "pending" ? (
                  <button
                    type="button"
                    disabled={isPending && cancellingId === request.id}
                    onClick={() => handleCancel(request.id)}
                    className="self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    {cancellingId === request.id ? "Cancelling…" : "Cancel"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
