import Link from "next/link";
import { Suspense } from "react";
import { SupplyRequestForm } from "@/components/forms/supply-request-form";
import { getMySupplyRequests } from "@/lib/supplies/get-my-supply-requests";
import { getSupplyItems } from "@/lib/supplies/get-supply-items";
import type { SupplyItem, SupplyRequest } from "@/types";

export default function SupplyRequestPage() {
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
            Supply Request
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Weekly check-in: tell us if you need supplies, and we will track
            your request.
          </p>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            This is currently available to everyone to add. In the future, auth
            will be present and only verified fosters can submit requests.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading check-in…
            </p>
          }
        >
          <SupplyRequestContent />
        </Suspense>
      </main>
    </div>
  );
}

async function SupplyRequestContent() {
  let supplyItems: SupplyItem[] = [];
  let requests: SupplyRequest[] = [];
  let loadError: string | null = null;

  try {
    [supplyItems, requests] = await Promise.all([
      getSupplyItems(),
      getMySupplyRequests(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load supply request data.";
  }

  if (loadError) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      >
        {loadError}
      </p>
    );
  }

  return (
    <SupplyRequestForm supplyItems={supplyItems} initialRequests={requests} />
  );
}
